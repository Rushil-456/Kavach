import React, { useState, useCallback, useRef } from "react";
import {
  Bluetooth, BluetoothOff, ShieldAlert, ShieldCheck,
  Cpu, Radio, Zap, AlertTriangle, Square, Activity, CircleSlash,
} from "lucide-react";
import { clsx } from "clsx";
import { startBLEScan, isBluetoothSupported, rssiToLabel } from "../utils/ble";
import { detectStalker, threatLabel } from "../utils/detection";
import { MOCK_TRACKING_DATA, SUSPICIOUS_DEVICE, SAFE_DEVICE } from "../utils/mockData";

const C = {
  card: "bg-white dark:bg-kavach-cdark border border-kavach-silver/20 dark:border-white/6 shadow-card",
};

function DeviceRow({ device, index }) {
  return (
    <div
      className={clsx(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl animate-slide-up",
        C.card,
        device.isThreat && "border-l-4 border-l-kavach-danger"
      )}
      style={{ animationDelay:`${index*60}ms` }}
    >
      <div className={clsx(
        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
        device.isThreat ? "bg-kavach-danger/10" : "bg-kavach-teal/10 dark:bg-kavach-blue/10"
      )}>
        {device.isThreat
          ? <ShieldAlert size={15} className="text-kavach-danger" />
          : <Cpu         size={15} className="text-kavach-teal dark:text-kavach-blue" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-kavach-navy dark:text-slate-100 truncate">{device.name}</p>
        <p className="text-[11px] font-mono text-kavach-silver dark:text-slate-500">
          RSSI: <span className={device.isThreat ? "text-kavach-danger" : "text-kavach-teal dark:text-kavach-blue"}>
            {device.rssi} dBm
          </span>
        </p>
      </div>
      <span className={clsx(
        "text-[9px] font-bold tracking-widest px-2.5 py-1 rounded-full border",
        device.isThreat
          ? "text-kavach-danger bg-kavach-danger/8 border-kavach-danger/25"
          : "text-kavach-teal dark:text-kavach-blue bg-kavach-teal/8 dark:bg-kavach-blue/8 border-kavach-teal/25 dark:border-kavach-blue/25"
      )}>
        {device.isThreat ? "TRACKING" : "SAFE"}
      </span>
    </div>
  );
}

function AlertBanner({ result, onDismiss }) {
  if (!result) return null;
  const { level, color } = threatLabel(result.confidence);
  const isHigh = color === "rose";

  return (
    <div className={clsx(
      "rounded-xl overflow-hidden animate-slide-up border-l-4",
      C.card,
      isHigh ? "border-l-kavach-danger" : "border-l-amber-500"
    )}>
      <div className={clsx(
        "flex items-center justify-between px-4 py-2.5 border-b border-kavach-silver/10 dark:border-white/5",
        isHigh ? "bg-kavach-danger/6 dark:bg-kavach-danger/12" : "bg-amber-50 dark:bg-amber-500/10"
      )}>
        <div className="flex items-center gap-2">
          <AlertTriangle size={13} className={isHigh ? "text-kavach-danger" : "text-amber-600 dark:text-kavach-gold"} />
          <span className={clsx(
            "text-[10px] font-bold uppercase tracking-wider",
            isHigh ? "text-kavach-danger" : "text-amber-700 dark:text-kavach-gold"
          )}>
            Threat Confirmed — {level}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx(
            "text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border",
            isHigh
              ? "text-kavach-danger border-kavach-danger/30 bg-kavach-danger/10"
              : "text-amber-700 dark:text-kavach-gold border-amber-400/40 bg-amber-400/10"
          )}>
            {result.confidence}% CONF
          </span>
          <button onClick={onDismiss} className="w-5 h-5 rounded text-kavach-silver hover:text-kavach-navy dark:hover:text-white transition-colors text-xs">
            ✕
          </button>
        </div>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        <p className="text-xs text-kavach-navy dark:text-slate-200 leading-relaxed">{result.reason}</p>
        <div className="flex gap-5">
          <span className="text-[10px] text-kavach-silver dark:text-slate-500">
            Variance: <span className="font-mono font-semibold text-amber-600 dark:text-kavach-gold">{result.variance?.toFixed(2)} dB²</span>
          </span>
          <span className="text-[10px] text-kavach-silver dark:text-slate-500">
            Distance: <span className="font-mono font-semibold text-kavach-navy dark:text-slate-200">{result.distance?.toFixed(0)} m</span>
          </span>
        </div>
      </div>
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

export default function Scanner({ onSimulationData }) {
  const [isScanning,   setIsScanning  ] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [devices,      setDevices     ] = useState([]);
  const [alert,        setAlert       ] = useState(null);
  const [bleError,     setBleError    ] = useState(null);
  const [scanCount,    setScanCount   ] = useState(0);
  const stopScanRef    = useRef(null);
  const simIntervalRef = useRef(null);
  const supported      = isBluetoothSupported();

  const handleStartScan = useCallback(async () => {
    setBleError(null); setAlert(null); setDevices([]);
    const { stop } = await startBLEScan({
      onAdvertisement: entry => {
        setScanCount(c => c + 1);
        setDevices(prev => {
          const i = prev.findIndex(d => d.name === entry.name);
          if (i !== -1) { const u=[...prev]; u[i]={...u[i],rssi:entry.rssi}; return u; }
          return [...prev, { ...entry, isThreat:false }];
        });
      },
      onError:       err => { setBleError(err.message); setIsScanning(false); },
      onUnsupported: ()  => { setBleError("Web Bluetooth unavailable. Use the simulator below."); setIsScanning(false); },
    });
    stopScanRef.current = stop;
    setIsScanning(true);
  }, []);

  const handleStopScan = useCallback(() => { stopScanRef.current?.(); setIsScanning(false); }, []);

  const handleSimulate = useCallback(() => {
    setIsSimulating(true); setAlert(null); setBleError(null); setDevices([]); setScanCount(0);
    let step = 0;
    simIntervalRef.current = setInterval(() => {
      if (step >= MOCK_TRACKING_DATA.length) {
        clearInterval(simIntervalRef.current);
        setIsSimulating(false);
        const rssiHistory = MOCK_TRACKING_DATA.map(d => d.rssi);
        const gpsHistory  = MOCK_TRACKING_DATA.map(d => ({ lat:d.lat, lng:d.lng }));
        const result      = detectStalker(rssiHistory, gpsHistory);
        setAlert(result);
        onSimulationData?.(MOCK_TRACKING_DATA, result);
        if (result.isStalker && "vibrate" in navigator) navigator.vibrate([200,100,200,100,400]);
        setDevices([
          { name:SUSPICIOUS_DEVICE.name, rssi:SUSPICIOUS_DEVICE.rssiHistory.at(-1), isThreat:true  },
          { name:SAFE_DEVICE.name,        rssi:SAFE_DEVICE.rssiHistory.at(-1),       isThreat:false },
        ]);
        return;
      }
      const point = MOCK_TRACKING_DATA[step];
      setScanCount(c => c+1);
      onSimulationData?.([point], null);
      step++;
    }, 300);
  }, [onSimulationData]);

  const handleStopSimulation = useCallback(() => { clearInterval(simIntervalRef.current); setIsSimulating(false); }, []);

  return (
    <div className="space-y-4">

      {/* BLE unsupported */}
      {!supported && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-300/50 dark:border-kavach-gold/20 bg-amber-50 dark:bg-kavach-gold/8 px-3.5 py-3">
          <BluetoothOff size={14} className="text-amber-600 dark:text-kavach-gold flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-kavach-gold leading-relaxed">
            Web Bluetooth unavailable. Use Chrome on Android with experimental BLE flags, or run the simulation below.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* BLE Scan */}
        <button
          onClick={isScanning ? handleStopScan : handleStartScan}
          disabled={isSimulating}
          className={clsx(
            "relative overflow-hidden flex flex-col items-center gap-2 p-4 rounded-xl border font-semibold text-sm transition-all duration-200 disabled:opacity-40",
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
          <span className="relative">{isScanning ? "Stop Scan" : "Start BLE Scan"}</span>
          {isScanning && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-kavach-danger animate-pulse" />}
        </button>

        {/* Simulate */}
        <button
          onClick={isSimulating ? handleStopSimulation : handleSimulate}
          disabled={isScanning}
          className={clsx(
            "relative overflow-hidden flex flex-col items-center gap-2 p-4 rounded-xl border font-semibold text-sm transition-all duration-200 disabled:opacity-40",
            isSimulating
              ? "bg-amber-50 dark:bg-kavach-gold/10 border-amber-400/50 text-amber-700 dark:text-kavach-gold"
              : clsx(C.card, "text-kavach-navy dark:text-slate-200 hover:border-kavach-teal/40 dark:hover:border-kavach-blue/40")
          )}
        >
          {isSimulating && <span className="absolute inset-0 rounded-xl border border-amber-400/30 sonar-ring"/>}
          <Activity size={22} className={isSimulating ? "animate-pulse text-amber-600 dark:text-kavach-gold" : ""} />
          <span className="text-sm text-center leading-tight">{isSimulating ? "Simulating…" : "Simulate Scenario"}</span>
          {isSimulating && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
        </button>
      </div>

      {/* Stats strip */}
      {(isScanning || isSimulating || scanCount > 0) && (
        <div className="flex gap-2.5 animate-fade-in">
          <StatChip icon={Radio} value={scanCount}                        label="Packets" />
          <StatChip icon={Cpu}   value={devices.length}                    label="Devices" />
          <StatChip icon={Zap}   value={devices.filter(d=>d.isThreat).length} label="Threats" />
        </div>
      )}

      {/* Error */}
      {bleError && (
        <div className="flex items-start gap-2 rounded-xl border border-kavach-danger/25 bg-kavach-danger/5 dark:bg-kavach-danger/10 px-3.5 py-3 animate-fade-in">
          <CircleSlash size={13} className="text-kavach-danger flex-shrink-0 mt-0.5" />
          <p className="text-xs text-kavach-danger leading-relaxed">{bleError}</p>
        </div>
      )}

      <AlertBanner result={alert} onDismiss={() => setAlert(null)} />

      {/* Device list */}
      {devices.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          <p className="section-label px-0.5">Detected Devices</p>
          {devices.map((d,i) => <DeviceRow key={`${d.name}-${i}`} device={d} index={i} />)}
        </div>
      )}

      {/* Idle */}
      {!isScanning && !isSimulating && devices.length === 0 && !bleError && (
        <div className="text-center py-10">
          <div className="w-12 h-12 rounded-xl bg-kavach-silver/10 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
            <Bluetooth size={22} className="text-kavach-silver dark:text-slate-600" />
          </div>
          <p className="text-sm text-kavach-silver dark:text-slate-500">
            {supported ? "Initiate a BLE scan or run the real-world simulation." : "Run the simulation to preview threat detection."}
          </p>
        </div>
      )}
    </div>
  );
}
