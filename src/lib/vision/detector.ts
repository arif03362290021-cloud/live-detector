/**
 * Browser-side YOLOv8n object detector using ONNX Runtime Web (WASM/SIMD).
 *
 * Pipeline per frame:
 *  1. Letterbox the video frame into a 640x640 canvas (keeps aspect ratio).
 *  2. Convert RGBA pixels -> normalised NCHW Float32 tensor (1,3,640,640).
 *  3. Run the model -> output0 with shape (1, 84, 8400):
 *     rows 0..3 = cx,cy,w,h (in 640-space), rows 4..83 = per-class scores.
 *  4. Threshold + class-wise Non-Maximum Suppression.
 *  5. Map boxes back to the original frame coordinates (undo letterbox).
 */
import type { InferenceSession, Tensor as OrtTensor } from "onnxruntime-web";
import modelAsset from "@/assets/yolov8n.onnx.asset.json";
import { COCO_CLASSES } from "./coco-classes";

export const MODEL_SIZE = 640;

export interface Detection {
  x: number; // top-left, original frame pixels
  y: number;
  width: number;
  height: number;
  score: number;
  classId: number;
  label: string;
}

export interface DetectorOptions {
  scoreThreshold?: number;
  iouThreshold?: number;
  maxDetections?: number;
}

type Ort = typeof import("onnxruntime-web");

export class YoloDetector {
  private ort: Ort | null = null;
  private session: InferenceSession | null = null;
  private inputName = "images";
  private canvas: HTMLCanvasElement | OffscreenCanvas | null = null;
  private ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
  private input = new Float32Array(1 * 3 * MODEL_SIZE * MODEL_SIZE);
  private busy = false;

  get ready() {
    return this.session !== null;
  }

  /** Loads onnxruntime-web (browser only) and the YOLOv8n weights. */
  async load(onProgress?: (msg: string) => void): Promise<void> {
    if (this.session) return;
    onProgress?.("Loading inference runtime…");
    const ort = (await import("onnxruntime-web")) as Ort;
    // WASM binaries are fetched from the pinned CDN build of the same version.
    ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.27.0/dist/";
    ort.env.wasm.numThreads = 1; // avoids cross-origin-isolation requirements
    this.ort = ort;

    onProgress?.("Downloading YOLOv8n model (12 MB)…");
    const res = await fetch(modelAsset.url);
    if (!res.ok) throw new Error(`Model download failed (HTTP ${res.status})`);
    const buffer = new Uint8Array(await res.arrayBuffer());

    onProgress?.("Initialising neural network…");
    this.session = await ort.InferenceSession.create(buffer, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
    this.inputName = this.session.inputNames[0] ?? "images";

    // Offscreen surface used for letterboxing frames.
    const canvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(MODEL_SIZE, MODEL_SIZE)
        : Object.assign(document.createElement("canvas"), {
            width: MODEL_SIZE,
            height: MODEL_SIZE,
          });
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { willReadFrequently: true }) as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D;
    onProgress?.("Model ready");
  }

  dispose() {
    void this.session?.release?.();
    this.session = null;
  }

  /**
   * Runs detection on one frame. Returns [] if a previous inference is still
   * running, which keeps the UI thread responsive (frame skipping).
   */
  async detect(
    source: HTMLVideoElement | HTMLCanvasElement,
    opts: DetectorOptions = {},
  ): Promise<Detection[] | null> {
    const { scoreThreshold = 0.4, iouThreshold = 0.45, maxDetections = 50 } = opts;
    if (!this.session || !this.ctx || !this.ort || this.busy) return null;

    const srcW = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
    const srcH = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
    if (!srcW || !srcH) return null;

    this.busy = true;
    try {
      // --- 1. Letterbox -------------------------------------------------
      const scale = Math.min(MODEL_SIZE / srcW, MODEL_SIZE / srcH);
      const dw = Math.round(srcW * scale);
      const dh = Math.round(srcH * scale);
      const padX = (MODEL_SIZE - dw) / 2;
      const padY = (MODEL_SIZE - dh) / 2;
      const ctx = this.ctx;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, MODEL_SIZE, MODEL_SIZE);
      ctx.drawImage(source as CanvasImageSource, padX, padY, dw, dh);
      const { data } = ctx.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE);

      // --- 2. RGBA -> NCHW float ---------------------------------------
      const plane = MODEL_SIZE * MODEL_SIZE;
      const input = this.input;
      for (let i = 0; i < plane; i++) {
        input[i] = data[i * 4] / 255;
        input[i + plane] = data[i * 4 + 1] / 255;
        input[i + 2 * plane] = data[i * 4 + 2] / 255;
      }

      // --- 3. Inference -------------------------------------------------
      const tensor = new this.ort.Tensor("float32", input, [1, 3, MODEL_SIZE, MODEL_SIZE]);
      const outputs = await this.session.run({ [this.inputName]: tensor });
      const out = outputs[this.session.outputNames[0]] as OrtTensor;
      const raw = out.data as Float32Array;
      const [, channels, anchors] = out.dims as number[];
      const numClasses = channels - 4;

      // --- 4. Decode + threshold ---------------------------------------
      const candidates: Detection[] = [];
      for (let a = 0; a < anchors; a++) {
        let best = 0;
        let bestId = -1;
        for (let c = 0; c < numClasses; c++) {
          const s = raw[(4 + c) * anchors + a];
          if (s > best) {
            best = s;
            bestId = c;
          }
        }
        if (bestId < 0 || best < scoreThreshold) continue;
        const cx = raw[a];
        const cy = raw[anchors + a];
        const w = raw[2 * anchors + a];
        const h = raw[3 * anchors + a];
        // Undo letterbox -> original frame pixels
        const x = (cx - w / 2 - padX) / scale;
        const y = (cy - h / 2 - padY) / scale;
        candidates.push({
          x: Math.max(0, x),
          y: Math.max(0, y),
          width: Math.min(w / scale, srcW - Math.max(0, x)),
          height: Math.min(h / scale, srcH - Math.max(0, y)),
          score: best,
          classId: bestId,
          label: COCO_CLASSES[bestId] ?? `class ${bestId}`,
        });
      }

      return nms(candidates, iouThreshold).slice(0, maxDetections);
    } finally {
      this.busy = false;
    }
  }
}

export function iou(a: Detection | Box, b: Detection | Box): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  if (inter <= 0) return 0;
  return inter / (a.width * a.height + b.width * b.height - inter);
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Class-wise greedy Non-Maximum Suppression. */
function nms(dets: Detection[], threshold: number): Detection[] {
  const sorted = [...dets].sort((a, b) => b.score - a.score);
  const kept: Detection[] = [];
  for (const d of sorted) {
    if (kept.some((k) => k.classId === d.classId && iou(k, d) > threshold)) continue;
    kept.push(d);
  }
  return kept;
}
