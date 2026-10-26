import asyncio
import gzip
import hashlib
import json
import logging
import time
from typing import List, Dict, Any, Tuple
from app.services.feed_service import FeedService
from app.services.search_service import SearchIndex

logger = logging.getLogger("app.cache_service")


class ArticleCache:
    def __init__(self):
        # The cached list of fully processed and ranked articles
        self._cache: List[Dict[str, Any]] = []
        self._last_updated: int = 0
        # Pre-serialized /articles payload so requests don't re-encode ~1500 items.
        self._payload: bytes = b""
        self._payload_gzip: bytes = b""
        self._etag: str = ""
        self._search_index: SearchIndex = SearchIndex.build([])
        self._lock = asyncio.Lock()
        self._refresh_lock = asyncio.Lock()
        self._ready = asyncio.Event()

    async def refresh_cache(self, feed_service: FeedService) -> None:
        """Fetch fresh articles and update the cache in the background."""
        if self._refresh_lock.locked():
            # A refresh is already running; don't stampede the upstream feeds.
            return
        async with self._refresh_lock:
            try:
                started = time.perf_counter()
                logger.info("Starting background cache refresh...")
                articles = await feed_service.get_aggregated_feed()
                if not articles and self._cache:
                    logger.warning("Refresh returned no articles; keeping previous cache.")
                    return
                last_updated = int(time.time() * 1000)
                payload = json.dumps(
                    {
                        "total": len(articles),
                        "articles": articles,
                        "lastUpdated": last_updated,
                        "articleCount": len(articles),
                    },
                    separators=(",", ":"),
                    ensure_ascii=False,
                ).encode("utf-8")
                search_index = SearchIndex.build(articles)
                async with self._lock:
                    self._search_index = search_index
                    self._cache = articles
                    self._last_updated = last_updated
                    self._payload = payload
                    self._payload_gzip = gzip.compress(payload, compresslevel=6)
                    self._etag = '"' + hashlib.sha1(payload).hexdigest()[:20] + '"'
                logger.info(
                    f"Cache refreshed: {len(articles)} articles in "
                    f"{time.perf_counter() - started:.1f}s "
                    f"({len(payload) // 1024} KB, {len(self._payload_gzip) // 1024} KB gzipped)."
                )
            except Exception as e:
                # If refresh fails, log error and continue serving last successful cache
                logger.error(f"Failed to refresh cache: {e}", exc_info=True)
            finally:
                self._ready.set()

    async def wait_until_ready(self, timeout: float) -> None:
        """Wait for the first refresh after a cold start, up to `timeout` seconds."""
        if self._ready.is_set():
            return
        try:
            await asyncio.wait_for(self._ready.wait(), timeout=timeout)
        except asyncio.TimeoutError:
            pass

    async def get_cached_articles(self) -> Tuple[List[Dict[str, Any]], int]:
        """Return the currently cached articles and last updated timestamp."""
        async with self._lock:
            return list(self._cache), self._last_updated

    async def get_search_index(self) -> SearchIndex:
        """Search index built from the current articles (rebuilt on every refresh)."""
        async with self._lock:
            return self._search_index

    async def get_payload(self) -> Tuple[bytes, bytes, str]:
        """Return (json bytes, gzipped json bytes, etag) for the articles endpoint."""
        async with self._lock:
            return self._payload, self._payload_gzip, self._etag


# Singleton instance to be used across the application
article_cache = ArticleCache()
