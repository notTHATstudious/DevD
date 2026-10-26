from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.schemas.article import Article
from app.services.cache_service import article_cache
from app.services.search_service import search

router = APIRouter()


class SearchRequest(BaseModel):
    query: str = Field(..., max_length=200)
    limit: int = Field(default=20, ge=1, le=50)
    offset: int = Field(default=0, ge=0, le=1000)


class SearchResponse(BaseModel):
    summary: str
    articles: List[Article]
    total: int = 0
    # Set when typos were corrected, e.g. "kubernates" → "kubernetes".
    didYouMean: Optional[str] = None
    # Follow-up searches based on the topics found in the results.
    suggestions: List[str] = []
    # True when no article matched every word and these are the closest matches.
    partial: bool = False


@router.post("/search", response_model=SearchResponse)
async def search_assistant(request: SearchRequest) -> SearchResponse:
    query = request.query.strip()
    if not query:
        return SearchResponse(summary="Please provide a search query.", articles=[])

    # Search the in-memory index built on each cache refresh; fetching every
    # feed per request took seconds and hammered the upstream sites.
    await article_cache.wait_until_ready(10)
    index = await article_cache.get_search_index()
    result = search(index, query, limit=request.limit, offset=request.offset)

    return SearchResponse(
        summary=result.summary,
        articles=result.articles,
        total=result.total,
        didYouMean=result.did_you_mean,
        suggestions=result.suggestions,
        partial=result.partial,
    )
