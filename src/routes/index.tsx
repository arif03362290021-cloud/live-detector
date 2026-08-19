import { createFileRoute } from "@tanstack/react-router";
import { Activity, Boxes, Gauge, Radar, Cpu } from "lucide-react";
import { useDetection } from "@/hooks/use-detection";
import { VideoStage } from "@/components/detection/VideoStage";
import { ControlPanel } from "@/components/detection/ControlPanel";
import { StatCard } from "@/components/detection/StatCard";
import { StatusPill, type StatusTone } from "@/components/detection/StatusPill";
import { TrackedObjectList } from "@/components/detection/TrackedObjectList";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Real-Time Object Detection & Tracking | YOLOv8 in the Browser" },
      {
        name: "description",
        content:
          "Real-time YOLOv8 object detection and SORT tracking running fully in your browser. Webcam or uploaded video, bounding boxes, tracking IDs and live stats.",
      },
      { property: "og:title", content: "Real-Time Object Detection & Tracking" },
      {
        property: "og:description",
        content:
          "Browser-based YOLOv8 detection with SORT tracking IDs and a live computer-vision dashboard. CodeAlpha AI Internship — Task 4.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const d = useDetection();

  const modelTone: StatusTone =
    d.modelState === "ready"
      ? "active"
      : d.modelState === "loading"
        ? "warn"
        : d.modelState === "error"
          ? "error"
          : "idle";

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-6 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="glow-ring flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Radar className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Real-Time Object Detection &amp; Tracking
              </h1>
              <p className="font-mono text-xs text-primary sm:text-sm">
                CodeAlpha AI Internship — Task 4
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Gauge} label="Current FPS" value={d.stats.fps.toFixed(1)} />
          <StatCard icon={Boxes} label="Detected objects" value={String(d.stats.detections)} />
          <StatCard icon={Activity} label="Active tracks" value={String(d.stats.activeTracks)} />
          <StatCard icon={Cpu} label="Model" value="YOLOv8n" hint="ONNX Runtime Web · COCO 80" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <VideoStage
              videoRef={d.videoRef}
              canvasRef={d.canvasRef}
              source={d.source}
              detecting={d.detecting}
              modelState={d.modelState}
              modelMessage={d.modelMessage}
              error={d.error}
            />

            <div className="panel grid gap-2 p-4 sm:grid-cols-2">
              <StatusPill
                label="Detection"
                value={d.detecting ? "Running" : "Stopped"}
                tone={d.detecting ? "active" : "idle"}
              />
              <StatusPill
                label="Camera"
                value={d.source === "camera" ? "Live" : "Off"}
                tone={d.source === "camera" ? "active" : "idle"}
              />
              <StatusPill
                label="Processing"
                value={
                  d.detecting
                    ? d.source === "camera"
                      ? "Webcam frames"
                      : "Video frames"
                    : "Idle"
                }
                tone={d.detecting ? "warn" : "idle"}
              />
              <StatusPill label="Model" value={d.modelMessage} tone={modelTone} />
            </div>
          </div>

          <div className="space-y-6">
            <ControlPanel
              cameraOn={d.source === "camera"}
              detecting={d.detecting}
              hasSource={d.source !== "none"}
              showBoxes={d.showBoxes}
              showIds={d.showIds}
              onStartCamera={() => void d.startCamera()}
              onStopCamera={d.stopCamera}
              onUpload={(file) => void d.loadVideoFile(file)}
              onStartDetection={() => void d.startDetection()}
              onStopDetection={d.stopDetection}
              onReset={d.reset}
              onToggleBoxes={d.setShowBoxes}
              onToggleIds={d.setShowIds}
            />
            <TrackedObjectList tracks={d.tracks} />
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card/60 py-6 text-center">
        <p className="text-sm font-medium">Powered by Computer Vision</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Developed as part of CodeAlpha AI Internship — Task 4
        </p>
      </footer>
    </div>
  );
}
