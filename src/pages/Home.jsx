import React, { useState, useEffect } from "react";
import {
  ShieldAlert, ShieldCheck, MapPin, Clock,
  AlertTriangle, ChevronRight, Eye, Radio,
} from "lucide-react";
import { clsx } from "clsx";
import KavachMap from "../components/Map";
import { getAllSessions } from "../utils/storage";

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

export default function Home() {
  const [expanded, setExpanded] = useState(false);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    let interval;
    const fetchSess = async () => {
      const all = await getAllSessions();
      setSessions(all);
    };
    fetchSess();
    interval = setInterval(fetchSess, 2000);
    return () => clearInterval(interval);
  }, []);

  const latestSession = sessions.length > 0 ? sessions[0] : null;
  const threatCount = sessions.filter(s => s.isThreat).length;

  return (
    <div className="px-4 pt-5 space-y-5">
      <div className="animate-slide-up">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-kavach-silver dark:text-slate-500">
          Threat Intelligence Feed
        </p>
        <h1 className="text-2xl font-bold text-kavach-navy dark:text-white mt-1">
          Shield <span className="text-kavach-teal dark:text-kavach-blue">Active</span>.
        </h1>
        <p className="text-sm text-kavach-silver dark:text-slate-400 mt-1">
          Kavach relies purely on LIVE sensor data. No dummy logic.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <StatCard label="Sessions"  value={sessions.length}   accent="teal"   delay={40}  />
        <StatCard label="Threats"   value={threatCount}    accent={threatCount > 0 ? "danger" : "teal"} delay={80}  />
        <StatCard label="Metres"    value="Live" accent="navy"   delay={120} />
        <StatCard label="Safe Days" value={sessions.length - threatCount}    accent="teal"   delay={160} />
      </div>

      {latestSession && latestSession.isThreat && (
        <div className={clsx("animate-slide-up rounded-xl overflow-hidden border-l-4 border-l-kavach-danger", C.card)} style={{ animationDelay: "180ms" }}>
          <div className="flex items-center justify-between px-4 py-2.5 bg-kavach-danger/6 dark:bg-kavach-danger/12 border-b border-white/5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={13} className="text-kavach-danger" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-kavach-danger">
                Security Alert — Tracker Detected
              </span>
            </div>
            <span className={clsx(C.badge, "text-kavach-danger border-kavach-danger/30 bg-kavach-danger/8")}>
              {latestSession.threatLevel}
            </span>
          </div>
          <div className="px-4 py-3">
             <p className="text-sm font-semibold text-kavach-navy dark:text-slate-100">Possible following hardware verified.</p>
             <p className="text-xs text-slate-500">Session ID: {latestSession.sessionId}</p>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="animate-slide-up space-y-2" style={{ animationDelay:"200ms" }}>
        <SectionHeading icon={MapPin} label={latestSession ? "Current Journey Trace" : "Waiting for Scan..."} />
        {latestSession && <KavachMap sessionId={latestSession.sessionId} compact />}
      </div>

      {/* Activity */}
      <div className="animate-slide-up space-y-2" style={{ animationDelay:"240ms" }}>
        <SectionHeading
          icon={Clock} label="Recent History"
          action={expanded ? "Collapse" : "View All"}
          onAction={() => setExpanded(e => !e)}
        />
        <div className="space-y-1.5">
          {(expanded ? sessions : sessions.slice(0,2)).map((s, i) => (
            <div
              key={s.sessionId}
              className={clsx("flex items-center gap-3 rounded-xl px-3 py-2.5 animate-fade-in", C.card)}
              style={{ animationDelay:`${i*50}ms` }}
            >
              <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", s.isThreat ? "bg-kavach-danger/10" : "bg-kavach-teal/10 dark:bg-kavach-blue/10")}>
                {s.isThreat ? <ShieldAlert size={14} className="text-kavach-danger" /> : <ShieldCheck size={14} className="text-kavach-teal dark:text-kavach-blue" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-kavach-navy dark:text-slate-100 truncate">Session {s.sessionId.substring(6)}</p>
                <p className="text-xs text-kavach-silver dark:text-slate-500">{new Date(s.startTime).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-2" />
    </div>
  );
}
