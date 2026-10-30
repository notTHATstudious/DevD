import logging
import time
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.api.v1.router import api_router
from app.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging
from app.services.cache_service import article_cache
from app.api.deps import get_feed_service

async def cache_refresh_task():
    # Cold start: publish whatever feeds answer within a few seconds so the
    # first visitor isn't kept waiting, then immediately fetch everything.
    await article_cache.refresh_cache(
        get_feed_service(), deadline_seconds=settings.COLD_START_DEADLINE_SECONDS
    )
    while True:
        await article_cache.refresh_cache(get_feed_service())
        await asyncio.sleep(settings.CACHE_REFRESH_SECONDS)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm the cache in the background so the server accepts requests (and
    # passes health checks) immediately instead of waiting on ~150 feeds.
    task = None
    if settings.BACKGROUND_REFRESH:
        task = asyncio.create_task(cache_refresh_task())
    yield
    if task:
        task.cancel()

# Initialize logging before FastAPI startup
setup_logging()
logger = logging.getLogger("app")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    docs_url="/docs" if settings.APP_ENV != "production" else None,
    redoc_url="/redoc" if settings.APP_ENV != "production" else None,
    lifespan=lifespan,
)

# Apply CORS Middleware configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    # No cookies or auth headers are used; credentials + "*" is also invalid CORS.
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "If-None-Match"],
    expose_headers=["ETag", "X-Response-Time-Ms"],
    max_age=86400,
)

# Compress other JSON responses (e.g. assistant search). /articles is
# pre-gzipped and already carries Content-Encoding, so it is passed through.
app.add_middleware(GZipMiddleware, minimum_size=1024)

# Logging Middleware to record execution times and route hits
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.perf_counter()
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration in milliseconds
    duration_ms = (time.perf_counter() - start_time) * 1000
    
    logger.info(
        f"Method={request.method} Path={request.url.path} "
        f"Status={response.status_code} Duration={duration_ms:.2f}ms"
    )
    
    # Return custom header for performance monitoring
    response.headers["X-Response-Time-Ms"] = f"{duration_ms:.2f}"
    return response

# Register Centralized Error and Exception Handlers
register_exception_handlers(app)

# Mount Routers (base router handles '/' and '/health')
app.include_router(api_router)
