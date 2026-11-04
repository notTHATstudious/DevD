import { CATEGORIES, type CategoryKey } from "@/lib/categories";
import { STACKS, type StackKey } from "@/lib/stacks";

type Props = {
  value: CategoryKey;
  onChange: (key: CategoryKey) => void;
  /** Your stacks, shown right after "All" (only when there's more than one). */
  stacks: StackKey[];
};

export default function CategoryChips({ value, onChange, stacks }: Props) {
  const chips: { key: CategoryKey; label: string }[] = [
    CATEGORIES[0],
    ...(stacks.length > 1 ? stacks.map((k) => ({ key: `stack:${k}` as CategoryKey, label: STACKS[k].label })) : []),
    ...CATEGORIES.slice(1),
  ];
  return (
    <div
      role="tablist"
      aria-label="Categories"
      className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1"
    >
      {chips.map((chip) => {
        const active = value === chip.key;
        return (
          <button
            key={chip.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(chip.key)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition ${
              active
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
