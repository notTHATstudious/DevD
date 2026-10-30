import { Moon, Sun, Download, RefreshCw, Gamepad2 } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/lib/useTheme";
import { useInstallPrompt } from "@/lib/useInstallPrompt";
import { formatRelativeTime } from "@/lib/feed";

type Props = {
  /** When the backend last refreshed its feeds. */
  lastUpdated?: number;
  refreshing: boolean;
  onRefresh: () => void;
  onPlay: () => void;
};

const iconButton =
  "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border transition hover:bg-muted disabled:opacity-50";

export default function AppHeader({ lastUpdated, refreshing, onRefresh, onPlay }: Props) {
  const { theme, toggle } = useTheme();
  const { canInstall, installed, ios, promptInstall } = useInstallPrompt();
  const [showIosHint, setShowIosHint] = useState(false);

  const handleInstall = async () => {
    if (ios && !installed) {
      setShowIosHint(true);
      return;
    }
    await promptInstall();
  };

  const showInstallButton = !installed && (canInstall || ios);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="safe-top" />
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground font-serif text-base font-semibold text-background">
            D
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight tracking-tight">DailyD</p>
            <p className="truncate text-[11px] leading-tight text-muted-foreground" aria-live="polite">
              {refreshing
                ? "Updating…"
                : lastUpdated
                  ? `Updated ${formatRelativeTime(lastUpdated)}`
                  : "Developer & tech news"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {showInstallButton && (
            <button
              onClick={handleInstall}
              aria-label="Install app"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 text-xs font-medium transition hover:bg-muted sm:px-3"
            >
              <Download className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Install</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh feed"
            title="Refresh feed"
            className={iconButton}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <button onClick={onPlay} aria-label="Play Coffee Run" title="Play Coffee Run" className={iconButton}>
            <Gamepad2 className="h-4 w-4" />
          </button>

          <button onClick={toggle} aria-label="Toggle theme" className={iconButton}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {showIosHint && (
        <div className="border-t border-border bg-muted/50 px-4 py-2 text-center text-[11px] text-muted-foreground">
          On iPhone: tap <span className="font-medium text-foreground">Share</span> →{" "}
          <span className="font-medium text-foreground">Add to Home Screen</span>
          <button onClick={() => setShowIosHint(false)} className="ml-2 underline underline-offset-2">
            dismiss
          </button>
        </div>
      )}
    </header>
  );
}
