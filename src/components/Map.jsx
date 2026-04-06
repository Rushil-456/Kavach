import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { getSessionLogs } from "../utils/storage";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function createSvgIcon(color, label) {
  return L.divIcon({
    className: "", iconSize:  [36, 36], iconAnchor:[18, 36], popupAnchor:[0, -36],
    html: `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 0 12px ${color}88;border:2px solid rgba(255,255,255,0.25);"><span style="transform:rotate(45deg);font-size:14px;">${label}</span></div>`,
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

const SAFE_ZONES = [
  { lat: 12.9352, lng: 77.6245, label: "Forum Mall",          type: "mall"    },
  { lat: 12.9279, lng: 77.6271, label: "Koramangala Metro",   type: "metro"   },
  { lat: 12.9341, lng: 77.6186, label: "Jyoti Nivas College", type: "college" },
  { lat: 12.9398, lng: 77.6270, label: "Sony World Signal",   type: "signal"  },
];

function FitBounds({ path }) {
  const map = useMap();
  useEffect(() => {
    if (path.length > 0) map.fitBounds(path, { padding: [40, 40] });
  }, [map, path]);
  return null;
}

export default function KavachMap({ sessionId, compact = false }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    let interval;
    const fetchLogs = async () => {
      if (!sessionId) return;
      const data = await getSessionLogs(sessionId);
      setLogs(data);
    };
    fetchLogs();
    interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const height = compact ? "200px" : "320px";
  
  if (!sessionId || logs.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-700/60 shadow-2xl flex items-center justify-center text-slate-500 bg-slate-900" style={{ height }}>
         Waiting for GPS and BLE data...
      </div>
    );
  }

  // Calculate paths
  const safePath = [];
  const suspPath = [];
  
  logs.forEach((log) => {
    const isThreat = log.devices.some(d => d.isThreat);
    if (isThreat) suspPath.push([log.location.lat, log.location.lng]);
    else safePath.push([log.location.lat, log.location.lng]);
  });

  const allPoints = logs.map(l => [l.location.lat, l.location.lng]);
  const startPoint = allPoints[0];
  const lastPoint = allPoints[allPoints.length - 1];

  return (
    <div id="kavachmap-container" className="rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl" style={{ height }}>
      <MapContainer center={startPoint} zoom={15} scrollWheelZoom={false} zoomControl={false} style={{ height: "100%", width: "100%", background: "#0b0f1a" }} attributionControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" subdomains="abcd" maxZoom={20} />
        <FitBounds path={allPoints} />
        
        {safePath.length > 1 && <Polyline positions={safePath} pathOptions={{ color: "#38bdf8", weight: 4, opacity: 0.85, dashArray: "8 4" }} />}
        {suspPath.length > 1 && <Polyline positions={suspPath} pathOptions={{ color: "#f43f5e", weight: 5, opacity: 0.9 }} />}

        <Marker position={startPoint} icon={USER_START_ICON}>
          <Popup><div className="text-slate-900 text-xs font-semibold">Journey Start</div></Popup>
        </Marker>
        
        {suspPath.length > 0 && (
          <Marker position={suspPath[suspPath.length - 1] || lastPoint} icon={ALERT_ICON}>
            <Popup><div className="text-slate-900 text-xs font-semibold">⚠️ Tracker Detected</div></Popup>
          </Marker>
        )}

        {SAFE_ZONES.map(zone => (
          <Marker key={zone.label} position={[zone.lat, zone.lng]} icon={SAFE_ZONE_ICONS[zone.type] || SAFE_ZONE_ICONS.signal}>
            <Popup><div className="text-slate-900 text-xs font-semibold">🛡️ {zone.label}<br /><span className="text-emerald-600 font-normal">Safe Zone</span></div></Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
