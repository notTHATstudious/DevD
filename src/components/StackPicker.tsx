import { STACKS, TRACKS, stacksForTrack, switchTrack, toggleStack, type Profile } from "@/lib/stacks";

type Props = {
  profile: Profile;
  onChange: (p: Profile) => void;
};

/** Track (Backend / Frontend / Full-stack) plus the stacks inside it. */
export default function StackPicker({ profile, onChange }: Props) {
  const stacks = stacksForTrack(profile.track);
  const sides = profile.track === "fullstack" ? (["backend", "frontend"] as const) : [profile.track];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {TRACKS.map((t) => {
          const active = profile.track === t.key;
          return (
            <button
              key={t.key}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(switchTrack(profile, t.key))}
              className={`rounded-xl border px-2 py-2.5 text-center transition ${
                active ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"
              }`}
            >
              <span className="block text-sm font-semibold">{t.label}</span>
              <span className={`block text-[10px] ${active ? "text-background/70" : "text-muted-foreground"}`}>
                {t.hint}
              </span>
            </button>
          );
        })}
      </div>

      {sides.map((side) => (
        <div key={side}>
          {sides.length > 1 && (
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {side === "backend" ? "Backend" : "Frontend"}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {stacks
              .filter((k) => STACKS[k].side === side)
              .map((k) => {
                const on = profile.stacks.includes(k);
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onChange(toggleStack(profile, k))}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                      on
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {STACKS[k].label}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-muted-foreground">
        Articles from stacks you don't pick are hidden. Cloud, AI and tech news stay for everyone.
      </p>
    </div>
  );
}
