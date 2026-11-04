"""
Small, dependency-free protections for a public API:

- security headers on every response
- request body size limit
- in-memory per-IP rate limiting (fine for a single server instance)
"""
import time
from collections import defaultdict, deque
from typing import Deque, Dict

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.config import settings

# Largest request body we accept (the contact form is the biggest, ~4 KB).
MAX_BODY_BYTES = 16 * 1024

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    # The API only returns JSON; nothing should ever be rendered or framed.
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Cross-Origin-Resource-Policy": "cross-origin",
}


def _error(code: int, message: str, headers: Dict[str, str] | None = None) -> JSONResponse:
    return JSONResponse(
        status_code=code,
        content={"success": False, "error": {"message": message, "details": {}}},
        headers=headers,
    )


def client_ip(request: Request) -> str:
    # Behind a proxy, run uvicorn with --proxy-headers so this is the real client.
    return request.client.host if request.client else "unknown"


class RateLimiter:
    """Sliding-window limiter: at most `limit` hits per `window` seconds per key."""

    def __init__(self, limit: int, window: float):
        self.limit = limit
        self.window = window
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)

    def allow(self, key: str, now: float | None = None) -> bool:
        now = time.monotonic() if now is None else now
        hits = self._hits[key]
        while hits and now - hits[0] > self.window:
            hits.popleft()
        if len(hits) >= self.limit:
            return False
        hits.append(now)
        # Keep memory bounded if many different IPs show up.
        if len(self._hits) > 10_000:
            for k in [k for k, v in self._hits.items() if not v or now - v[-1] > self.window]:
                del self._hits[k]
        return True

    def retry_after(self, key: str, now: float | None = None) -> int:
        now = time.monotonic() if now is None else now
        hits = self._hits.get(key)
        if not hits:
            return 0
        return max(1, int(self.window - (now - hits[0])) + 1)


# Per-route limits, keyed by path.
RATE_LIMITS: Dict[str, RateLimiter] = {
    "/api/v1/devd-assistant/search": RateLimiter(limit=60, window=60),
    "/api/v1/contact": RateLimiter(limit=5, window=15 * 60),
}
GLOBAL_LIMIT = RateLimiter(limit=300, window=60)


def register_security(app: FastAPI) -> None:
    @app.middleware("http")
    async def security_middleware(request: Request, call_next):
        if request.method in ("POST", "PUT", "PATCH"):
            length = request.headers.get("content-length")
            if length is None:
                return _error(status.HTTP_411_LENGTH_REQUIRED, "Content-Length required.")
            if not length.isdigit() or int(length) > MAX_BODY_BYTES:
                return _error(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Request too large.")

        if request.method != "OPTIONS" and request.url.path != "/health":
            ip = client_ip(request)
            checks = [(GLOBAL_LIMIT, ip)]
            route_limiter = RATE_LIMITS.get(request.url.path)
            if route_limiter:
                checks.append((route_limiter, f"{request.url.path}|{ip}"))
            for limiter, key in checks:
                if not limiter.allow(key):
                    return _error(
                        status.HTTP_429_TOO_MANY_REQUESTS,
                        "Too many requests. Please slow down and try again shortly.",
                        {"Retry-After": str(limiter.retry_after(key))},
                    )

        response = await call_next(request)
        for name, value in SECURITY_HEADERS.items():
            response.headers.setdefault(name, value)
        if settings.APP_ENV == "production":
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        return response
