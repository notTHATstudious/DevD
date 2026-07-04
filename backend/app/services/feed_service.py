import logging
import asyncio
import re
import html
from typing import List, Dict, Any
from urllib.parse import urlparse

import httpx
from app.adapters.rss.rss_adapter import RSSAdapter
from app.adapters.rss.feed_sources import FEED_SOURCES

logger = logging.getLogger("app.feed_service")

BLOCKED_SCHEME_PREFIXES = (
    "javascript:",
    "data:",
    "file:",
    "blob:",
    "vbscript:",
    "about:",
    "mailto:",
    "tel:",
)

# Topic Regex Map matching src/lib/preferences.ts
TOPIC_REGEX_MAP = {
    "java": re.compile(r"\b(java|jvm|jdk|jre|openjdk)\b(?!script)", re.IGNORECASE),
    "spring_boot": re.compile(r"\b(spring[- ]?boot|springboot)\b", re.IGNORECASE),
    "spring_cloud": re.compile(r"\b(spring[- ]?cloud)\b", re.IGNORECASE),
    "kafka": re.compile(r"\b(kafka|apache[- ]kafka|confluent|event[- ]streaming)\b", re.IGNORECASE),
    "microservices": re.compile(r"\b(micro[- ]?services?|distributed[- ]?tracing)\b", re.IGNORECASE),
    "docker": re.compile(r"\b(docker|container\s+image|dockerfile)\b", re.IGNORECASE),
    "kubernetes": re.compile(r"\b(kubernetes|k8s|kubelet|kubectl|helm)\b", re.IGNORECASE),
    "aws": re.compile(r"\b(aws|amazon\s+web\s+services|dynamodb|s3|iam|lambda)\b", re.IGNORECASE),
    "azure": re.compile(r"\b(azure|cosmosdb)\b", re.IGNORECASE),
    "gcp": re.compile(r"\b(gcp|google\s+cloud|bigquery|spanner)\b", re.IGNORECASE),
    "devops": re.compile(r"\b(devops|sre|ansible|puppet|chef|terraform|opentofu)\b", re.IGNORECASE),
    "ci_cd": re.compile(r"\b(ci\/cd|continuous[- ]?integration|continuous[- ]?deployment|github[- ]?actions|jenkins)\b", re.IGNORECASE),
    "databases": re.compile(r"\b(databases?|rdbms|nosql|sql|indexing|query[- ]?optimization)\b", re.IGNORECASE),
    "postgresql": re.compile(r"\b(postgresql|postgres)\b", re.IGNORECASE),
    "mongodb": re.compile(r"\b(mongodb|mongo)\b", re.IGNORECASE),
    "redis": re.compile(r"\b(redis)\b", re.IGNORECASE),
    "ai_engineering": re.compile(r"\b(ai[- ]?engineering|generative[- ]?ai|genai|prompt[- ]?engineering|vector[- ]?database)\b", re.IGNORECASE),
    "llms": re.compile(r"\b(llms?|large[- ]?language[- ]?models?|rag|fine[- ]?tuning|llama|ollama)\b", re.IGNORECASE),
    "openai": re.compile(r"\b(openai|chatgpt|gpt[- ]?[45])\b", re.IGNORECASE),
    "anthropic": re.compile(r"\b(anthropic|claude)\b", re.IGNORECASE),
    "system_design": re.compile(r"\b(system[- ]?design|scalability|load[- ]?balancing|rate[- ]?limiting|caching|high[- ]?availability)\b", re.IGNORECASE),
    "backend_engineering": re.compile(r"\b(backend|rest[- ]?apis?|graphql|grpc|routing|middleware)\b", re.IGNORECASE),
    "software_architecture": re.compile(r"\b(software[- ]?architecture|design[- ]?patterns|domain[- ]?driven[- ]?design|ddd|event[- ]?sourcing)\b", re.IGNORECASE),
    "security": re.compile(r"\b(security|cybersecurity|owasp|cryptography|encryption|vulnerability|exploit|oauth|jwt)\b", re.IGNORECASE),
    "performance": re.compile(r"\b(performance|latency|concurrency|async|threads?|throughput|profiling|optimization)\b", re.IGNORECASE),
    "testing": re.compile(r"\b(testing|unit[- ]?tests?|integration[- ]?tests?|tdd|mocking|vitest|junit)\b", re.IGNORECASE),
    "cloud_native": re.compile(r"\b(cloud[- ]?native|cncf|serverless|envoy|istio)\b", re.IGNORECASE),
}

def strip_html(html_content: str) -> str:
    if not html_content:
        return ""
    # Remove HTML tags
    text = re.sub(r"<[^>]*>", " ", html_content)
    # Unescape HTML entities
    text = html.unescape(text)
    # Normalize whitespaces
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def is_valid_article_url(url: str) -> bool:
    trimmed = url.strip()
    if not trimmed:
        return False
    lower = trimmed.lower()
    if any(lower.startswith(prefix) for prefix in BLOCKED_SCHEME_PREFIXES):
        return False
    if trimmed.startswith("//"):
        return False
    try:
        parsed = urlparse(trimmed)
        if parsed.scheme != "https":
            return False
        if not parsed.netloc:
            return False
        return True
    except Exception:
        return False

def get_matched_topics(title: str, description: str) -> List[str]:
    text = f"{title} {description}".lower()
    matched = []
    for key, pattern in TOPIC_REGEX_MAP.items():
        if pattern.search(text):
            matched.append(key)
    return matched

class FeedService:
    def __init__(self, rss_adapter: RSSAdapter):
        self.rss_adapter = rss_adapter

    async def get_aggregated_feed(self) -> List[Dict[str, Any]]:
        """
        Orchestrates fetching all sources, normalizes articles, and processes them.
        """
        async with httpx.AsyncClient() as client:
            tasks = [
                self.rss_adapter.fetch_feed(client, source["name"], source["url"])
                for source in FEED_SOURCES
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

        all_articles = []
        for source, feed_result in zip(FEED_SOURCES, results):
            if isinstance(feed_result, Exception):
                logger.warning(f"Error fetching feed {source['name']}: {feed_result}")
                continue
            
            for item in feed_result:
                title = strip_html(item.get("title") or "")
                url = (item.get("url") or "").strip()
                if not title or not url or not is_valid_article_url(url):
                    continue

                published_at = item.get("publishedAt")
                if published_at is None:
                    continue

                description = strip_html(item.get("description") or "")[:400]
                author = item.get("author")
                if author:
                    author = author.strip() or None

                topics = get_matched_topics(title, description)

                all_articles.append({
                    "title": title,
                    "url": url,
                    "source": source["name"],
                    "author": author,
                    "publishedAt": published_at,
                    "description": description,
                    "topics": topics,
                    "isOfficial": source.get("is_official"),
                    "isTutorial": source.get("is_tutorial"),
                    "isCommunity": source.get("is_community"),
                    "isNews": source.get("is_news"),
                })

        # Deduplicate and sort
        seen_keys = set()
        deduped_articles = []
        for a in all_articles:
            # key = URL path without query params or trailing slash, lowercased
            clean_url = a["url"].split("?")[0].rstrip("/").lower()
            if clean_url in seen_keys:
                continue
            seen_keys.add(clean_url)
            deduped_articles.append(a)

        # Sort by publishedAt descending
        deduped_articles.sort(key=lambda x: x["publishedAt"], reverse=True)
        return deduped_articles
