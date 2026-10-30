import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.adapters.rss.rss_adapter import RSSAdapter
from app.services.feed_service import (
    strip_html,
    is_valid_article_url,
    get_matched_topics,
    normalize_url_key,
    FeedService,
)
from app.services.cache_service import ArticleCache
from app.main import app

# 1. Test HTML Stripping
def test_strip_html() -> None:
    assert strip_html("<p>Hello <b>World</b>!</p>") == "Hello World !"
    assert strip_html("Hello &amp; welcome &nbsp; to DailyD.") == "Hello & welcome to DailyD."
    assert strip_html("") == ""

# 2. Test URL Validation
def test_url_validation() -> None:
    assert is_valid_article_url("https://example.com/path") is True
    assert is_valid_article_url("http://example.com/path") is False  # Must be https
    assert is_valid_article_url("javascript:alert(1)") is False     # Blocked scheme
    assert is_valid_article_url("//example.com/path") is False       # Protocol-relative
    assert is_valid_article_url("") is False

# 3. Test Topic Extraction
def test_topic_extraction() -> None:
    # Test java match (with negative lookahead for javascript)
    assert "java" in get_matched_topics("Intro to Java Programming", "Learn core JVM concepts.")
    assert "java" not in get_matched_topics("Intro to Javascript", "Web development basics.")
    
    # Test spring boot
    assert "spring_boot" in get_matched_topics("Spring Boot 3.0 features", "New configuration properties.")
    assert "spring_boot" in get_matched_topics("Springboot app", "Microservice setup.")

    # Test LLMs and AI
    assert "llms" in get_matched_topics("Fine-tuning Large Language Models", "Overview of LLMs.")
    assert "openai" in get_matched_topics("ChatGPT integration", "OpenAI API usage.")

# 4. Test RSS Parsing
def test_rss_parsing() -> None:
    rss_xml = b"""<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
        <channel>
            <title>Test Feed</title>
            <link>https://test.com</link>
            <item>
                <title>&lt;p&gt;Sample RSS Article&lt;/p&gt;</title>
                <link>https://example.com/rss-article</link>
                <description>This is a &lt;b&gt;great&lt;/b&gt; RSS description.</description>
                <pubDate>Sat, 04 Jul 2026 15:30:00 GMT</pubDate>
                <dc:creator>Jane Doe</dc:creator>
            </item>
        </channel>
    </rss>
    """
    adapter = RSSAdapter()
    articles = adapter.parse_xml(rss_xml, "Test Source")
    assert len(articles) == 1
    assert articles[0]["title"] == "<p>Sample RSS Article</p>"
    assert articles[0]["url"] == "https://example.com/rss-article"
    assert articles[0]["author"] == "Jane Doe"
    # Sat, 04 Jul 2026 15:30:00 GMT in ms timestamp
    assert articles[0]["publishedAt"] == 1783179000000

# 5. Test Atom Parsing
def test_atom_parsing() -> None:
    atom_xml = b"""<?xml version="1.0" encoding="utf-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Test Atom Feed</title>
        <entry>
            <title>Sample Atom Article</title>
            <link rel="alternate" href="https://example.com/atom-article"/>
            <summary>Short summary of atom article.</summary>
            <updated>2026-07-04T16:00:00Z</updated>
            <author>
                <name>John Smith</name>
            </author>
        </entry>
    </feed>
    """
    adapter = RSSAdapter()
    articles = adapter.parse_xml(atom_xml, "Test Source")
    assert len(articles) == 1
    assert articles[0]["title"] == "Sample Atom Article"
    assert articles[0]["url"] == "https://example.com/atom-article"
    assert articles[0]["author"] == "John Smith"
    # 2026-07-04T16:00:00Z -> 1783180800000
    assert articles[0]["publishedAt"] == 1783180800000

# 6. Test Deduplication, Sorting, and Categorization in FeedService
@pytest.mark.asyncio
async def test_feed_service_processing() -> None:
    mock_adapter = AsyncMock(spec=RSSAdapter)
    
    # Return two articles with overlapping normalized URLs, and differing pub dates
    mock_feed_1 = [
        {
            "title": "Dup Article",
            "url": "https://example.com/dup?utm_source=rss",
            "description": "First instance.",
            "publishedAt": 1000,
            "author": "Author A",
        },
        {
            "title": "Unique Article 1",
            "url": "https://example.com/unique-1",
            "description": "Unique description.",
            "publishedAt": 3000,
            "author": "Author B",
        }
    ]

    mock_feed_2 = [
        {
            "title": "Dup Article (older)",
            "url": "https://example.com/dup/",
            "description": "Second instance, trailing slash.",
            "publishedAt": 500,  # Should be discarded as duplicate and older
            "author": "Author A",
        },
        {
            "title": "Unique Article 2",
            "url": "https://example.com/unique-2",
            "description": "Kafka streams and Spring boot integration",
            "publishedAt": 4000,
            "author": "Author C",
        }
    ]

    mock_adapter.fetch_feed.side_effect = [mock_feed_1, mock_feed_2] + [[]] * 500

    service = FeedService(mock_adapter)
    articles = await service.get_aggregated_feed()

    # Total unique should be 3: Unique 2, Unique 1, Dup Article
    assert len(articles) == 3

    # Sorting verification (newest first):
    # Unique 2 (4000) -> Unique 1 (3000) -> Dup Article (1000)
    assert articles[0]["title"] == "Unique Article 2"
    assert articles[1]["title"] == "Unique Article 1"
    assert articles[2]["title"] == "Dup Article"

    # Topic extraction verification:
    # Unique Article 2 has description with kafka streams and spring boot
    assert "kafka" in articles[0]["topics"]
    assert "spring_boot" in articles[0]["topics"]

# 7. Test GET /api/v1/articles serves the pre-serialized cache (gzip + ETag)
MOCK_ARTICLES = [
    {
        "title": "Service Article 1",
        "url": "https://example.com/1",
        "source": "Dev.to",
        "author": "Jane",
        "publishedAt": 1234567,
        "description": "Description 1 about Spring Boot",
        "topics": ["java"],
        "isOfficial": False,
        "isTutorial": False,
        "isCommunity": True,
        "isNews": False,
    },
    {
        "title": "New MacBook Pro with M5 chip",
        "url": "https://example.com/2",
        "source": "Apple Newsroom",
        "author": None,
        "publishedAt": 2234567,
        "description": "Apple announces a new laptop.",
        "topics": ["apple", "laptops"],
        "isOfficial": True,
        "isTutorial": None,
        "isCommunity": None,
        "isNews": True,
    },
]


async def _filled_cache() -> ArticleCache:
    cache = ArticleCache()
    service = AsyncMock(spec=FeedService)
    service.get_aggregated_feed.return_value = MOCK_ARTICLES
    await cache.refresh_cache(service)
    return cache


@pytest.mark.asyncio
async def test_cache_keeps_previous_articles_when_refresh_is_empty() -> None:
    cache = await _filled_cache()
    empty = AsyncMock(spec=FeedService)
    empty.get_aggregated_feed.return_value = []
    await cache.refresh_cache(empty)
    articles, _ = await cache.get_cached_articles()
    assert len(articles) == 2


def test_get_articles_endpoint_gzip_and_etag() -> None:
    import asyncio
    cache = asyncio.run(_filled_cache())
    client = TestClient(app)

    with patch("app.api.v1.endpoints.articles.article_cache", cache):
        response = client.get("/api/v1/articles")
        assert response.status_code == 200
        assert response.headers["content-encoding"] == "gzip"
        etag = response.headers["etag"]

        data = response.json()
        assert data["total"] == 2
        assert data["articleCount"] == 2
        assert data["articles"][0]["title"] == "Service Article 1"
        assert data["articles"][0]["isCommunity"] is True
        assert data["lastUpdated"] > 0

        not_modified = client.get("/api/v1/articles", headers={"If-None-Match": etag})
        assert not_modified.status_code == 304


def test_get_articles_returns_503_while_warming_up() -> None:
    cache = ArticleCache()
    cache._ready.set()  # simulate "first refresh finished but produced nothing"
    client = TestClient(app)
    with patch("app.api.v1.endpoints.articles.article_cache", cache):
        response = client.get("/api/v1/articles")
        assert response.status_code == 503


# 8. Assistant search reads from the cache instead of refetching every feed
def test_assistant_search_uses_cache() -> None:
    import asyncio
    cache = asyncio.run(_filled_cache())
    client = TestClient(app)
    with patch("app.api.v1.endpoints.assistant.article_cache", cache), patch.object(
        FeedService, "get_aggregated_feed"
    ) as live_fetch:
        response = client.post("/api/v1/devd-assistant/search", json={"query": "macbook"})
        assert response.status_code == 200
        data = response.json()
        assert [a["title"] for a in data["articles"]] == ["New MacBook Pro with M5 chip"]
        assert data["total"] == 1
        live_fetch.assert_not_called()


# 9. URL dedupe keys
def test_normalize_url_key() -> None:
    # trailing slash, www and tracking params collapse
    assert normalize_url_key("https://www.Example.com/post/") == normalize_url_key(
        "https://example.com/post?utm_source=rss&utm_medium=feed"
    )
    # meaningful query params (WordPress ?p=) keep posts distinct
    assert normalize_url_key("https://blog.example.com/?p=1") != normalize_url_key(
        "https://blog.example.com/?p=2"
    )


# 10. Big tech / gadget topics
def test_gadget_topics() -> None:
    topics = get_matched_topics("Apple unveils iPhone 18 and new MacBook Air", "")
    assert {"apple", "smartphones", "laptops", "big_tech"} <= set(topics)
    assert "android" in get_matched_topics("Samsung Galaxy S26 review", "One UI 8 on Android 17")
    assert "chips_hardware" in get_matched_topics("NVIDIA RTX 5090 benchmarks", "")


# 11. Cold start deadline skips slow feeds instead of waiting for them
@pytest.mark.asyncio
async def test_deadline_skips_slow_feeds() -> None:
    import asyncio

    calls = {"n": 0}

    async def fake_fetch(client, name, url):
        calls["n"] += 1
        if calls["n"] == 1:
            return [{"title": "Fast", "url": "https://example.com/fast", "description": "", "publishedAt": 1000}]
        await asyncio.sleep(5)
        return [{"title": "Slow", "url": f"https://example.com/slow{calls['n']}", "description": "", "publishedAt": 2000}]

    adapter = AsyncMock(spec=RSSAdapter)
    adapter.fetch_feed.side_effect = fake_fetch
    articles = await FeedService(adapter).get_aggregated_feed(deadline_seconds=0.2)
    assert [a["title"] for a in articles] == ["Fast"]
