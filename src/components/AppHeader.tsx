import { Moon, Sun, Download, RefreshCw, Coffee } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/lib/useTheme";
import { useInstallPrompt } from "@/lib/useInstallPrompt";

type Props = {
  refreshing: boolean;
  onRefresh: () => void;
  onPlay: () => void;
};

const iconButton =
  "inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition hover:bg-muted hover:text-foreground disabled:opacity-50";

export default function AppHeader({ refreshing, onRefresh, onPlay }: Props) {
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
    <header className="glass sticky top-0 z-20 border-b border-border/60">
      <div className="safe-top" />
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 lg:max-w-5xl lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-[17px] font-extrabold tracking-tight text-background">
            D
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold leading-tight tracking-tight">DailyD</p>
            {/* Only shown while a refresh runs; the exact time lives in Stats. */}
            <p className="truncate text-[11px] leading-tight text-muted-foreground empty:hidden" aria-live="polite">
              {refreshing ? "Updating…" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {showInstallButton && (
            <button
              onClick={handleInstall}
              aria-label="Install app"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand px-2.5 text-xs font-semibold text-brand-foreground transition hover:opacity-90 sm:px-3.5"
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
            <Coffee className="h-4 w-4" />
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
