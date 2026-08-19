/**
 * Lightweight SORT-style multi-object tracker.
 *
 * Real SORT = Kalman filter + Hungarian assignment. For browser use we keep the
 * same structure but simplify:
 *  - motion model: constant-velocity prediction from the last two centres
 *  - association: greedy IoU matching (highest IoU first) instead of Hungarian
 *  - track lifecycle: `maxAge` frames of coasting before a track is deleted,
 *    `minHits` confirmations before a track is reported.
 * This keeps IDs stable across consecutive frames at a fraction of the cost.
 */
import { iou, type Detection } from "./detector";

export interface Track {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
  classId: number;
  label: string;
  age: number; // total frames since creation
  hits: number; // number of matched frames
  timeSinceUpdate: number; // frames since last match
  vx: number;
  vy: number;
  confirmed: boolean;
}

export interface TrackerOptions {
  iouThreshold?: number;
  maxAge?: number;
  minHits?: number;
}

export class SortTracker {
  private tracks: Track[] = [];
  private nextId = 1;
  private readonly iouThreshold: number;
  private readonly maxAge: number;
  private readonly minHits: number;

  constructor(opts: TrackerOptions = {}) {
    this.iouThreshold = opts.iouThreshold ?? 0.3;
    this.maxAge = opts.maxAge ?? 15;
    this.minHits = opts.minHits ?? 2;
  }

  reset() {
    this.tracks = [];
    this.nextId = 1;
  }

  /** Feed one frame of detections; returns the confirmed, visible tracks. */
  update(detections: Detection[]): Track[] {
    // 1. Predict: move every track by its estimated velocity.
    for (const t of this.tracks) {
      t.x += t.vx;
      t.y += t.vy;
      t.age += 1;
      t.timeSinceUpdate += 1;
    }

    // 2. Associate: greedy IoU matching, same class only.
    const pairs: { d: number; t: number; iou: number }[] = [];
    detections.forEach((det, di) => {
      this.tracks.forEach((track, ti) => {
        if (track.classId !== det.classId) return;
        const score = iou(det, track);
        if (score >= this.iouThreshold) pairs.push({ d: di, t: ti, iou: score });
      });
    });
    pairs.sort((a, b) => b.iou - a.iou);

    const usedDet = new Set<number>();
    const usedTrack = new Set<number>();
    for (const p of pairs) {
      if (usedDet.has(p.d) || usedTrack.has(p.t)) continue;
      usedDet.add(p.d);
      usedTrack.add(p.t);
      const det = detections[p.d]!;
      const track = this.tracks[p.t]!;
      // Velocity from centre displacement (smoothed).
      const prevCx = track.x + track.width / 2;
      const prevCy = track.y + track.height / 2;
      const newCx = det.x + det.width / 2;
      const newCy = det.y + det.height / 2;
      track.vx = 0.6 * track.vx + 0.4 * (newCx - prevCx);
      track.vy = 0.6 * track.vy + 0.4 * (newCy - prevCy);
      track.x = det.x;
      track.y = det.y;
      track.width = det.width;
      track.height = det.height;
      track.score = det.score;
      track.hits += 1;
      track.timeSinceUpdate = 0;
      if (track.hits >= this.minHits) track.confirmed = true;
    }

    // 3. Create new tracks for unmatched detections.
    detections.forEach((det, di) => {
      if (usedDet.has(di)) return;
      this.tracks.push({
        id: this.nextId++,
        x: det.x,
        y: det.y,
        width: det.width,
        height: det.height,
        score: det.score,
        classId: det.classId,
        label: det.label,
        age: 1,
        hits: 1,
        timeSinceUpdate: 0,
        vx: 0,
        vy: 0,
        confirmed: this.minHits <= 1,
      });
    });

    // 4. Delete stale tracks.
    this.tracks = this.tracks.filter((t) => t.timeSinceUpdate <= this.maxAge);

    return this.tracks.filter((t) => t.confirmed && t.timeSinceUpdate === 0);
  }

  get activeCount() {
    return this.tracks.filter((t) => t.confirmed).length;
  }
}
