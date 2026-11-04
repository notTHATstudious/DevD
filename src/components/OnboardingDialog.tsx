import { useState } from "react";
import StackPicker from "@/components/StackPicker";
import { DEFAULT_PROFILE, type Profile } from "@/lib/stacks";

/** First-visit question: "What do you build?" Skipping picks Backend. */
export default function OnboardingDialog({ onDone }: { onDone: (p: Profile) => void }) {
  const [draft, setDraft] = useState<Profile>(DEFAULT_PROFILE);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="What do you build?"
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 sm:items-center"
    >
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-background p-5 shadow-2xl">
        <h2 className="text-xl font-semibold tracking-tight">What do you build?</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          Pick your track and stacks to tailor the feed. You can change this anytime in Topics.
        </p>
        <StackPicker profile={draft} onChange={setDraft} />
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onDone(DEFAULT_PROFILE)}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Skip (Backend)
          </button>
          <button
            type="button"
            onClick={() => onDone(draft)}
            autoFocus
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background"
          >
            Start reading
          </button>
        </div>
      </div>
    </div>
  );
}
