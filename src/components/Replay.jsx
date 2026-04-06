import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import { Play, Pause, RotateCcw } from "lucide-react";
import L from "leaflet";
import { getSessionLogs } from "../utils/storage";

const START_ICON = L.divIcon({ className:"", iconSize:[24,24], html: `<div style="width:24px;height:24px;background:#38bdf8;border-radius:50%;border:2px solid white;"></div>` });
const ACTIVE_ICON = L.divIcon({ className:"", iconSize:[24,24], html: `<div style="width:24px;height:24px;background:#f43f5e;border-radius:50%;border:2px solid white;box-shadow:0 0 10px #f43f5e;"></div>` });

function ReplayBounds({ path }) {
  const map = useMap();
  useEffect(() => {
    if (path.length > 0) map.fitBounds(path, { padding: [40,40] });
  }, [map, path]);
  return null;
}

export default function Replay({ sessionId }) {
  const [logs, setLogs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if(sessionId) {
      getSessionLogs(sessionId).then(res => setLogs(res));
    }
  }, [sessionId]);

  useEffect(() => {
    let timer;
    if (isPlaying && currentIndex < logs.length - 1) {
      timer = setTimeout(() => setCurrentIndex(c => c + 1), 700);
    } else if (currentIndex >= logs.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, logs]);

  if (logs.length === 0) return <div className="p-4 text-slate-500">No data to replay</div>;

  const currentLog = logs[currentIndex];
  // Calculate historical lines up to index
  const pastPath = logs.slice(0, currentIndex + 1).map(l => [l.location.lat, l.location.lng]);
  const isThreatNow = currentLog.devices.some(d => d.isThreat);
  const allPath = logs.map(l => [l.location.lat, l.location.lng]);

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden shadow-card">
      <div className="p-3 border-b border-slate-700/50 flex justify-between items-center bg-slate-800">
         <span className="text-white text-sm font-semibold">Incident Replay</span>
         <span className="text-slate-400 text-xs font-mono">{new Date(currentLog.timestamp).toLocaleTimeString()}</span>
      </div>

      <div style={{ height: "300px" }} className="relative">
        <MapContainer center={allPath[0]} zoom={15} zoomControl={false} style={{height: "100%", width: "100%", background: "#0b0f1a"}}>
           <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
           <ReplayBounds path={allPath} />
           
           {/* Faint complete path */}
           <Polyline positions={allPath} pathOptions={{ color: "#334155", weight: 3, opacity: 0.5 }} />
           
           {/* Active reconstructed path */}
           {pastPath.length > 1 && <Polyline positions={pastPath} pathOptions={{ color: isThreatNow ? "#f43f5e" : "#38bdf8", weight: 4 }} />}
           
           <Marker position={pastPath[pastPath.length - 1]} icon={isThreatNow ? ACTIVE_ICON : START_ICON} />
        </MapContainer>
      </div>

      <div className="p-4 bg-slate-800 flex items-center gap-4">
        <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center">
           {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
        </button>
        <button onClick={() => { setCurrentIndex(0); setIsPlaying(true); }} className="p-2 text-slate-400 hover:text-white">
           <RotateCcw size={16} />
        </button>
        <input 
          type="range" 
          min="0" max={logs.length - 1} 
          value={currentIndex}
          onChange={(e) => { setCurrentIndex(parseInt(e.target.value)); setIsPlaying(false); }}
          className="flex-1 accent-indigo-500"
        />
      </div>
    </div>
  );
}
