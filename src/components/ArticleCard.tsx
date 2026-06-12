import { Bookmark } from "lucide-react";
import { isValidArticleUrl } from "@/lib/articleUrl";
import { formatRelativeTime, type Article } from "@/lib/feed";

type Props = {
  article: Article;
  bookmarked: boolean;
  onToggleBookmark: (article: Article) => void;
  /** Shown on saved tab — when the article was bookmarked */
  savedAt?: number;
};

export default function ArticleCard({
  article,
  bookmarked,
  onToggleBookmark,
  savedAt,
}: Props) {
  const safeUrl = isValidArticleUrl(article.url) ? article.url.trim() : null;

  return (
    <li className="py-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {safeUrl ? (
            <a
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <h2 className="text-lg font-semibold leading-snug tracking-tight group-hover:underline underline-offset-4">
                {article.title}
              </h2>
            </a>
          ) : (
            <h2 className="text-lg font-semibold leading-snug tracking-tight text-muted-foreground">
              {article.title}
            </h2>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            <span className="rounded-full border border-border px-2 py-0.5 font-medium text-foreground">
              {article.source}
            </span>
            {article.author && (
              <span className="normal-case tracking-normal">by {article.author}</span>
            )}
            <span>·</span>
            <time
              dateTime={new Date(article.publishedAt).toISOString()}
              className="normal-case tracking-normal"
            >
              {formatRelativeTime(article.publishedAt)}
            </time>
            {savedAt !== undefined && (
              <>
                <span>·</span>
                <span className="normal-case tracking-normal">
                  saved {formatRelativeTime(savedAt)}
                </span>
              </>
            )}
          </div>
          {article.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {article.description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onToggleBookmark(article)}
          aria-label={bookmarked ? "Remove bookmark" : "Save article"}
          aria-pressed={bookmarked}
          className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border transition hover:bg-muted ${
            bookmarked ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
        </button>
      </div>
    </li>
  );
}
