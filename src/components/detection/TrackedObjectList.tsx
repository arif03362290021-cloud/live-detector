import { classHue } from "@/lib/vision/coco-classes";
import type { Track } from "@/lib/vision/tracker";

export function TrackedObjectList({ tracks }: { tracks: Track[] }) {
  const sorted = [...tracks].sort((a, b) => a.id - b.id);

  return (
    <div className="panel flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide uppercase">Live tracked objects</h2>
        <span className="font-mono text-xs text-muted-foreground">{sorted.length}</span>
      </div>
      {sorted.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No objects tracked yet. Start the camera or upload a video.
        </p>
      ) : (
        <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {sorted.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm"
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: `hsl(${classHue(t.classId)} 90% 60%)` }}
              />
              <span className="flex-1 truncate capitalize">{t.label}</span>
              <span className="font-mono text-xs text-primary">ID {t.id}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {Math.round(t.score * 100)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
