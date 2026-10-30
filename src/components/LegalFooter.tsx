import { useEffect, useState } from "react";
import { X } from "lucide-react";

const OWNER = "Maheeesh";
/** Contact link — not set yet. Put an email ("mailto:…") or page URL here later. */
const CONTACT_URL: string | null = null;

function Contact({ className }: { className?: string }) {
  if (!CONTACT_URL) return <span className={className}>Contact</span>;
  return (
    <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className={className}>
      Contact
    </a>
  );
}

type Doc = "privacy" | "terms";

const DOCS: Record<Doc, { title: string; points: string[] }> = {
  privacy: {
    title: "Privacy Policy",
    points: [
      "No accounts, ads, analytics or tracking cookies.",
      "Your bookmarks, reading history, topics, theme and game score are stored only in this browser. Clear them anytime in Stats or your browser settings.",
      "Search queries are sent to our server to find articles and are not stored. Our host may keep standard access logs (such as IP address) for security.",
      "Source icons are loaded from Google's favicon service, which receives the site's domain and your IP address.",
      "Opening an article takes you to the publisher's website, which has its own privacy policy.",
    ],
  },
  terms: {
    title: "Terms of Service",
    points: [
      "DailyD links to articles from public RSS feeds. Articles, names, logos and trademarks belong to their respective owners; we show only titles, short excerpts and links.",
      "The service is provided “as is”, without warranties. Content may be incomplete, outdated or unavailable.",
      "Don't misuse the service, for example by overloading or scraping it.",
      `The DailyD app's code, design and graphics are © ${OWNER}. Unauthorized copying or redistribution is prohibited.`,
      "Publishers can ask for content to be removed via Contact. These terms may change; continued use means you accept them.",
    ],
  },
};

const link = "underline-offset-2 hover:text-foreground hover:underline";

export default function LegalFooter() {
  const [open, setOpen] = useState<Doc | null>(null);
  const year = new Date().getFullYear();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <footer className="safe-bottom mb-16 border-t border-border pt-4 text-xs leading-snug text-muted-foreground">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} {OWNER}. All rights reserved.
        </p>
        <nav aria-label="Legal" className="flex items-center gap-2.5">
          <button onClick={() => setOpen("privacy")} className={link}>
            Privacy
          </button>
          <button onClick={() => setOpen("terms")} className={link}>
            Terms
          </button>
          <Contact className={CONTACT_URL ? link : undefined} />
        </nav>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground/80">
        Articles, trademarks and logos belong to their respective owners.
      </p>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={DOCS[open].title}
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-border bg-background p-5 text-sm text-foreground shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{DOCS[open].title}</h2>
              <button
                onClick={() => setOpen(null)}
                aria-label="Close"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              {DOCS[open].points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              Last updated October 2026
            </p>
          </div>
        </div>
      )}
    </footer>
  );
}
