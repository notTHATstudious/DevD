type Props = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({ title, description, actionLabel, onAction }: Props) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-base font-medium">{title}</p>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium transition hover:bg-muted"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
