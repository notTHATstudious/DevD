import asyncio
import logging
import time
from typing import List, Dict, Any, Tuple
from app.services.feed_service import FeedService

logger = logging.getLogger("app.cache_service")

class ArticleCache:
    def __init__(self):
        # The cached list of fully processed and ranked articles
        self._cache: List[Dict[str, Any]] = []
        self._last_updated: int = 0
        self._lock = asyncio.Lock()

    async def refresh_cache(self, feed_service: FeedService) -> None:
        """Fetch fresh articles and update the cache in the background."""
        try:
            logger.info("Starting background cache refresh...")
            # FeedService.get_aggregated_feed already uses asyncio.gather internally
            articles = await feed_service.get_aggregated_feed()
            async with self._lock:
                self._cache = articles
                self._last_updated = int(time.time() * 1000)
            logger.info(f"Cache refreshed successfully. Cached {len(articles)} articles.")
        except Exception as e:
            # If refresh fails, log error and continue serving last successful cache
            logger.error(f"Failed to refresh cache: {e}", exc_info=True)

    async def get_cached_articles(self) -> Tuple[List[Dict[str, Any]], int]:
        """Return the currently cached articles and last updated timestamp."""
        async with self._lock:
            return list(self._cache), self._last_updated

# Singleton instance to be used across the application
article_cache = ArticleCache()
