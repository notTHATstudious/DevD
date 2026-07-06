from fastapi import APIRouter, Depends
from app.schemas.article import ArticleResponse
from app.services.cache_service import article_cache

router = APIRouter()

@router.get("/articles", response_model=ArticleResponse)
async def get_articles() -> ArticleResponse:
    """
    Fetch articles from the in-memory cache.
    The cache is refreshed in the background automatically.
    """
    articles, last_updated = await article_cache.get_cached_articles()
    return ArticleResponse(
        total=len(articles),
        articles=articles,
        lastUpdated=last_updated,
        articleCount=len(articles)
    )
