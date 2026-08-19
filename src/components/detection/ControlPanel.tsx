import { useRef } from "react";
import {
  Camera,
  CameraOff,
  Upload,
  Play,
  Square,
  RotateCcw,
  BoxSelect,
  Tags,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ControlPanelProps {
  cameraOn: boolean;
  detecting: boolean;
  hasSource: boolean;
  showBoxes: boolean;
  showIds: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onUpload: (file: File) => void;
  onStartDetection: () => void;
  onStopDetection: () => void;
  onReset: () => void;
  onToggleBoxes: (v: boolean) => void;
  onToggleIds: (v: boolean) => void;
}

export function ControlPanel(props: ControlPanelProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="panel space-y-4 p-4">
      <h2 className="text-sm font-semibold tracking-wide uppercase">Controls</h2>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={props.onStartCamera} disabled={props.cameraOn} className="gap-2">
          <Camera className="size-4" /> Start Camera
        </Button>
        <Button
          variant="secondary"
          onClick={props.onStopCamera}
          disabled={!props.cameraOn}
          className="gap-2"
        >
          <CameraOff className="size-4" /> Stop Camera
        </Button>
        <Button variant="secondary" onClick={() => fileRef.current?.click()} className="gap-2">
          <Upload className="size-4" /> Upload Video
        </Button>
        <Button variant="secondary" onClick={props.onReset} className="gap-2">
          <RotateCcw className="size-4" /> Clear / Reset
        </Button>
        <Button
          onClick={props.onStartDetection}
          disabled={props.detecting || !props.hasSource}
          className="gap-2"
        >
          <Play className="size-4" /> Start Detection
        </Button>
        <Button
          variant="destructive"
          onClick={props.onStopDetection}
          disabled={!props.detecting}
          className="gap-2"
        >
          <Square className="size-4" /> Stop Detection
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) props.onUpload(file);
          e.target.value = "";
        }}
      />

      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="boxes" className="flex items-center gap-2 text-sm">
            <BoxSelect className="size-4 text-primary" /> Detection boxes
          </Label>
          <Switch id="boxes" checked={props.showBoxes} onCheckedChange={props.onToggleBoxes} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="ids" className="flex items-center gap-2 text-sm">
            <Tags className="size-4 text-primary" /> Tracking IDs
          </Label>
          <Switch id="ids" checked={props.showIds} onCheckedChange={props.onToggleIds} />
        </div>
      </div>
    </div>
  );
}
