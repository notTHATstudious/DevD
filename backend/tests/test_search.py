from app.services.search_service import SearchIndex, parse_query, search, tokenize

NOW = 1_800_000_000_000
DAY = 24 * 60 * 60 * 1000


def art(title, description="", source="Blog", topics=None, age_days=1, **flags):
    return {
        "title": title,
        "url": f"https://example.com/{abs(hash(title))}",
        "source": source,
        "author": None,
        "publishedAt": NOW - int(age_days * DAY),
        "description": description,
        "topics": topics or [],
        **flags,
    }


ARTICLES = [
    art("Kubernetes Ingress explained", "Routing traffic into a cluster.", topics=["kubernetes"], age_days=3),
    art("Running k8s on a Raspberry Pi", "A tiny cluster at home.", topics=["kubernetes"], age_days=2),
    art("What maintainers said about the release", "Notes from the team.", age_days=1),
    art("Apple announces iPhone 18", "The new phone has a faster chip.", source="Apple Newsroom",
        topics=["apple", "smartphones"], age_days=0.5, isOfficial=True, isNews=True),
    art("Galaxy S26 review", "Samsung's best Android phone yet.", source="The Verge",
        topics=["android", "smartphones"], age_days=20, isNews=True),
    art("Spring Boot 4 virtual threads guide", "Use Java virtual threads with Spring Boot.",
        source="Baeldung", topics=["java", "spring_boot"], age_days=5, isTutorial=True),
    art("Old Kubernetes tips", "Kubernetes kubernetes kubernetes.", topics=["kubernetes"], age_days=400),
]
INDEX = SearchIndex.build(ARTICLES)


def titles(result):
    return [a["title"] for a in result.articles]


def test_whole_word_matching_ai_does_not_match_said():
    result = search(INDEX, "ai", now_ms=NOW)
    assert "What maintainers said about the release" not in titles(result)


def test_synonyms_k8s_finds_kubernetes():
    found = titles(search(INDEX, "k8s", now_ms=NOW))
    assert "Kubernetes Ingress explained" in found
    assert "Running k8s on a Raspberry Pi" in found


def test_recent_articles_rank_above_old_ones():
    found = titles(search(INDEX, "kubernetes", now_ms=NOW))
    assert found.index("Kubernetes Ingress explained") < found.index("Old Kubernetes tips")


def test_typo_is_corrected():
    result = search(INDEX, "kubernates ingress", now_ms=NOW)
    assert result.did_you_mean == "kubernetes ingress"
    assert titles(result)[0] == "Kubernetes Ingress explained"


def test_time_filter_and_stopwords():
    result = search(INDEX, "what's new with phones this week", now_ms=NOW)
    assert titles(result) == ["Apple announces iPhone 18"]
    assert "last 7 days" in result.summary


def test_kind_filter_official():
    assert titles(search(INDEX, "official phone", now_ms=NOW)) == ["Apple announces iPhone 18"]


def test_phrase_spring_boot():
    assert titles(search(INDEX, "spring boot", now_ms=NOW))[0] == "Spring Boot 4 virtual threads guide"


def test_partial_matches_when_nothing_matches_every_word():
    result = search(INDEX, "galaxy quantum", now_ms=NOW)
    assert result.partial is True
    assert titles(result) == ["Galaxy S26 review"]


def test_filters_only_query_returns_newest():
    result = search(INDEX, "news today", now_ms=NOW)
    assert titles(result) == ["Apple announces iPhone 18"]


def test_pagination_and_total():
    first = search(INDEX, "kubernetes", limit=1, now_ms=NOW)
    second = search(INDEX, "kubernetes", limit=1, offset=1, now_ms=NOW)
    assert first.total == second.total >= 3
    assert titles(first) != titles(second)


def test_suggestions_come_from_result_topics():
    result = search(INDEX, "phone", now_ms=NOW)
    assert any("apple" in s or "android" in s for s in result.suggestions)


def test_no_results_message():
    result = search(INDEX, "zzzzqqq", now_ms=NOW)
    assert result.total == 0
    assert "couldn't find" in result.summary


def test_tokenize_stems_and_phrases():
    assert tokenize("Containers and Spring Boot") == ["container", "and", "springboot"]
    assert parse_query("latest k8s news").terms == ["k8s"]
