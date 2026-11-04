import {
  TOPICS,
  TOPIC_GROUPS,
  TOPIC_KEYS,
  type TopicKey,
  type TopicPreferences,
} from "@/lib/preferences";
import StackPicker from "@/components/StackPicker";
import { STACKS, type Profile } from "@/lib/stacks";

type Props = {
  prefs: TopicPreferences;
  onChange: (prefs: TopicPreferences) => void;
  profile: Profile;
  onProfileChange: (profile: Profile) => void;
};

const smallButton =
  "rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium transition hover:bg-muted";

function setAll(prefs: TopicPreferences, keys: TopicKey[], value: boolean): TopicPreferences {
  const next = { ...prefs };
  for (const k of keys) next[k] = value;
  return next;
}

export default function PreferencesPanel({ prefs, onChange, profile, onProfileChange }: Props) {
  const enabledCount = TOPIC_KEYS.filter((k) => prefs[k]).length;
  // Fine-grained topics: one section per chosen stack, then the shared sections.
  const groups = [
    ...profile.stacks.map((k) => ({ label: STACKS[k].label, keys: [...STACKS[k].topics] as TopicKey[] })),
    ...TOPIC_GROUPS,
  ];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-base font-semibold tracking-tight">Your track & stacks</h2>
        <StackPicker profile={profile} onChange={onProfileChange} />
      </section>

      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {enabledCount === TOPIC_KEYS.length
            ? "Showing every topic. Turn some off to narrow your feed."
            : `${enabledCount} of ${TOPIC_KEYS.length} topics on. Articles without a detected topic are always shown.`}
        </p>
        <div className="flex gap-2">
          <button onClick={() => onChange(setAll(prefs, TOPIC_KEYS, true))} className={smallButton}>
            Select all
          </button>
          <button onClick={() => onChange(setAll(prefs, TOPIC_KEYS, false))} className={smallButton}>
            Clear all
          </button>
        </div>
      </div>

      {groups.map((group) => {
        const allOn = group.keys.every((k) => prefs[k]);
        return (
          <section key={group.label}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight">{group.label}</h2>
              <button
                onClick={() => onChange(setAll(prefs, group.keys, !allOn))}
                className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                {allOn ? "Turn off group" : "Turn on group"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.keys.map((key) => {
                const enabled = prefs[key];
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={enabled}
                    onClick={() => onChange({ ...prefs, [key]: !enabled })}
                    className={`select-none rounded-full border px-3.5 py-1.5 text-sm transition ${
                      enabled
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {TOPICS[key]}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
