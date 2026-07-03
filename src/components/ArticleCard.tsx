import { Bookmark, Share2 } from "lucide-react";
import { isValidArticleUrl } from "@/lib/articleUrl";
import { formatRelativeTime, type Article } from "@/lib/feed";
import { toast } from "@/hooks/use-toast";

type Props = {
  article: Article;
  bookmarked: boolean;
  read: boolean;
  onToggleBookmark: (article: Article) => void;
  onOpenArticle?: (article: Article) => void;
  /** Shown on saved tab — when the article was bookmarked */
  savedAt?: number;
};

export default function ArticleCard({
  article,
  bookmarked,
  read,
  onToggleBookmark,
  onOpenArticle,
  savedAt,
}: Props) {
  const safeUrl = isValidArticleUrl(article.url) ? article.url.trim() : null;

  const handleOpen = () => {
    if (safeUrl) onOpenArticle?.(article);
  };

  const wordCount = article.description.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 220));

  let faviconUrl = "";
  if (safeUrl) {
    try {
      const domain = new URL(safeUrl).hostname;
      faviconUrl = `https://www.google.com/s2/favicons?sz=32&domain=${domain}`;
    } catch {
      // Ignore URL parsing errors
    }
  }

  const handleShare = async () => {
    if (!safeUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          url: safeUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      try {
        await navigator.clipboard.writeText(safeUrl);
        toast({
          title: "Link Copied",
          description: "Article link copied to clipboard.",
        });
      } catch {
        toast({
          title: "Copy Failed",
          description: "Could not copy link to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <li className={`py-5 ${read ? "opacity-75" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            {!read && (
              <span
                className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-foreground"
                aria-hidden="true"
              />
            )}
            <div className="min-w-0 flex-1">
              {safeUrl ? (
                <a
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleOpen}
                  className="group block"
                >
                  <h2
                    className={`text-lg leading-snug tracking-tight group-hover:underline underline-offset-4 ${
                      read
                        ? "font-medium text-muted-foreground"
                        : "font-semibold text-foreground"
                    }`}
                  >
                    {article.title}
                  </h2>
                </a>
              ) : (
                <h2 className="text-lg font-semibold leading-snug tracking-tight text-muted-foreground">
                  {article.title}
                </h2>
              )}
            </div>
          </div>
          
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            {read && (
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                Read
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 font-medium text-foreground">
              {faviconUrl && (
                <img
                  src={faviconUrl}
                  alt=""
                  className="h-3 w-3 rounded-full shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
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
            <span>·</span>
            <span className="normal-case tracking-normal">{readTime} min read</span>
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
            <p className="mt-2.5 line-clamp-2 text-sm text-muted-foreground">
              {article.description}
            </p>
          )}

          {article.topics && article.topics.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {article.topics.slice(0, 4).map((topic) => (
                <span
                  key={topic}
                  className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize"
                >
                  {topic.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-1.5 shrink-0 mt-0.5">
          <button
            type="button"
            onClick={() => onToggleBookmark(article)}
            aria-label={bookmarked ? "Remove bookmark" : "Save article"}
            aria-pressed={bookmarked}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-border transition hover:bg-muted ${
              bookmarked ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
          </button>
          
          {safeUrl && (
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share article"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Share2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
