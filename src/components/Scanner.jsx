import React, { useState, useCallback, useRef, useEffect } from "react";
import { Bluetooth, BluetoothOff, ShieldAlert, Cpu, Radio, Zap, AlertTriangle, Square, CircleSlash } from "lucide-react";
import { clsx } from "clsx";
import { startBLEScan, isBluetoothSupported } from "../utils/ble";
import { detectStalker, threatLabel } from "../utils/detection";
import { createSession, logEvent, markSessionAsThreat } from "../utils/storage";

const C = { card: "bg-white dark:bg-kavach-cdark border border-kavach-silver/20 dark:border-white/6 shadow-card" };

function DeviceRow({ device, index }) {
  return (
    <div
      className={clsx("flex items-center gap-3 px-3 py-2.5 rounded-xl animate-slide-up", C.card, device.isThreat && "border-l-4 border-l-kavach-danger")}
      style={{ animationDelay:`${index*60}ms` }}
    >
      <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", device.isThreat ? "bg-kavach-danger/10" : "bg-kavach-teal/10 dark:bg-kavach-blue/10")}>
        {device.isThreat ? <ShieldAlert size={15} className="text-kavach-danger" /> : <Cpu size={15} className="text-kavach-teal dark:text-kavach-blue" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-kavach-navy dark:text-slate-100 truncate">{device.name}</p>
        <p className="text-[11px] font-mono text-kavach-silver dark:text-slate-500">
          RSSI: <span className={device.isThreat ? "text-kavach-danger" : "text-kavach-teal dark:text-kavach-blue"}>{device.rssi} dBm</span>
        </p>
      </div>
      <span className={clsx("text-[9px] font-bold tracking-widest px-2.5 py-1 rounded-full border", device.isThreat ? "text-kavach-danger bg-kavach-danger/8 border-kavach-danger/25" : "text-kavach-teal dark:text-kavach-blue bg-kavach-teal/8 dark:bg-kavach-blue/8 border-kavach-teal/25 dark:border-kavach-blue/25")}>
        {device.isThreat ? "TRACKING" : "SAFE"}
      </span>
    </div>
  );
}

function StatChip({ icon: Icon, value, label }) {
  return (
    <div className={clsx("flex-1 rounded-xl p-3 text-center", C.card)}>
      <Icon size={13} className="text-kavach-silver dark:text-slate-500 mx-auto mb-1" />
      <p className="text-base font-bold font-mono text-kavach-navy dark:text-slate-100">{value}</p>
      <p className="text-[9px] uppercase tracking-wide text-kavach-silver dark:text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

export default function Scanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [alert, setAlert] = useState(null);
  const [bleError, setBleError] = useState(null);
  const [scanCount, setScanCount] = useState(0);
  
  const stopScanRef = useRef(null);
  const geoWatchRef = useRef(null);
  const locationRef = useRef(null);
  const historyRef = useRef({ timeMap: [] }); 
  const sessionIdRef = useRef(null);
  const alertTriggeredRef = useRef(false);

  const supported = isBluetoothSupported();

  useEffect(() => {
    return () => {
      stopScanRef.current?.();
      if (geoWatchRef.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
      }
    };
  }, []);

  const handleStartScan = useCallback(async () => {
    setBleError(null); setAlert(null); setDevices([]); setScanCount(0);
    alertTriggeredRef.current = false;
    historyRef.current = { timeMap: [] };
    
    // Create new DB session immediately
    const sid = await createSession();
    sessionIdRef.current = sid;

    // Start GPS Tracking
    if ("geolocation" in navigator) {
      geoWatchRef.current = navigator.geolocation.watchPosition(
        pos => { locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
        err => console.warn("GPS error", err),
        { enableHighAccuracy: true, maximumAge: 1000 }
      );
    } else {
      setBleError("Geolocation not available. Tracker detection accuracy will be limited.");
    }

    // Start BLE Tracking
    const { stop } = await startBLEScan({
      onAdvertisement: async entry => {
        setScanCount(c => c + 1);
        
        let shouldVibrate = false;
        
        // Log locally to UI state and device tracking memory
        setDevices(prev => {
          let updated = [...prev];
          const i = updated.findIndex(d => d.name === entry.name);
          
          if (i !== -1) {
            updated[i] = { ...updated[i], rssi: entry.rssi };
          } else {
            updated.push({ ...entry, isThreat: false, rssiHistory: [] });
          }

          // Threat Analysis using Detection Engine
          const device = updated.find(d => d.name === entry.name);
          device.rssiHistory = device.rssiHistory || [];
          device.rssiHistory.push(entry.rssi);
          if(device.rssiHistory.length > 30) device.rssiHistory.shift();

          const now = Date.now();
          historyRef.current.timeMap.push({ rssi: entry.rssi, location: locationRef.current, time: now });
          
          // Use only history for this specific device
          const movements = historyRef.current.timeMap.map(t => t.location).filter(Boolean);
          const result = detectStalker(device.rssiHistory, movements);
          
          device.isThreat = result.isStalker;

          if (result.isStalker) {
            if (!alertTriggeredRef.current) {
               setAlert(result);
               markSessionAsThreat(sessionIdRef.current, 'HIGH');
               shouldVibrate = true;
               alertTriggeredRef.current = true;
            } else if (entry.rssi > -60) {
              // Feature 4: Proximity vibration when tracking confirmed and getting close
              if ("vibrate" in navigator) navigator.vibrate([100]);
            }
          }
          return updated;
        });

        // Trigger major pattern initially
        if (shouldVibrate && "vibrate" in navigator) {
          navigator.vibrate([200,100,200,100,400]);
        }

        // Feature 10: Store to IndexedDB for Evidence Gen and Replay
        if (locationRef.current) {
          // Send summary of the frame to the DB payload
          const snapshot = { name: entry.name, rssi: entry.rssi, isThreat: false }; // Note: isThreat resolution async mapped 
          // For realtime, we log exactly what we see
          await logEvent(sessionIdRef.current, locationRef.current, [snapshot]);
        }
      },
      onError: err => { setBleError(err.message); setIsScanning(false); },
      onUnsupported: () => { setBleError("Web Bluetooth unavailable. Ensure experimental flags are set on Chrome for Android."); setIsScanning(false); },
    });
    
    stopScanRef.current = stop;
    setIsScanning(true);
  }, []);

  const handleStopScan = useCallback(() => { 
    stopScanRef.current?.(); 
    if (geoWatchRef.current !== null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(geoWatchRef.current);
    }
    setIsScanning(false); 
  }, []);

  return (
    <div className="space-y-4">
      {/* BLE unsupported Check */}
      {!supported && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-300/50 dark:border-kavach-gold/20 bg-amber-50 dark:bg-kavach-gold/8 px-3.5 py-3">
          <BluetoothOff size={14} className="text-amber-600 dark:text-kavach-gold flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-kavach-gold leading-relaxed">
            Web Bluetooth unavailable. Use Chrome on Android.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <button
        onClick={isScanning ? handleStopScan : handleStartScan}
        className={clsx(
          "w-full relative overflow-hidden flex flex-col items-center gap-2 p-4 rounded-xl border font-semibold text-sm transition-all duration-200",
          isScanning
            ? "bg-kavach-danger/8 dark:bg-kavach-danger/12 border-kavach-danger/40 text-kavach-danger"
            : "bg-kavach-teal text-white border-kavach-teal shadow-tealsm hover:bg-kavach-navy hover:shadow-tealmd"
        )}
      >
        {isScanning && (
          <><span className="absolute inset-0 rounded-xl border border-kavach-danger/30 sonar-ring"/>
            <span className="absolute inset-0 rounded-xl border border-kavach-danger/15 sonar-ring-delay"/></>
        )}
        <div className="relative">
          {isScanning ? <Square size={22} className="fill-kavach-danger stroke-kavach-danger" /> : <Bluetooth size={22} />}
        </div>
        <span className="relative">{isScanning ? "Stop Realtime Monitoring" : "Start Realtime Monitor"}</span>
      </button>

      {/* Stats strip */}
      {(isScanning || scanCount > 0) && (
        <div className="flex gap-2.5 animate-fade-in">
          <StatChip icon={Radio} value={scanCount} label="Packets" />
          <StatChip icon={Cpu} value={devices.length} label="Devices" />
          <StatChip icon={Zap} value={devices.filter(d=>d.isThreat).length} label="Threats" />
        </div>
      )}

      {/* Error */}
      {bleError && (
        <div className="flex items-start gap-2 rounded-xl border border-kavach-danger/25 bg-kavach-danger/5 dark:bg-kavach-danger/10 px-3.5 py-3 animate-fade-in">
          <CircleSlash size={13} className="text-kavach-danger flex-shrink-0 mt-0.5" />
          <p className="text-xs text-kavach-danger leading-relaxed">{bleError}</p>
        </div>
      )}

      {alert && (
        <div className={clsx("rounded-xl overflow-hidden animate-slide-up border-l-4 border-l-kavach-danger", C.card)}>
          <div className="flex justify-between px-4 py-2.5 bg-kavach-danger/6">
             <div className="flex items-center gap-2">
                <AlertTriangle size={13} className="text-kavach-danger"/>
                <span className="text-[10px] font-bold uppercase text-kavach-danger tracking-wider">Threat Confirmed</span>
             </div>
             <span className="text-[9px] font-bold text-kavach-danger">{alert.confidence}% CONF</span>
          </div>
          <div className="px-4 py-3 text-xs text-kavach-navy dark:text-slate-200">
             {alert.reason}
          </div>
        </div>
      )}

      {/* Device list */}
      {devices.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          <p className="section-label px-0.5">Detected Devices</p>
          {devices.map((d,i) => <DeviceRow key={`${d.name}-${i}`} device={d} index={i} />)}
        </div>
      )}
    </div>
  );
}
