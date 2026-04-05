import React, { useState } from "react";
import {
  Shield, Bell, Vibrate, Map, Lock, ChevronRight,
  Info, Trash2, ExternalLink, Cpu, Bluetooth, ToggleLeft, ToggleRight,
} from "lucide-react";
import { clsx } from "clsx";

const C = { card: "bg-white dark:bg-kavach-cdark border border-kavach-silver/20 dark:border-white/6 shadow-card" };

function SettingToggle({ icon: Icon, label, description, value, onChange, accent = "teal" }) {
  const iconStyle = {
    teal:   "bg-kavach-teal/8 dark:bg-kavach-teal/12 text-kavach-teal dark:text-kavach-blue",
    amber:  "bg-amber-50 dark:bg-kavach-gold/10 text-amber-600 dark:text-kavach-gold",
    silver: "bg-kavach-silver/10 dark:bg-white/5 text-kavach-silver dark:text-slate-400",
  };
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-kavach-silver/10 dark:border-white/5 last:border-0">
      <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", iconStyle[accent])}>
        <Icon size={15} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-kavach-navy dark:text-slate-100">{label}</p>
        {description && <p className="text-xs text-kavach-silver dark:text-slate-500 mt-0.5 leading-snug">{description}</p>}
      </div>
      <button onClick={() => onChange(!value)} aria-label={`Toggle ${label}`} className="flex-shrink-0">
        {value
          ? <ToggleRight size={26} className="text-kavach-teal dark:text-kavach-blue" />
          : <ToggleLeft  size={26} className="text-kavach-silver/40 dark:text-slate-600" />}
      </button>
    </div>
  );
}

function SettingLink({ icon: Icon, label, sublabel, danger = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 py-3.5 w-full border-b border-kavach-silver/10 dark:border-white/5 last:border-0 -mx-4 px-4 hover:bg-kavach-silver/5 dark:hover:bg-white/3 transition-colors text-left"
    >
      <div className={clsx(
        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
        danger
          ? "bg-kavach-danger/8 dark:bg-kavach-danger/12 text-kavach-danger"
          : "bg-kavach-blue/10 dark:bg-kavach-blue/10 text-kavach-teal dark:text-kavach-blue"
      )}>
        <Icon size={15} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={clsx("text-sm font-semibold", danger ? "text-kavach-danger" : "text-kavach-navy dark:text-slate-100")}>{label}</p>
        {sublabel && <p className="text-xs text-kavach-silver dark:text-slate-500 mt-0.5">{sublabel}</p>}
      </div>
      <ChevronRight size={14} className="text-kavach-silver/40 dark:text-slate-600 flex-shrink-0" />
    </button>
  );
}

function Section({ title, children, delay = 0 }) {
  return (
    <div className={clsx("animate-slide-up rounded-xl overflow-hidden", C.card)} style={{ animationDelay:`${delay}ms` }}>
      <div className="px-4 py-2 border-b border-kavach-silver/10 dark:border-white/5 bg-kavach-surface/70 dark:bg-white/2">
        <p className="section-label">{title}</p>
      </div>
      <div className="px-4">{children}</div>
    </div>
  );
}

export default function Settings() {
  const [s, setS] = useState({
    vibrationAlert:true, pushNotifications:true, backgroundScan:false,
    stealthMode:true, saveJourneys:true, highAccuracy:false,
    macPrivacy:true, shareAnonymous:false,
  });
  const toggle = key => setS(p => ({ ...p, [key]:!p[key] }));
  const [cleared, setCleared] = useState(false);
  const handleClear = () => { setCleared(true); setTimeout(() => setCleared(false), 2200); };

  return (
    <div className="px-4 pt-5 space-y-5 pb-8">
      <div className="animate-slide-up">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-kavach-silver dark:text-slate-500">System Configuration</p>
        <h1 className="text-2xl font-bold text-kavach-navy dark:text-white mt-1">
          Shield <span className="text-kavach-teal dark:text-kavach-blue">Settings</span>
        </h1>
        <p className="text-sm text-kavach-silver dark:text-slate-400 mt-1">Configure how Kavach protects you.</p>
      </div>

      <Section title="Alerts & Feedback" delay={60}>
        <SettingToggle icon={Vibrate} label="Vibration Alert" description="Vibrate when a tracker is confirmed" value={s.vibrationAlert} onChange={()=>toggle("vibrationAlert")} accent="teal" />
        <SettingToggle icon={Bell}    label="Push Notifications" description="Background threat notifications" value={s.pushNotifications} onChange={()=>toggle("pushNotifications")} accent="teal" />
      </Section>

      <Section title="Scanning Behaviour" delay={100}>
        <SettingToggle icon={Bluetooth} label="Background Scan" description="Continue scanning when app is minimised (higher battery use)" value={s.backgroundScan} onChange={()=>toggle("backgroundScan")} accent="amber" />
        <SettingToggle icon={Cpu}       label="High-Accuracy Mode" description="Higher RSSI sample rate for sharper detection" value={s.highAccuracy} onChange={()=>toggle("highAccuracy")} accent="teal" />
        <SettingToggle icon={Shield}    label="Stealth Mode" description="Hide Kavach from recent apps while scanning" value={s.stealthMode} onChange={()=>toggle("stealthMode")} accent="teal" />
      </Section>

      <Section title="Privacy & Data" delay={140}>
        <SettingToggle icon={Lock}        label="MAC Address Privacy" description="Never store or log device MAC addresses — always recommended" value={s.macPrivacy} onChange={()=>toggle("macPrivacy")} accent="teal" />
        <SettingToggle icon={Map}         label="Save Journey History" description="Store journey logs locally on-device" value={s.saveJourneys} onChange={()=>toggle("saveJourneys")} accent="silver" />
        <SettingToggle icon={ExternalLink} label="Anonymous Analytics" description="Share anonymised threat patterns to improve detection (opt-in)" value={s.shareAnonymous} onChange={()=>toggle("shareAnonymous")} accent="silver" />
      </Section>

      <Section title="Data Management" delay={180}>
        <SettingLink icon={Trash2} label={cleared?"✓ History Cleared":"Clear Journey History"} sublabel="Permanently erase all on-device journey data" danger={!cleared} onClick={handleClear} />
        <SettingLink icon={ExternalLink} label="Export Forensic Report" sublabel="Download a signed JSON report for law enforcement" onClick={()=>alert("Export available in Kavach v2.")} />
      </Section>

      {/* About */}
      <div className={clsx("animate-slide-up rounded-xl overflow-hidden", C.card)} style={{ animationDelay:"220ms" }}>
        <div className="px-4 py-4 flex items-center gap-4">
          <img src="/kavach-logo.png" alt="Kavach" className="h-12 w-auto object-contain flex-shrink-0" />
          <div>
            <p className="text-sm font-bold tracking-wider text-kavach-navy dark:text-white">KAVACH</p>
            <p className="text-xs text-kavach-silver dark:text-slate-400">Privacy-first Anti-Stalking Shield</p>
            <p className="text-[10px] font-mono text-kavach-silver/60 dark:text-slate-500 mt-1">v1.0.0-MVP · MIT License</p>
          </div>
        </div>
        <div className="px-4 py-2.5 border-t border-kavach-silver/10 dark:border-white/5 bg-kavach-surface/60 dark:bg-white/2 flex items-start gap-2">
          <Info size={11} className="text-kavach-silver flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-kavach-silver dark:text-slate-500 leading-relaxed">
            Kavach uses RSSI variance analysis. No MAC fingerprinting is performed or stored.
          </p>
        </div>
      </div>
    </div>
  );
}
