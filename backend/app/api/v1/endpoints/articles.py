from fastapi import APIRouter, Request, Response, status
from fastapi.responses import JSONResponse
from app.services.cache_service import article_cache

router = APIRouter()

# On a cold start the first refresh takes a while; hold the request this long
# rather than answering with an empty feed.
COLD_START_WAIT_SECONDS = 25

# Browsers/CDNs may reuse a response for a minute and serve it stale while revalidating.
CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300"


@router.get("/articles")
async def get_articles(request: Request) -> Response:
    """
    Serve articles from the in-memory cache as a pre-serialized (and
    pre-gzipped) payload. The cache is refreshed in the background.
    """
    await article_cache.wait_until_ready(COLD_START_WAIT_SECONDS)
    payload, payload_gzip, etag = await article_cache.get_payload()

    if not payload:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "success": False,
                "error": {"message": "Feed is warming up, try again shortly.", "details": {}},
            },
            headers={"Retry-After": "5"},
        )

    headers = {"ETag": etag, "Cache-Control": CACHE_CONTROL, "Vary": "Accept-Encoding"}
    if request.headers.get("if-none-match") == etag:
        return Response(status_code=status.HTTP_304_NOT_MODIFIED, headers=headers)

    if "gzip" in request.headers.get("accept-encoding", ""):
        headers["Content-Encoding"] = "gzip"
        return Response(content=payload_gzip, media_type="application/json", headers=headers)
    return Response(content=payload, media_type="application/json", headers=headers)
