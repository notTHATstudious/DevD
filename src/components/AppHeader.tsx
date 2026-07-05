import { Moon, Sun, Download, LogOut, MessageSquare } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/lib/useTheme";
import { useInstallPrompt } from "@/lib/useInstallPrompt";
import type { DevUser } from "@/lib/auth";
import { useState } from "react";

type Props = {
  user: DevUser;
  onSignOut: () => void;
};

export default function AppHeader({ user, onSignOut }: Props) {
  const { theme, toggle } = useTheme();
  const { canInstall, installed, ios, promptInstall } = useInstallPrompt();
  const [showIosHint, setShowIosHint] = useState(false);
  const location = useLocation();

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
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:py-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background font-serif text-base font-semibold">
            D
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight tracking-tight">DailyD</p>
            <p className="truncate text-[11px] leading-tight text-muted-foreground">
              {user.username} · <span className="uppercase tracking-wider">{user.tag}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link
            to={location.pathname === "/assistant" ? "/" : "/assistant"}
            aria-label="DevD Assistant"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {location.pathname === "/assistant" ? "Feed" : "Assistant"}
          </Link>
          <Link
            to={location.pathname === "/assistant" ? "/" : "/assistant"}
            aria-label="DevD Assistant"
            className="inline-flex sm:hidden h-9 w-9 items-center justify-center rounded-full border border-border transition hover:bg-muted"
          >
            <MessageSquare className="h-4 w-4" />
          </Link>
          {showInstallButton && (
            <button
              onClick={handleInstall}
              aria-label="Install app"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
            >
              <Download className="h-3.5 w-3.5" />
              Install
            </button>
          )}
          {showInstallButton && (
            <button
              onClick={handleInstall}
              aria-label="Install app"
              className="inline-flex sm:hidden h-9 w-9 items-center justify-center rounded-full border border-border transition hover:bg-muted"
            >
              <Download className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border transition hover:bg-muted"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            onClick={onSignOut}
            aria-label="Sign out"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border transition hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showIosHint && (
        <div className="border-t border-border bg-muted/50 px-4 py-2 text-center text-[11px] text-muted-foreground">
          On iPhone: tap <span className="font-medium text-foreground">Share</span> →{" "}
          <span className="font-medium text-foreground">Add to Home Screen</span>
          <button
            onClick={() => setShowIosHint(false)}
            className="ml-2 underline underline-offset-2"
          >
            dismiss
          </button>
        </div>
      )}
    </header>
  );
}
