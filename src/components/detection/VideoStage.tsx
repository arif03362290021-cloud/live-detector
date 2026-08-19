import type { RefObject } from "react";
import { Loader2, ScanEye, AlertTriangle } from "lucide-react";
import type { ModelState, SourceKind } from "@/hooks/use-detection";

interface VideoStageProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  source: SourceKind;
  detecting: boolean;
  modelState: ModelState;
  modelMessage: string;
  error: string | null;
}

export function VideoStage({
  videoRef,
  canvasRef,
  source,
  detecting,
  modelState,
  modelMessage,
  error,
}: VideoStageProps) {
  const idle = source === "none";

  return (
    <div className="panel relative overflow-hidden">
      <div className="relative aspect-video w-full bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 size-full object-contain"
        />
        {/* Overlay canvas is sized to the video's intrinsic resolution and
            stretched over it, so box coordinates map 1:1 to frame pixels. */}
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 size-full object-contain" />

        {idle ? (
          <div className="hero-surface absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
            <ScanEye className="size-10 text-primary" />
            <p className="text-sm text-muted-foreground">
              Start the camera or upload a video to begin real-time detection
            </p>
          </div>
        ) : null}

        {detecting ? (
          <span className="absolute top-3 left-3 inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 font-mono text-xs text-success backdrop-blur">
            <span className="pulse-dot size-2 rounded-full bg-success" /> DETECTING
          </span>
        ) : null}
      </div>

      {modelState === "loading" ? (
        <div className="flex items-center gap-2 border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" />
          {modelMessage}
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-2 border-t border-border bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
    </div>
  );
}
