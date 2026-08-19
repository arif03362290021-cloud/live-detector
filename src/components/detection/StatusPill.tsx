import { cn } from "@/lib/utils";

export type StatusTone = "idle" | "active" | "warn" | "error";

const toneClasses: Record<StatusTone, string> = {
  idle: "bg-secondary text-muted-foreground",
  active: "bg-success/15 text-success",
  warn: "bg-warning/15 text-warning",
  error: "bg-destructive/15 text-destructive",
};

const dotClasses: Record<StatusTone, string> = {
  idle: "bg-muted-foreground",
  active: "bg-success pulse-dot",
  warn: "bg-warning pulse-dot",
  error: "bg-destructive",
};

export function StatusPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: StatusTone;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2">
      <span className="text-xs tracking-wide text-muted-foreground uppercase">{label}</span>
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-2.5 py-1 font-mono text-xs",
          toneClasses[tone],
        )}
      >
        <span className={cn("size-2 rounded-full", dotClasses[tone])} />
        {value}
      </span>
    </div>
  );
}
