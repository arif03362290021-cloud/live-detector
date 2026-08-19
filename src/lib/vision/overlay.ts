/** Canvas overlay renderer: bounding boxes + "Label | ID: n | 94%" tags. */
import { classHue } from "./coco-classes";
import type { Track } from "./tracker";

export interface OverlayOptions {
  showBoxes: boolean;
  showIds: boolean;
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  tracks: Track[],
  opts: OverlayOptions,
) {
  const { canvas } = ctx;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!opts.showBoxes) return;

  const scale = Math.max(1, canvas.width / 640);
  ctx.lineWidth = Math.max(2, 2 * scale);
  ctx.font = `${Math.round(14 * scale)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textBaseline = "top";

  for (const t of tracks) {
    const color = `hsl(${classHue(t.classId)} 90% 60%)`;
    ctx.strokeStyle = color;
    ctx.strokeRect(t.x, t.y, t.width, t.height);

    const parts = [t.label];
    if (opts.showIds) parts.push(`ID: ${t.id}`);
    parts.push(`${Math.round(t.score * 100)}%`);
    const text = parts.join("  |  ");

    const padding = 6 * scale;
    const textWidth = ctx.measureText(text).width;
    const boxHeight = 20 * scale;
    const labelY = t.y - boxHeight > 0 ? t.y - boxHeight : t.y;

    ctx.fillStyle = color;
    ctx.fillRect(t.x - ctx.lineWidth / 2, labelY, textWidth + padding * 2, boxHeight);
    ctx.fillStyle = "#04121f";
    ctx.fillText(text, t.x + padding - ctx.lineWidth / 2, labelY + 3 * scale);
  }
}
