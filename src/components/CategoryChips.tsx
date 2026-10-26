import { CATEGORIES, type CategoryKey } from "@/lib/categories";

type Props = {
  value: CategoryKey;
  onChange: (key: CategoryKey) => void;
};

export default function CategoryChips({ value, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Categories"
      className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1"
    >
      {CATEGORIES.map((chip) => {
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
