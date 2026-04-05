import React, { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { MOCK_TRACKING_DATA, SAFE_ZONES } from "../utils/mockData";

// ── Fix Leaflet default icon path broken by Vite bundler ──────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Custom SVG marker factory ─────────────────────────────────────────────
function createSvgIcon(color, label) {
  return L.divIcon({
    className: "",
    iconSize:  [36, 36],
    iconAnchor:[18, 36],
    popupAnchor:[0, -36],
    html: `
      <div style="
        width:36px;height:36px;display:flex;align-items:center;justify-content:center;
        background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        box-shadow:0 0 12px ${color}88;border:2px solid rgba(255,255,255,0.25);
      ">
        <span style="transform:rotate(45deg);font-size:14px;">${label}</span>
      </div>
    `,
  });
}

const SAFE_ZONE_ICONS = {
  mall:    createSvgIcon("#10b981", "🏬"),
  metro:   createSvgIcon("#38bdf8", "🚇"),
  college: createSvgIcon("#a78bfa", "🎓"),
  signal:  createSvgIcon("#f59e0b", "🚦"),
};

const USER_START_ICON = createSvgIcon("#38bdf8",  "🧍");
const ALERT_ICON      = createSvgIcon("#f43f5e",  "⚠️");

// ── Split path at the suspicious boundary ─────────────────────────────────
const SAFE_PATH = MOCK_TRACKING_DATA
  .filter(d => !d.isSuspicious)
  .map(d => [d.lat, d.lng]);

const SUSPICIOUS_PATH = MOCK_TRACKING_DATA
  .filter(d => d.isSuspicious)
  .map(d => [d.lat, d.lng]);

// Stitch the last safe point to the first suspicious — no gap in polyline
const STITCH = (() => {
  const lastSafe   = MOCK_TRACKING_DATA.findLast(d => !d.isSuspicious);
  const firstSusp  = MOCK_TRACKING_DATA.find  (d =>  d.isSuspicious);
  return lastSafe && firstSusp
    ? [[lastSafe.lat, lastSafe.lng], [firstSusp.lat, firstSusp.lng]]
    : [];
})();

const LAST_POINT  = MOCK_TRACKING_DATA[MOCK_TRACKING_DATA.length - 1];
const FIRST_POINT = MOCK_TRACKING_DATA[0];

// ── Fit-bounds helper component ───────────────────────────────────────────
function FitBounds() {
  const map = useMap();
  useEffect(() => {
    const bounds = MOCK_TRACKING_DATA.map(d => [d.lat, d.lng]);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map]);
  return null;
}

// ── Main Map Component ────────────────────────────────────────────────────
export default function KavachMap({ compact = false }) {
  const height = compact ? "200px" : "320px";

  return (
    <div
      className="rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl"
      style={{ height }}
    >
      <MapContainer
        center={[12.933, 77.627]}
        zoom={15}
        scrollWheelZoom={false}
        zoomControl={false}
        style={{ height: "100%", width: "100%", background: "#0b0f1a" }}
        attributionControl={false}
      >
        {/* Dark map tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        <FitBounds />

        {/* Safe portion of path — blue */}
        {SAFE_PATH.length > 1 && (
          <Polyline
            positions={SAFE_PATH}
            pathOptions={{ color: "#38bdf8", weight: 4, opacity: 0.85, dashArray: "8 4" }}
          />
        )}

        {/* Bridge safe→suspicious */}
        {STITCH.length === 2 && (
          <Polyline
            positions={STITCH}
            pathOptions={{ color: "#f59e0b", weight: 4, opacity: 0.8, dashArray: "4 4" }}
          />
        )}

        {/* Suspicious portion — red animated */}
        {SUSPICIOUS_PATH.length > 1 && (
          <Polyline
            positions={SUSPICIOUS_PATH}
            pathOptions={{ color: "#f43f5e", weight: 5, opacity: 0.9 }}
          />
        )}

        {/* User start marker */}
        <Marker position={[FIRST_POINT.lat, FIRST_POINT.lng]} icon={USER_START_ICON}>
          <Popup className="kavach-popup">
            <div className="text-slate-900 text-xs font-semibold">
              Journey Start<br />
              <span className="text-slate-600 font-normal">{FIRST_POINT.timeLabel}</span>
            </div>
          </Popup>
        </Marker>

        {/* Alert marker at last suspicious point */}
        <Marker position={[LAST_POINT.lat, LAST_POINT.lng]} icon={ALERT_ICON}>
          <Popup>
            <div className="text-slate-900 text-xs font-semibold">
              ⚠️ Tracker Detected<br />
              <span className="text-slate-600 font-normal">RSSI stable for 450 m</span>
            </div>
          </Popup>
        </Marker>

        {/* Safe zone markers */}
        {SAFE_ZONES.map(zone => (
          <Marker
            key={zone.label}
            position={[zone.lat, zone.lng]}
            icon={SAFE_ZONE_ICONS[zone.type] || SAFE_ZONE_ICONS.signal}
          >
            <Popup>
              <div className="text-slate-900 text-xs font-semibold">
                🛡️ {zone.label}<br />
                <span className="text-emerald-600 font-normal">Safe Zone</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
