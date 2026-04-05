import React, { useState } from "react";
import {
  ShieldAlert, ShieldCheck, MapPin, Clock,
  AlertTriangle, ChevronRight, Eye, Radio,
} from "lucide-react";
import { clsx } from "clsx";
import KavachMap from "../components/Map";
import { MOCK_TRACKING_DATA, SUSPICIOUS_DEVICE } from "../utils/mockData";

// Card token shortcuts
const C = {
  card:   "bg-white dark:bg-kavach-cdark border border-kavach-silver/20 dark:border-white/6 shadow-card",
  badge:  "px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest border",
};

function StatCard({ label, value, accent = "teal", delay = 0 }) {
  const num = {
    teal:   "text-kavach-teal dark:text-kavach-blue",
    danger: "text-kavach-danger",
    navy:   "text-kavach-navy dark:text-slate-200",
    gold:   "text-amber-600 dark:text-kavach-gold",
  };
  return (
    <div
      className={clsx("animate-slide-up rounded-xl p-3 text-center", C.card)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className={clsx("text-xl font-bold font-mono", num[accent])}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-kavach-silver dark:text-slate-500 mt-0.5">
        {label}
      </p>
    </div>
  );
}

function SectionHeading({ icon: Icon, label, action, onAction }) {
  return (
    <div className="flex items-center justify-between px-0.5">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-kavach-teal dark:text-kavach-blue" />
        <span className="section-label">{label}</span>
      </div>
      {action && (
        <button
          onClick={onAction}
          className="text-[10px] font-semibold text-kavach-teal dark:text-kavach-blue hover:underline flex items-center gap-0.5"
        >
          {action}<ChevronRight size={11} />
        </button>
      )}
    </div>
  );
}

const ACTIVITY_FEED = [
  { id:1, title:"Koramangala Walk",   subtitle:"Tracker confirmed · 10:22 AM", icon:AlertTriangle, threat:true,  ago:"Today"      },
  { id:2, title:"MG Road Commute",    subtitle:"All clear · 0 threats",         icon:ShieldCheck,  threat:false, ago:"Yesterday"  },
  { id:3, title:"HSR Layout",         subtitle:"All clear · 3 devices",         icon:ShieldCheck,  threat:false, ago:"2 days ago" },
];

export default function Home() {
  const [expanded, setExpanded] = useState(false);
  const lastAlert = MOCK_TRACKING_DATA.findLast(d => d.isSuspicious);

  return (
    <div className="px-4 pt-5 space-y-5">

      {/* Hero */}
      <div className="animate-slide-up">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-kavach-silver dark:text-slate-500">
          Threat Intelligence Feed
        </p>
        <h1 className="text-2xl font-bold text-kavach-navy dark:text-white mt-1">
          Shield <span className="text-kavach-teal dark:text-kavach-blue">Active</span>.
        </h1>
        <p className="text-sm text-kavach-silver dark:text-slate-400 mt-1">
          Kavach is scanning for proximity trackers.
        </p>
      </div>

      {/* Telemetry strip */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard label="Sessions"  value="12"   accent="teal"   delay={40}  />
        <StatCard label="Threats"   value="1"    accent="danger" delay={80}  />
        <StatCard label="Metres"    value="4.2k" accent="navy"   delay={120} />
        <StatCard label="Safe Days" value="6"    accent="teal"   delay={160} />
      </div>

      {/* Alert card */}
      {lastAlert && (
        <div
          className={clsx(
            "animate-slide-up rounded-xl overflow-hidden border-l-4 border-l-kavach-danger",
            "bg-white dark:bg-kavach-cdark border border-kavach-silver/20 dark:border-white/6 shadow-card"
          )}
          style={{ animationDelay: "180ms" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-kavach-danger/6 dark:bg-kavach-danger/12 border-b border-kavach-silver/10 dark:border-white/5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={13} className="text-kavach-danger" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-kavach-danger">
                Security Alert — Tracker Detected
              </span>
            </div>
            <span className={clsx(C.badge, "text-kavach-danger border-kavach-danger/30 bg-kavach-danger/8")}>
              HIGH
            </span>
          </div>

          {/* Body */}
          <div className="px-4 py-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-kavach-silver dark:text-slate-500 font-semibold">
                Device Signature
              </p>
              <p className="text-sm font-semibold text-kavach-navy dark:text-slate-100 mt-0.5">
                {SUSPICIOUS_DEVICE.name}
              </p>
              <p className="text-xs text-kavach-silver dark:text-slate-500 mt-0.5">
                {lastAlert.timeLabel} · Koramangala
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-kavach-silver dark:text-slate-500 font-semibold">
                RSSI Variance
              </p>
              <p className="text-sm font-bold font-mono text-amber-600 dark:text-kavach-gold mt-0.5">
                {SUSPICIOUS_DEVICE.variance} dB²
              </p>
              <p className="text-[10px] text-kavach-silver dark:text-slate-500 mt-0.5">
                Threshold: &lt; 5.0 dB²
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-kavach-silver/10 dark:border-white/5 bg-kavach-surface/60 dark:bg-white/2 flex items-center gap-1.5">
            <Radio size={10} className="text-kavach-danger animate-pulse" />
            <span className="text-[9px] font-mono text-kavach-silver dark:text-slate-500 tracking-wide">
              Distance: 625 m · Confidence: 91%
            </span>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="animate-slide-up space-y-2" style={{ animationDelay:"200ms" }}>
        <SectionHeading icon={MapPin} label="Last Journey Trace" />
        <div className="flex gap-4 px-0.5">
          {[["bg-kavach-blue","Safe path"],["bg-kavach-danger","Suspicious"]].map(([bg,lbl]) => (
            <span key={lbl} className="flex items-center gap-1.5 text-[10px] text-kavach-silver dark:text-slate-500">
              <span className={clsx("inline-block w-4 h-0.5 rounded", bg)} />{lbl}
            </span>
          ))}
        </div>
        <KavachMap compact />
      </div>

      {/* Activity */}
      <div className="animate-slide-up space-y-2" style={{ animationDelay:"240ms" }}>
        <SectionHeading
          icon={Clock} label="Recent Activity"
          action={expanded ? "Collapse" : "View All"}
          onAction={() => setExpanded(e => !e)}
        />
        <div className="space-y-1.5">
          {(expanded ? ACTIVITY_FEED : ACTIVITY_FEED.slice(0,2)).map((item, i) => (
            <div
              key={item.id}
              className={clsx("flex items-center gap-3 rounded-xl px-3 py-2.5 animate-fade-in", C.card)}
              style={{ animationDelay:`${i*50}ms` }}
            >
              <div className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                item.threat ? "bg-kavach-danger/10" : "bg-kavach-teal/10 dark:bg-kavach-blue/10"
              )}>
                <item.icon size={14} strokeWidth={2} className={item.threat ? "text-kavach-danger" : "text-kavach-teal dark:text-kavach-blue"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-kavach-navy dark:text-slate-100 truncate">{item.title}</p>
                <p className="text-xs text-kavach-silver dark:text-slate-500">{item.subtitle}</p>
              </div>
              <span className="text-[10px] text-kavach-silver/60 dark:text-slate-600 flex-shrink-0">{item.ago}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy notice */}
      <div
        className="animate-slide-up flex gap-3 rounded-xl border border-kavach-blue/25 dark:border-kavach-blue/15 bg-kavach-blue/5 dark:bg-kavach-blue/8 px-4 py-3"
        style={{ animationDelay:"280ms" }}
      >
        <Eye size={15} className="text-kavach-teal dark:text-kavach-blue flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-kavach-navy dark:text-slate-200">Privacy by Design</p>
          <p className="text-xs text-kavach-silver dark:text-slate-400 mt-0.5 leading-relaxed">
            Kavach never stores MAC addresses. Detection uses RSSI variance only.
          </p>
        </div>
      </div>

      <div className="h-2" />
    </div>
  );
}
