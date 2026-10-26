"""
Search over the cached articles for the DevD Assistant.

Ranking is BM25 over weighted fields (title > topics > source > description),
with whole-word matching, light stemming, tech synonyms (k8s → kubernetes),
typo correction ("kubernates" → "kubernetes"), recency boost, and simple
intent parsing ("iphone news this week", "official spring boot").
"""
import difflib
import math
import re
import time
from collections import Counter
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

DAY_MS = 24 * 60 * 60 * 1000

FIELD_WEIGHTS = {"title": 3.0, "topics": 2.0, "source": 1.5, "author": 1.0, "description": 1.0}
BM25_K1 = 1.2
BM25_B = 0.75
RECENCY_HALF_LIFE_DAYS = 7.0

TOKEN_RE = re.compile(r"[a-z0-9][a-z0-9+#.]*[a-z0-9+#]|[a-z0-9]")

STOPWORDS = {
    "a", "an", "and", "are", "about", "any", "anything", "as", "at", "be", "best", "by",
    "can", "do", "does", "for", "from", "get", "give", "how", "i", "in", "into", "is",
    "it", "latest", "me", "my", "new", "news", "of", "on", "or", "please", "recent",
    "show", "some", "tell", "the", "this", "to", "up", "updates", "vs", "what", "whats",
    "what's", "when", "where", "which", "who", "why", "with", "articles", "article",
    "posts", "post", "find", "search", "week", "today", "month", "yesterday", "last",
    "past", "official", "tutorial", "tutorials", "guide", "guides", "community",
}

# Query term → extra terms that count as the same thing (stemmed below).
SYNONYMS: Dict[str, List[str]] = {
    "k8s": ["kubernetes"],
    "kubernetes": ["k8s"],
    "js": ["javascript"],
    "javascript": ["js"],
    "ts": ["typescript"],
    "typescript": ["ts"],
    "py": ["python"],
    "golang": ["go"],
    "postgres": ["postgresql"],
    "postgresql": ["postgres"],
    "mongo": ["mongodb"],
    "mongodb": ["mongo"],
    "springboot": ["spring", "boot"],
    "ai": ["llm", "genai", "artificial", "machine"],
    "llm": ["llms", "ai", "gpt", "claude", "gemini", "llama"],
    "gpt": ["openai", "chatgpt"],
    "chatgpt": ["openai", "gpt"],
    "openai": ["chatgpt", "gpt"],
    "claude": ["anthropic"],
    "anthropic": ["claude"],
    "gemini": ["google"],
    "ml": ["machine", "learning"],
    "aws": ["amazon"],
    "gcp": ["google", "cloud"],
    "iphone": ["ios", "apple"],
    "ipad": ["ipados", "apple"],
    "mac": ["macbook", "macos", "imac"],
    "macbook": ["mac", "laptop"],
    "phone": ["smartphone", "iphone", "pixel", "galaxy"],
    "smartphone": ["phone"],
    "laptop": ["notebook", "macbook", "chromebook", "thinkpad"],
    "android": ["pixel", "galaxy"],
    "pixel": ["android", "google"],
    "galaxy": ["samsung"],
    "samsung": ["galaxy"],
    "gpu": ["nvidia", "graphics"],
    "cpu": ["processor", "chip"],
    "chip": ["silicon", "processor", "semiconductor"],
    "ci": ["cicd", "pipeline"],
    "cicd": ["ci", "pipeline", "github", "jenkins"],
    "devops": ["sre"],
    "db": ["database"],
    "database": ["db", "sql"],
    "vm": ["virtual"],
}

# Phrases that collapse to one token before tokenizing.
PHRASES = {
    "spring boot": "springboot",
    "ci/cd": "cicd",
    "ci cd": "cicd",
    "machine learning": "ml",
    "large language model": "llm",
    "large language models": "llm",
    "virtual threads": "virtualthreads",
    "github actions": "githubactions",
    "vision pro": "visionpro",
}

TIME_WINDOWS = [
    (re.compile(r"\b(today|last 24 ?h(ours)?|past day)\b"), 1, "the last 24 hours"),
    (re.compile(r"\b(yesterday)\b"), 2, "the last 2 days"),
    (re.compile(r"\b(this|past|last) week\b"), 7, "the last 7 days"),
    (re.compile(r"\b(this|past|last) month\b"), 31, "the last 30 days"),
]

KIND_WORDS = {
    "official": "isOfficial",
    "tutorial": "isTutorial",
    "tutorials": "isTutorial",
    "guide": "isTutorial",
    "guides": "isTutorial",
    "community": "isCommunity",
    "news": "isNews",
}


def normalize_token(tok: str) -> str:
    """Lowercase + light stemming so 'containers' matches 'container'."""
    tok = tok.lower().strip(".")
    if len(tok) > 4 and tok.endswith("ies"):
        return tok[:-3] + "y"
    if len(tok) > 5 and tok.endswith("ing"):
        return tok[:-3]
    if len(tok) > 4 and tok.endswith("es") and tok[-3] in "sxz":
        return tok[:-2]
    if len(tok) > 3 and tok.endswith("s") and not tok.endswith(("ss", "us", "is", "os")):
        return tok[:-1]
    return tok


# Query terms are stemmed, so stem the synonym table the same way once.
SYNONYMS = {
    normalize_token(k): [normalize_token(v) for v in vs] for k, vs in SYNONYMS.items()
}


def _apply_phrases(text: str) -> str:
    for phrase, token in PHRASES.items():
        text = text.replace(phrase, token)
    return text


def tokenize(text: str) -> List[str]:
    text = _apply_phrases(text.lower())
    return [normalize_token(t) for t in TOKEN_RE.findall(text)]


@dataclass
class ParsedQuery:
    raw: str
    terms: List[str]
    # The same words as the user typed them (for suggestions), e.g. "spring boot".
    words: List[str] = field(default_factory=list)
    max_age_days: Optional[int] = None
    time_label: Optional[str] = None
    kind_flag: Optional[str] = None


def parse_query(query: str) -> ParsedQuery:
    lowered = query.lower().strip()
    parsed = ParsedQuery(raw=query.strip(), terms=[])
    for pattern, days, label in TIME_WINDOWS:
        if pattern.search(lowered):
            parsed.max_age_days, parsed.time_label = days, label
            break
    for word, flag in KIND_WORDS.items():
        if re.search(rf"\b{word}\b", lowered):
            parsed.kind_flag = flag
            break
    phrase_text = {token: phrase for phrase, token in PHRASES.items()}
    for word in TOKEN_RE.findall(_apply_phrases(lowered)):
        term = normalize_token(word)
        if term in STOPWORDS or term in parsed.terms:
            continue
        parsed.terms.append(term)
        parsed.words.append(phrase_text.get(word, word))
    return parsed


@dataclass
class IndexedDoc:
    article: Dict[str, Any]
    fields: Dict[str, Counter]
    lengths: Dict[str, int]


@dataclass
class SearchIndex:
    docs: List[IndexedDoc] = field(default_factory=list)
    doc_freq: Counter = field(default_factory=Counter)
    avg_len: Dict[str, float] = field(default_factory=dict)
    vocabulary: List[str] = field(default_factory=list)
    # stem → how it is usually written, for readable "did you mean" text
    surface: Dict[str, str] = field(default_factory=dict)

    @classmethod
    def build(cls, articles: List[Dict[str, Any]]) -> "SearchIndex":
        index = cls()
        totals: Counter = Counter()
        surfaces: Dict[str, Counter] = {}
        for a in articles:
            for word in TOKEN_RE.findall((a.get("title") or "").lower()):
                surfaces.setdefault(normalize_token(word), Counter())[word] += 1
            fields = {
                "title": Counter(tokenize(a.get("title") or "")),
                "description": Counter(tokenize(a.get("description") or "")),
                "source": Counter(tokenize(a.get("source") or "")),
                "author": Counter(tokenize(a.get("author") or "")),
                "topics": Counter(tokenize(" ".join(t.replace("_", " ") for t in a.get("topics") or []))),
            }
            lengths = {name: sum(c.values()) for name, c in fields.items()}
            totals.update(lengths)
            seen = set()
            for c in fields.values():
                seen.update(c.keys())
            index.doc_freq.update(seen)
            index.docs.append(IndexedDoc(article=a, fields=fields, lengths=lengths))
        n = max(len(index.docs), 1)
        index.avg_len = {name: max(totals[name] / n, 1.0) for name in FIELD_WEIGHTS}
        index.vocabulary = [t for t, df in index.doc_freq.items() if len(t) > 2]
        index.surface = {stem: c.most_common(1)[0][0] for stem, c in surfaces.items()}
        return index

    def idf(self, term: str) -> float:
        n = len(self.docs)
        df = self.doc_freq.get(term, 0)
        return math.log(1 + (n - df + 0.5) / (df + 0.5))

    def correct(self, term: str) -> Optional[str]:
        """Closest indexed word for a term that matches nothing (typo fix)."""
        if term in self.doc_freq or len(term) < 5:
            return None
        matches = difflib.get_close_matches(term, self.vocabulary, n=1, cutoff=0.8)
        return matches[0] if matches else None

    def display(self, term: str) -> str:
        return self.surface.get(term, term)


@dataclass
class SearchResult:
    articles: List[Dict[str, Any]]
    total: int
    summary: str
    did_you_mean: Optional[str] = None
    suggestions: List[str] = field(default_factory=list)
    partial: bool = False


def _term_score(index: SearchIndex, doc: IndexedDoc, term: str, idf: float) -> float:
    score = 0.0
    for name, weight in FIELD_WEIGHTS.items():
        tf = doc.fields[name].get(term, 0)
        if not tf:
            continue
        norm = 1 - BM25_B + BM25_B * doc.lengths[name] / index.avg_len[name]
        score += weight * idf * (tf * (BM25_K1 + 1)) / (tf + BM25_K1 * norm)
    return score


def _group_score(index: SearchIndex, doc: IndexedDoc, group: List[str]) -> float:
    """Best score among a term and its synonyms (synonyms count a bit less)."""
    best = 0.0
    for i, term in enumerate(group):
        s = _term_score(index, doc, term, index.idf(term))
        if i > 0:
            s *= 0.7
        best = max(best, s)
    return best


def _recency_multiplier(published_at: int, now_ms: int) -> float:
    age_days = max(0.0, (now_ms - published_at) / DAY_MS)
    return 1.0 + 0.6 * 0.5 ** (age_days / RECENCY_HALF_LIFE_DAYS)


def _pretty_topic(topic: str) -> str:
    return topic.replace("_", " ")


def search(
    index: SearchIndex,
    query: str,
    limit: int = 20,
    offset: int = 0,
    now_ms: Optional[int] = None,
) -> SearchResult:
    now_ms = now_ms or int(time.time() * 1000)
    parsed = parse_query(query)

    candidates = index.docs
    if parsed.max_age_days:
        cutoff = now_ms - parsed.max_age_days * DAY_MS
        candidates = [d for d in candidates if d.article.get("publishedAt", 0) >= cutoff]
    if parsed.kind_flag:
        candidates = [d for d in candidates if d.article.get(parsed.kind_flag)]

    if not parsed.terms:
        # Only filters were given ("news today"): newest matching articles.
        ranked = sorted(candidates, key=lambda d: d.article.get("publishedAt", 0), reverse=True)
        return _result(index, ranked, parsed, None, offset, limit, partial=False)

    ranked, partial = _rank(index, candidates, parsed.terms, now_ms)

    # Nothing found? Retry with typo fixes ("kubernates" → "kubernetes").
    did_you_mean = None
    if not ranked or partial:
        fixed = [index.correct(t) or t for t in parsed.terms]
        if fixed != parsed.terms:
            fixed_ranked, fixed_partial = _rank(index, candidates, fixed, now_ms)
            if fixed_ranked and (not ranked or not fixed_partial):
                ranked, partial = fixed_ranked, fixed_partial
                did_you_mean = " ".join(index.display(t) for t in fixed)

    return _result(index, ranked, parsed, did_you_mean, offset, limit, partial)


def _rank(
    index: SearchIndex, candidates: List[IndexedDoc], terms: List[str], now_ms: int
) -> Tuple[List[IndexedDoc], bool]:
    groups = [[t] + [s for s in SYNONYMS.get(t, []) if s != t] for t in terms]
    phrase = " ".join(terms)

    full: List[Tuple[float, int, IndexedDoc]] = []
    partial: List[Tuple[float, int, IndexedDoc]] = []
    for doc in candidates:
        group_scores = [_group_score(index, doc, g) for g in groups]
        matched = sum(1 for s in group_scores if s > 0)
        if matched == 0:
            continue
        score = sum(group_scores)
        # Exact phrase in the title is a strong signal.
        if len(terms) > 1 and phrase in " ".join(tokenize(doc.article.get("title") or "")):
            score *= 1.5
        score *= _recency_multiplier(doc.article.get("publishedAt", 0), now_ms)
        published = doc.article.get("publishedAt", 0)
        if matched == len(groups):
            full.append((score, published, doc))
        else:
            partial.append((score * matched / len(groups), published, doc))

    # Nothing matches every word: show the closest matches instead of nothing.
    is_partial = not full and bool(partial)
    chosen = full or partial
    chosen.sort(key=lambda x: (x[0], x[1]), reverse=True)
    return [d for _, _, d in chosen], is_partial


def _result(
    index: SearchIndex,
    ranked: List[IndexedDoc],
    parsed: ParsedQuery,
    did_you_mean: Optional[str],
    offset: int,
    limit: int,
    partial: bool,
) -> SearchResult:
    total = len(ranked)
    page = [d.article for d in ranked[offset : offset + limit]]

    topic_counts: Counter = Counter()
    source_counts: Counter = Counter()
    for d in ranked[:100]:
        topic_counts.update(d.article.get("topics") or [])
        source_counts[d.article.get("source")] += 1

    # Skip topics that just repeat the query (or one of its synonyms).
    covered = set(parsed.terms)
    for t in parsed.terms:
        covered.update(SYNONYMS.get(t, []))
    base = did_you_mean or " ".join(parsed.words)
    suggestions = []
    for topic, _ in topic_counts.most_common(10):
        label = _pretty_topic(topic)
        if set(tokenize(label)) & covered:
            continue
        suggestions.append(f"{base} {label}".strip())
        if len(suggestions) == 4:
            break

    topic_text = did_you_mean or " ".join(parsed.words)
    subject = f"about “{topic_text}”" if topic_text else ""
    kind_labels = {"isOfficial": "official sources", "isTutorial": "tutorials", "isCommunity": "community posts", "isNews": "news"}
    window = f" in {kind_labels[parsed.kind_flag]}" if parsed.kind_flag else ""
    if parsed.time_label:
        window += f" from {parsed.time_label}"
    if total == 0:
        summary = f"I couldn't find anything {subject}{window}. Try fewer or broader words."
    else:
        noun = "article" if total == 1 else "articles"
        lead = "No exact matches, so here are the closest" if partial else "Found"
        summary = f"{lead} {total} {noun} {subject}{window}."
        summary = re.sub(r"\s+", " ", summary).replace(" .", ".")
        top_sources = [s for s, _ in source_counts.most_common(3) if s]
        if top_sources:
            summary += f" Mostly from {', '.join(top_sources)}."

    return SearchResult(
        articles=page,
        total=total,
        summary=summary,
        did_you_mean=did_you_mean,
        suggestions=suggestions,
        partial=partial,
    )
