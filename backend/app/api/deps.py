from typing import Generator
from app.adapters.rss.rss_adapter import RSSAdapter
from app.services.feed_service import FeedService

def get_db() -> Generator[None, None, None]:
    """
    Dependency injector for database sessions.
    Placeholder for future database integration phases.
    """
    try:
        yield None
    finally:
        pass

def get_rss_adapter() -> RSSAdapter:
    """Dependency injector for the RSSAdapter client."""
    return RSSAdapter(timeout_seconds=5.0)

def get_feed_service() -> FeedService:
    """Dependency injector for FeedService orchestrations."""
    return FeedService(get_rss_adapter())
