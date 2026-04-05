/**
 * mockData.js
 * Simulates a user walking through Koramangala, Bangalore
 * while a concealed tracking device follows them.
 *
 * RSSI values for the suspicious device stay nearly constant (variance < 5)
 * even as the user covers > 20 meters — the hallmark Kavach detects.
 */

/** Safe-zone landmarks rendered as map markers */
export const SAFE_ZONES = [
  { lat: 12.9352, lng: 77.6245, label: "Forum Mall",          type: "mall"    },
  { lat: 12.9279, lng: 77.6271, label: "Koramangala Metro",   type: "metro"   },
  { lat: 12.9341, lng: 77.6186, label: "Jyoti Nivas College", type: "college" },
  { lat: 12.9398, lng: 77.6270, label: "Sony World Signal",   type: "signal"  },
];

/** User's GPS path (approx 600 m walk, ~50-m grid steps) */
const USER_PATH = [
  { lat: 12.9279, lng: 77.6271 },
  { lat: 12.9289, lng: 77.6265 },
  { lat: 12.9300, lng: 77.6259 },
  { lat: 12.9311, lng: 77.6253 },
  { lat: 12.9320, lng: 77.6248 },
  { lat: 12.9330, lng: 77.6243 },
  { lat: 12.9341, lng: 77.6240 },
  { lat: 12.9352, lng: 77.6245 },
  { lat: 12.9360, lng: 77.6252 },
  { lat: 12.9368, lng: 77.6260 },
  { lat: 12.9375, lng: 77.6268 },
  { lat: 12.9382, lng: 77.6270 },
  { lat: 12.9390, lng: 77.6270 },
  { lat: 12.9398, lng: 77.6270 },
];

/** Stable RSSI values for the tracker (very low variance ≈ 1.8) */
const TRACKER_RSSI = [
  -62, -63, -62, -61, -63, -62, -62, -63, -61, -62, -63, -62, -61, -62,
];

/** Normal environmental signals (high variance ≈ 18 — safe) */
const NORMAL_RSSI = [
  -75, -82, -68, -90, -71, -85, -77, -63, -88, -74, -80, -69, -91, -73,
];

/**
 * Main mock dataset — one entry per GPS waypoint.
 * isSuspicious = true for the latter half (after the device "locks on").
 */
export const MOCK_TRACKING_DATA = USER_PATH.map((coords, i) => {
  const baseTime = new Date("2026-04-05T09:12:00+05:30");
  baseTime.setSeconds(baseTime.getSeconds() + i * 45);

  return {
    id:           `wp-${i}`,
    lat:          coords.lat,
    lng:          coords.lng,
    rssi:         TRACKER_RSSI[i],
    normalRssi:   NORMAL_RSSI[i],
    time:         baseTime.toISOString(),
    timeLabel:    baseTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    isSuspicious: i >= 4,   // device starts tracking from waypoint 4
    distanceMoved: i * 50,  // approximate metres from start
  };
});

/** Pre-computed chart series */
export const CHART_LABELS   = MOCK_TRACKING_DATA.map(d => d.timeLabel);
export const CHART_RSSI     = MOCK_TRACKING_DATA.map(d => d.rssi);
export const CHART_NORMAL   = MOCK_TRACKING_DATA.map(d => d.normalRssi);

/** Suspicious device profile shown in the UI */
export const SUSPICIOUS_DEVICE = {
  name:        "Unknown BLE Tracker",
  rssiHistory: TRACKER_RSSI,
  variance:    1.8,
  lastSeen:    "Just now",
  address:     "??:??:??:??:??:??",  // privacy — MAC hidden
  threat:      "HIGH",
};

/** Benign device for comparison */
export const SAFE_DEVICE = {
  name:        "Neighbor's Phone",
  rssiHistory: NORMAL_RSSI,
  variance:    58.4,
  lastSeen:    "3 min ago",
  address:     "??:??:??:??:??:??",
  threat:      "LOW",
};
