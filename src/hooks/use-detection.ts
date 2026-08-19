/**
 * Orchestrates the whole CV pipeline:
 *   camera / uploaded video -> YOLOv8n inference -> SORT tracking -> overlay
 * Runs inference in a requestAnimationFrame loop, skipping frames while a
 * previous inference is still in-flight so the UI never freezes.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { YoloDetector } from "@/lib/vision/detector";
import { SortTracker, type Track } from "@/lib/vision/tracker";
import { drawOverlay } from "@/lib/vision/overlay";

export type ModelState = "idle" | "loading" | "ready" | "error";
export type SourceKind = "none" | "camera" | "video";

export interface DetectionStats {
  fps: number;
  detections: number;
  activeTracks: number;
}

export function useDetection() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<YoloDetector | null>(null);
  const trackerRef = useRef(new SortTracker());
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const runningRef = useRef(false);
  const optionsRef = useRef({ showBoxes: true, showIds: true });
  const objectUrlRef = useRef<string | null>(null);

  const [modelState, setModelState] = useState<ModelState>("idle");
  const [modelMessage, setModelMessage] = useState("Model not loaded");
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<SourceKind>("none");
  const [detecting, setDetecting] = useState(false);
  const [stats, setStats] = useState<DetectionStats>({
    fps: 0,
    detections: 0,
    activeTracks: 0,
  });
  const [tracks, setTracks] = useState<Track[]>([]);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showIds, setShowIds] = useState(true);

  useEffect(() => {
    optionsRef.current = { showBoxes, showIds };
  }, [showBoxes, showIds]);

  const ensureModel = useCallback(async () => {
    if (!detectorRef.current) detectorRef.current = new YoloDetector();
    if (detectorRef.current.ready) return detectorRef.current;
    setModelState("loading");
    setError(null);
    try {
      await detectorRef.current.load((m) => setModelMessage(m));
      setModelState("ready");
      setModelMessage("YOLOv8n ready (ONNX Runtime Web)");
      return detectorRef.current;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setModelState("error");
      setModelMessage("Model failed to load");
      setError(`Could not load the YOLOv8n model: ${msg}`);
      return null;
    }
  }, []);

  const syncCanvas = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
  }, []);

  const clearOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const loop = useCallback(async () => {
    const detector = detectorRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!runningRef.current || !detector || !video || !canvas) return;

    syncCanvas();
    const start = performance.now();
    let updated = false;
    if (!video.paused && !video.ended && video.readyState >= 2) {
      const detections = await detector.detect(video, { scoreThreshold: 0.4 });
      if (detections) {
        const active = trackerRef.current.update(detections);
        const ctx = canvas.getContext("2d");
        if (ctx) drawOverlay(ctx, active, optionsRef.current);
        const fps = 1000 / Math.max(1, performance.now() - start);
        setStats({
          fps: Math.round(fps * 10) / 10,
          detections: detections.length,
          activeTracks: trackerRef.current.activeCount,
        });
        setTracks(active);
        updated = true;
      }
    }
    if (!updated) {
      // yield to the browser to avoid a tight busy loop
      await new Promise((r) => setTimeout(r, 30));
    }
    if (runningRef.current) rafRef.current = requestAnimationFrame(() => void loop());
  }, [syncCanvas]);

  const startDetection = useCallback(async () => {
    if (runningRef.current) return;
    const detector = await ensureModel();
    if (!detector) return;
    if (!videoRef.current?.srcObject && !videoRef.current?.src) {
      setError("Start the camera or upload a video first.");
      return;
    }
    setError(null);
    runningRef.current = true;
    setDetecting(true);
    void loop();
  }, [ensureModel, loop]);

  const stopDetection = useCallback(() => {
    runningRef.current = false;
    setDetecting(false);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser does not support camera access.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      video.removeAttribute("src");
      video.muted = true;
      await video.play();
      setSource("camera");
      syncCanvas();
      void startDetection();
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      setError(
        name === "NotAllowedError"
          ? "Camera permission was denied. Enable it in your browser settings and try again."
          : name === "NotFoundError"
            ? "No camera device was found on this system."
            : `Could not start the camera: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }, [startDetection, syncCanvas]);

  const stopCamera = useCallback(() => {
    stopDetection();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
      video.load();
    }
    setSource("none");
    clearOverlay();
  }, [clearOverlay, stopDetection]);

  const loadVideoFile = useCallback(
    async (file: File) => {
      setError(null);
      const video = videoRef.current;
      if (!video) return;
      // stop any live camera first
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      video.srcObject = null;

      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      video.src = url;
      video.loop = true;
      video.muted = true;

      try {
        await new Promise<void>((resolve, reject) => {
          const onLoaded = () => {
            cleanup();
            resolve();
          };
          const onError = () => {
            cleanup();
            reject(new Error("unsupported"));
          };
          const cleanup = () => {
            video.removeEventListener("loadeddata", onLoaded);
            video.removeEventListener("error", onError);
          };
          video.addEventListener("loadeddata", onLoaded);
          video.addEventListener("error", onError);
        });
        await video.play();
        setSource("video");
        trackerRef.current.reset();
        syncCanvas();
        void startDetection();
      } catch {
        setError(
          `This browser cannot decode "${file.name}". Try an MP4 (H.264) or WebM file instead.`,
        );
        setSource("none");
      }
    },
    [startDetection, syncCanvas],
  );

  const reset = useCallback(() => {
    stopDetection();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
      video.removeAttribute("src");
      video.load();
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    trackerRef.current.reset();
    setTracks([]);
    setStats({ fps: 0, detections: 0, activeTracks: 0 });
    setSource("none");
    setError(null);
    clearOverlay();
  }, [clearOverlay, stopDetection]);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    modelState,
    modelMessage,
    error,
    source,
    detecting,
    stats,
    tracks,
    showBoxes,
    showIds,
    setShowBoxes,
    setShowIds,
    ensureModel,
    startCamera,
    stopCamera,
    loadVideoFile,
    startDetection,
    stopDetection,
    reset,
  };
}
