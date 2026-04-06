/**
 * detection.js
 * Core anti-stalking detection engine for Kavach.
 *
 * Strategy:
 *  - Legitimate BLE devices (phones, APs) show HIGH RSSI variance as the user
 *    moves — they stay put while the user walks away.
 *  - A trailing tracker shows LOW RSSI variance because it maintains a
 *    constant distance from the victim.
 *
 * No MAC addresses are stored or compared.
 */

/**
 * Calculate the population variance of an array of numbers.
 * @param {number[]} arr
 * @returns {number}
 */
export function calcVariance(arr) {
  if (!arr || arr.length < 2) return Infinity;
  const mean = arr.reduce((sum, v) => sum + v, 0) / arr.length;
  const squaredDiffs = arr.map(v => (v - mean) ** 2);
  return squaredDiffs.reduce((sum, v) => sum + v, 0) / arr.length;
}

/**
 * Calculate the mean of an array.
 * @param {number[]} arr
 * @returns {number}
 */
export function calcMean(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

/**
 * Haversine distance between two GPS coordinates (in metres).
 * @param {{ lat: number, lng: number }} a
 * @param {{ lat: number, lng: number }} b
 * @returns {number} distance in metres
 */
export function haversineDistance(a, b) {
  const R = 6371000; // Earth radius in metres
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const chord =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord));
}

/**
 * Total path distance across an ordered array of GPS positions.
 * @param {{ lat: number, lng: number }[]} positions
 * @returns {number} total metres
 */
export function totalPathDistance(positions) {
  if (!positions || positions.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < positions.length; i++) {
    total += haversineDistance(positions[i - 1], positions[i]);
  }
  return total;
}

/**
 * Main detection function.
 *
 * @param {number[]}  signalHistory   — ordered RSSI readings for a device
 * @param {{ lat: number, lng: number }[]} movementHistory — ordered GPS fixes for the user
 * @returns {{
 *   isStalker: boolean,
 *   variance: number,
 *   distance: number,
 *   confidence: number,        // 0–100 %
 *   reason: string
 * }}
 */
/**
 * @param {{ accelMoving?: boolean }} [options] — DeviceMotion hint when GPS delta is small
 */
export function detectStalker(signalHistory, movementHistory, options = {}) {
  const variance = calcVariance(signalHistory);
  const distance = totalPathDistance(movementHistory);
  const userMoved = distance > 20 || Boolean(options.accelMoving);

  // Primary condition: near-constant RSSI while user has moved (GPS or motion)
  const isStalker = variance < 5 && userMoved;

  // Confidence score — higher when variance is very low and distance is large
  const varianceScore = Math.max(0, 1 - variance / 5);       // 0..1 (lower variance → higher)
  const distanceScore = Math.min(1, distance / 200 + (options.accelMoving ? 0.25 : 0));
  const confidence    = Math.round(varianceScore * distanceScore * 100);

  let reason = "";
  if (isStalker) {
    reason = `RSSI variance of ${variance.toFixed(2)} dB² is critically low while user moved ${distance.toFixed(0)} m. Device is likely tracking you.`;
  } else if (variance >= 5 && !userMoved) {
    reason = "Not enough movement data and RSSI is normal.";
  } else if (variance >= 5) {
    reason = `RSSI variance (${variance.toFixed(2)}) is high — device appears stationary. Safe.`;
  } else {
    reason = `Insufficient movement (${distance.toFixed(0)} m GPS). Monitoring continues. Try walking or enable motion.`;
  }

  return { isStalker, variance, distance, confidence, reason };
}

/**
 * Convenience: run detection against the full mock dataset.
 * @param {import('./mockData').MOCK_TRACKING_DATA} data
 * @returns {ReturnType<detectStalker>}
 */
export function analyzeTrackingData(data) {
  const rssiHistory  = data.map(d => d.rssi);
  const gpsHistory   = data.map(d => ({ lat: d.lat, lng: d.lng }));
  return detectStalker(rssiHistory, gpsHistory);
}

/** Threat level label from confidence score */
export function threatLabel(confidence) {
  if (confidence >= 80) return { level: "CRITICAL", color: "rose"   };
  if (confidence >= 50) return { level: "HIGH",     color: "amber"  };
  if (confidence >= 20) return { level: "MODERATE", color: "amber"  };
  return                       { level: "LOW",      color: "emerald" };
}
