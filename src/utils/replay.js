import { haversineDistance } from "./detection";

/** @param {{ time?: number, timestamp?: string }[]} path */
export function sortPathByTime(path) {
  return [...path].sort((a, b) => {
    const ta = typeof a.time === "number" ? a.time : new Date(a.timestamp || 0).getTime();
    const tb = typeof b.time === "number" ? b.time : new Date(b.timestamp || 0).getTime();
    return ta - tb;
  });
}

/**
 * Build { start, end, distanceM, pointCount } segments from ordered logs (for PDF / UI).
 * @param {{ timestamp?: string, location?: { lat: number, lng: number }, isSuspicious?: boolean }[]} logs
 */
export function buildTrackingSegments(logs) {
  const ordered = sortPathByTime(logs);
  const segments = [];
  let current = null;

  for (const log of ordered) {
    const suspicious = Boolean(log.isSuspicious);
    const loc = log.location;
    if (!loc) continue;

    if (suspicious) {
      if (!current) {
        current = { start: log.timestamp, startLoc: loc, points: [loc] };
      } else {
        current.points.push(loc);
      }
    } else if (current) {
      const end = log.timestamp;
      const dist = pathLengthM(current.points);
      segments.push({
        start: current.start,
        end,
        distanceM: dist,
        pointCount: current.points.length,
      });
      current = null;
    }
  }

  if (current && current.points.length > 1) {
    segments.push({
      start: current.start,
      end: ordered[ordered.length - 1]?.timestamp,
      distanceM: pathLengthM(current.points),
      pointCount: current.points.length,
    });
  }

  return segments;
}

function pathLengthM(points) {
  if (!points || points.length < 2) return 0;
  let t = 0;
  for (let i = 1; i < points.length; i++) {
    t += haversineDistance(points[i - 1], points[i]);
  }
  return t;
}
