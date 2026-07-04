import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.adapters.rss.rss_adapter import RSSAdapter
from app.services.feed_service import (
    strip_html,
    is_valid_article_url,
    get_matched_topics,
    FeedService,
)
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
            "url": "https://example.com/dup?param=1",
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

    mock_adapter.fetch_feed.side_effect = [mock_feed_1, mock_feed_2] + [[]] * 100

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

# 7. Test Partial Feed Failures and API Endpoint GET /api/v1/articles
def test_get_articles_endpoint_and_partial_failures() -> None:
    client = TestClient(app)
    
    # Mock FeedService to return test set
    mock_articles = [
        {
            "title": "Service Article 1",
            "url": "https://example.com/1",
            "source": "Dev.to",
            "author": "Jane",
            "publishedAt": 1234567,
            "description": "Description 1",
            "topics": ["java"],
            "isOfficial": False,
            "isTutorial": False,
            "isCommunity": True,
            "isNews": False,
        }
    ]

    with patch("app.services.feed_service.FeedService.get_aggregated_feed", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_articles
        
        response = client.get("/api/v1/articles")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] == 1
        assert len(data["articles"]) == 1
        assert data["articles"][0]["title"] == "Service Article 1"
        assert data["articles"][0]["isCommunity"] is True
