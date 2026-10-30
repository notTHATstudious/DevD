import logging
import asyncio
import re
import html
import time
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse, parse_qsl, urlencode

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

# Many feeds (Reddit, Medium, Cloudflare-fronted blogs) reject httpx's default UA.
USER_AGENT = "Mozilla/5.0 (compatible; DailyDBot/3.2; +https://dailyd.app)"

# How many feeds to fetch at once. ~150 sources at once trips rate limits.
MAX_CONCURRENT_FETCHES = 24

# Keep the payload small: the newest N items per source, and N overall.
MAX_ARTICLES_PER_SOURCE_FEED = 25
MAX_TOTAL_ARTICLES = 1500
MAX_DESCRIPTION_CHARS = 300

# Anything dated further than this into the future is a broken feed timestamp.
MAX_FUTURE_SKEW_MS = 24 * 60 * 60 * 1000

TRACKING_PARAM_PREFIXES = ("utm_", "mc_", "fbclid", "gclid", "ref", "source", "cmpid")

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
    # ---------- Big tech & gadgets ----------
    "apple": re.compile(r"\b(apple|iphones?|ipad|ipados|macbook|imac|mac\s?os|macos|ios\s?\d*|watchos|visionos|vision\s+pro|airpods|wwdc|swiftui|xcode)\b", re.IGNORECASE),
    "android": re.compile(r"\b(android|pixel\s?\d*|one\s?ui|wear\s?os|jetpack\s+compose|kotlin)\b", re.IGNORECASE),
    "smartphones": re.compile(r"\b(smartphones?|phones?|iphones?|galaxy\s+[szaf]\d*|pixel\s?\d+|oneplus|xiaomi|oppo|vivo|foldables?|snapdragon)\b", re.IGNORECASE),
    "laptops": re.compile(r"\b(laptops?|macbook|chromebooks?|thinkpad|surface\s+(pro|laptop)|xps|zenbook|copilot\+\s?pc|ultrabook)\b", re.IGNORECASE),
    "chips_hardware": re.compile(r"\b(cpus?|gpus?|chips?|silicon|semiconductors?|nvidia|amd|intel|qualcomm|arm|tsmc|rtx\s?\d+|ryzen|m[1-9]\s+(pro|max|ultra|chip))\b", re.IGNORECASE),
    "big_tech": re.compile(r"\b(apple|google|alphabet|microsoft|meta|amazon|nvidia|samsung|tesla|netflix)\b", re.IGNORECASE),
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


def truncate(text: str, limit: int) -> str:
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(" ", 1)[0]
    return cut.rstrip(" ,.;:-") + "…"


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


def normalize_url_key(url: str) -> str:
    """
    Stable dedupe key. Host is case-insensitive, path is not (many CMSs are
    case-sensitive). Tracking params are dropped but meaningful ones such as
    WordPress `?p=123` are kept, so distinct posts don't collapse into one.
    """
    parsed = urlparse(url.strip())
    query = [
        (k, v) for k, v in parse_qsl(parsed.query, keep_blank_values=True)
        if not k.lower().startswith(TRACKING_PARAM_PREFIXES)
    ]
    path = parsed.path.rstrip("/") or "/"
    key = f"{parsed.netloc.lower().removeprefix('www.')}{path}"
    if query:
        key += "?" + urlencode(sorted(query))
    return key


def get_matched_topics(title: str, description: str) -> List[str]:
    text = f"{title} {description}"
    matched = []
    for key, pattern in TOPIC_REGEX_MAP.items():
        if pattern.search(text):
            matched.append(key)
    return matched


class FeedService:
    def __init__(self, rss_adapter: RSSAdapter):
        self.rss_adapter = rss_adapter

    async def get_aggregated_feed(self, deadline_seconds: Optional[float] = None) -> List[Dict[str, Any]]:
        """
        Orchestrates fetching all sources, normalizes articles, and processes them.

        With `deadline_seconds`, feeds that haven't answered by then are skipped,
        so a cold start can serve most of the feed in a few seconds.
        """
        semaphore = asyncio.Semaphore(MAX_CONCURRENT_FETCHES)

        async def fetch(client: httpx.AsyncClient, source: Dict[str, Any]):
            async with semaphore:
                return await self.rss_adapter.fetch_feed(client, source["name"], source["url"])

        async with httpx.AsyncClient(
            follow_redirects=True,
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8",
            },
            limits=httpx.Limits(max_connections=MAX_CONCURRENT_FETCHES),
        ) as client:
            tasks = [asyncio.ensure_future(fetch(client, source)) for source in FEED_SOURCES]
            _, pending = await asyncio.wait(tasks, timeout=deadline_seconds)
            for task in pending:
                task.cancel()
            if pending:
                await asyncio.gather(*pending, return_exceptions=True)
                logger.info(f"Skipped {len(pending)} slow feeds to meet the {deadline_seconds}s deadline.")
            results = [
                t.exception() or t.result() if not t.cancelled() else asyncio.CancelledError()
                for t in tasks
            ]

        now_ms = int(time.time() * 1000)
        all_articles = []
        for source, feed_result in zip(FEED_SOURCES, results):
            if isinstance(feed_result, BaseException):
                logger.warning(f"Error fetching feed {source['name']}: {feed_result}")
                continue

            kept = 0
            for item in feed_result:
                if kept >= MAX_ARTICLES_PER_SOURCE_FEED:
                    break
                title = strip_html(item.get("title") or "")
                url = (item.get("url") or "").strip()
                if not title or not url or not is_valid_article_url(url):
                    continue

                published_at = item.get("publishedAt")
                if published_at is None or published_at > now_ms + MAX_FUTURE_SKEW_MS:
                    continue

                description = truncate(strip_html(item.get("description") or ""), MAX_DESCRIPTION_CHARS)
                author = item.get("author")
                if author:
                    author = strip_html(author) or None

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
                kept += 1

        # Newest first, so dedupe keeps the most recent copy of a story.
        all_articles.sort(key=lambda x: x["publishedAt"], reverse=True)

        seen_keys = set()
        deduped_articles = []
        for a in all_articles:
            key = normalize_url_key(a["url"])
            if key in seen_keys:
                continue
            seen_keys.add(key)
            deduped_articles.append(a)
            if len(deduped_articles) >= MAX_TOTAL_ARTICLES:
                break

        return deduped_articles
