import { useState } from "react";
import type { ReadingStats } from "@/lib/stats";
import { getDailyDStorageBytes } from "@/lib/localStore";
import { MAX_BOOKMARKS } from "@/lib/bookmarks";
import { MAX_READ_ENTRIES } from "@/lib/readState";

type Props = {
  stats: ReadingStats;
  readHistoryCount: number;
  dataUpdatedAt?: number;
  onClearHistory: () => void;
};

function Tile({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`rounded-xl border border-border bg-muted/10 p-4 ${wide ? "col-span-2" : ""}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-2xl font-bold">{value}</p>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
}

export default function StatsPanel({ stats, readHistoryCount, dataUpdatedAt, onClearHistory }: Props) {
  // Recomputed on every render, which is cheap and keeps it accurate after clearing.
  const storageBytes = getDailyDStorageBytes();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="In feed" value={stats.articlesAvailable} />
        <Tile label="Read" value={stats.articlesRead} />
        <Tile label="Unread" value={stats.articlesUnread} />
        <Tile label="Saved" value={stats.savedArticlesCount} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Tile label="Read today" value={stats.todayReadingCount} />
        <Tile label="Top source" value={<span className="text-lg">{stats.topSource}</span>} />
        <Tile
          wide
          label="Top topic"
          value={<span className="text-lg capitalize">{stats.topTopic.replace(/_/g, " ")}</span>}
        />
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Feed last loaded</span>
          <span className="font-mono">
            {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "Never"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Stored on this device</span>
          <span className="font-mono">{formatBytes(storageBytes)}</span>
        </div>
        <p>
          Everything stays in this browser. History keeps the last {MAX_READ_ENTRIES} reads (90 days);
          up to {MAX_BOOKMARKS} saved articles.
        </p>
        <div className="flex items-center justify-between gap-3 pt-1">
          <span>{readHistoryCount} articles in reading history</span>
          {confirming ? (
            <span className="flex gap-2">
              <button
                onClick={() => {
                  onClearHistory();
                  setConfirming(false);
                }}
                className="rounded-full bg-foreground px-3 py-1 font-medium text-background"
              >
                Clear
              </button>
              <button onClick={() => setConfirming(false)} className="rounded-full border border-border px-3 py-1">
                Cancel
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              disabled={readHistoryCount === 0}
              className="rounded-full border border-border px-3 py-1 font-medium transition hover:bg-muted disabled:opacity-50"
            >
              Clear history
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
