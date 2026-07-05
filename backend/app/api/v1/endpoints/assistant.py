from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from app.schemas.article import Article
from app.services.feed_service import FeedService
from app.api.deps import get_feed_service

router = APIRouter()

class SearchRequest(BaseModel):
    query: str

class SearchResponse(BaseModel):
    summary: str
    articles: List[Article]

def get_relevance_score(article: dict, query_terms: List[str]) -> int:
    search_text = " ".join([
        article.get("title", ""),
        article.get("description", ""),
        article.get("source", ""),
        article.get("author") or "",
        " ".join(article.get("topics", []))
    ]).lower()
    
    # Must contain all terms for a match
    if not all(term in search_text for term in query_terms):
        return 0
        
    # Boost score based on exact matches and occurrences
    score = 1
    phrase = " ".join(query_terms)
    if phrase in search_text:
        score += 5
        
    if phrase in article.get("title", "").lower():
        score += 10
        
    for term in query_terms:
        score += search_text.count(term)
        
    return score

@router.post("/search", response_model=SearchResponse)
async def search_assistant(
    request: SearchRequest,
    feed_service: FeedService = Depends(get_feed_service)
) -> SearchResponse:
    articles = await feed_service.get_aggregated_feed()
    
    query = request.query.strip().lower()
    if not query:
        return SearchResponse(summary="Please provide a search query.", articles=[])
        
    query_terms = [t for t in query.split() if t]
    
    scored_articles = []
    for article in articles:
        score = get_relevance_score(article, query_terms)
        if score > 0:
            scored_articles.append((score, article))
            
    # Sort by score descending, then publishedAt descending
    scored_articles.sort(key=lambda x: (x[0], x[1].get("publishedAt", 0)), reverse=True)
    
    # Take top 15 results
    top_articles = [a[1] for a in scored_articles[:15]]
    
    if scored_articles:
        summary = f"Found {len(scored_articles)} relevant articles about {request.query}."
    else:
        summary = f"I couldn't find any articles matching '{request.query}'."
    
    return SearchResponse(
        summary=summary,
        articles=top_articles
    )
