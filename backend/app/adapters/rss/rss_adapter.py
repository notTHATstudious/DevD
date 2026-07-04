import logging
import httpx
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional
import email.utils
import datetime

logger = logging.getLogger("app.rss_adapter")

class RSSAdapter:
    def __init__(self, timeout_seconds: float = 5.0):
        self.timeout = timeout_seconds

    async def fetch_feed(self, client: httpx.AsyncClient, name: str, url: str) -> List[Dict[str, Any]]:
        """
        Fetches an RSS/Atom feed asynchronously and returns normalized raw articles.
        Handles timeout and parser errors gracefully to support partial failure.
        """
        try:
            response = await client.get(url, timeout=self.timeout)
            if response.status_code != 200:
                logger.warning(f"Failed to fetch feed {name} from {url}: status {response.status_code}")
                return []
            
            return self.parse_xml(response.content, name)
        except httpx.RequestError as exc:
            logger.warning(f"Network error fetching feed {name} from {url}: {exc}")
            return []
        except Exception as exc:
            logger.error(f"Unexpected error for feed {name} from {url}: {exc}")
            return []

    def _get_local_name(self, tag: str) -> str:
        return tag.split("}")[-1]

    def _find_child_text(self, elem: ET.Element, local_name: str) -> Optional[str]:
        for child in elem:
            if self._get_local_name(child.tag) == local_name:
                return child.text
        return None

    def _parse_date_to_ms(self, date_str: Optional[str]) -> Optional[int]:
        if not date_str:
            return None
        date_str = date_str.strip()
        # Try RFC 822/2822 format (RSS)
        try:
            dt = email.utils.parsedate_to_datetime(date_str)
            return int(dt.timestamp() * 1000)
        except Exception:
            pass
        # Try ISO 8601 format (Atom)
        try:
            normalized_date = date_str
            if normalized_date.endswith('Z'):
                normalized_date = normalized_date[:-1] + '+00:00'
            dt = datetime.datetime.fromisoformat(normalized_date)
            return int(dt.timestamp() * 1000)
        except Exception:
            pass
        return None

    def parse_xml(self, xml_bytes: bytes, source_name: str) -> List[Dict[str, Any]]:
        """
        Parses XML bytes and detects RSS vs Atom structure.
        Returns a list of raw dictionaries with raw elements:
        {title, link, description, pubDate, author}
        """
        articles = []
        try:
            root = ET.fromstring(xml_bytes)
        except ET.ParseError as e:
            logger.warning(f"XML parse error for source {source_name}: {e}")
            return []

        root_local = self._get_local_name(root.tag)

        # Detect Atom
        if root_local == "feed":
            for entry in root:
                if self._get_local_name(entry.tag) == "entry":
                    title = self._find_child_text(entry, "title") or ""
                    
                    # Extract link
                    link = ""
                    for child in entry:
                        if self._get_local_name(child.tag) == "link":
                            rel = child.attrib.get("rel", "alternate")
                            if rel in ("alternate", "self", "") or not link:
                                href = child.attrib.get("href")
                                if href:
                                    link = href
                                    if rel == "alternate":
                                        break
                    if not link:
                        link = entry.text or ""

                    description = (
                        self._find_child_text(entry, "summary")
                        or self._find_child_text(entry, "content")
                        or ""
                    )
                    pub_date_str = (
                        self._find_child_text(entry, "updated")
                        or self._find_child_text(entry, "published")
                    )
                    published_at = self._parse_date_to_ms(pub_date_str)

                    # Extract Author
                    author = None
                    for child in entry:
                        if self._get_local_name(child.tag) == "author":
                            name_val = self._find_child_text(child, "name")
                            if name_val:
                                author = name_val
                                break

                    articles.append({
                        "title": title,
                        "url": link,
                        "description": description,
                        "publishedAt": published_at,
                        "author": author,
                    })

        # Detect RSS
        else:
            # RSS typically has channel as direct child, and item inside channel
            channel = None
            for child in root:
                if self._get_local_name(child.tag) == "channel":
                    channel = child
                    break
            
            # If root itself acts as channel or rss
            items_source = channel if channel is not None else root
            for item in items_source.iter():
                if self._get_local_name(item.tag) == "item":
                    title = self._find_child_text(item, "title") or ""
                    link = self._find_child_text(item, "link") or ""
                    description = (
                        self._find_child_text(item, "description")
                        or self._find_child_text(item, "encoded")  # content:encoded
                        or ""
                    )
                    pub_date_str = self._find_child_text(item, "pubDate")
                    published_at = self._parse_date_to_ms(pub_date_str)
                    author = (
                        self._find_child_text(item, "creator")  # dc:creator
                        or self._find_child_text(item, "author")
                    )

                    articles.append({
                        "title": title,
                        "url": link,
                        "description": description,
                        "publishedAt": published_at,
                        "author": author,
                    })

        return articles
