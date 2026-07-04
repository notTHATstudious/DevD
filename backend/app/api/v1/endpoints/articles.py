from fastapi import APIRouter, Depends
from app.schemas.article import ArticleResponse
from app.services.feed_service import FeedService
from app.api.deps import get_feed_service

router = APIRouter()

@router.get("/articles", response_model=ArticleResponse)
async def get_articles(
    feed_service: FeedService = Depends(get_feed_service)
) -> ArticleResponse:
    """
    Fetch, aggregate, normalize, deduplicate, and sort articles from all configured feed sources.
    """
    articles = await feed_service.get_aggregated_feed()
    return ArticleResponse(
        total=len(articles),
        articles=articles
    )
