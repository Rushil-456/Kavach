import React, { useState, useEffect } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { Line } from "react-chartjs-2";
import { Activity, BarChart2, Crosshair, TrendingDown, Layers } from "lucide-react";
import { clsx } from "clsx";
import KavachMap from "../components/Map";
import Guide from "../components/Guide";
import Replay from "../components/Replay";
import Report from "../components/Report";
import { getAllSessions, getSessionLogs } from "../utils/storage";
import { calcVariance, totalPathDistance } from "../utils/detection";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const CHART_OPTIONS = {
  responsive: true, maintainAspectRatio: false, animation: { duration: 350 },
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: { display: true, position: "bottom", labels: { color:"#B5B5B7", font:{ family:"JetBrains Mono", size:10 }, padding:14, boxWidth:12, boxHeight:2 } },
    tooltip: { backgroundColor:"#ffffff", titleColor:"#0D3B66", bodyColor:"#235B7E", borderColor:"#B5B5B7", borderWidth:1, padding:10, cornerRadius:8, titleFont:{ family:"JetBrains Mono", size:10, weight:"600" }, bodyFont:{ family:"JetBrains Mono", size:11 }, callbacks:{ label: ctx => ` ${ctx.dataset.label}: ${ctx.raw} dBm` } },
  },
  scales: {
    x: { grid:{ color:"rgba(181,181,183,0.12)", drawBorder:false }, ticks:{ color:"#B5B5B7", font:{ family:"JetBrains Mono", size:9 }, maxTicksLimit:6 } },
    y: { grid:{ color:"rgba(181,181,183,0.12)", drawBorder:false }, ticks:{ color:"#B5B5B7", font:{ family:"JetBrains Mono", size:9 } }, title:{ display:true, text:"RSSI (dBm)", color:"#B5B5B7", font:{ family:"JetBrains Mono", size:9 } } },
  },
};

function buildChartData(labels, datasets) {
  const colors = [
    { border: "#C0392B", bg: "rgba(192,57,43,0.07)" },
    { border: "#6EB0DC", bg: "rgba(110,176,220,0.06)" },
    { border: "#27AE60", bg: "rgba(39,174,96,0.06)" }
  ];
  return {
    labels,
    datasets: datasets.map((d, i) => ({
      label: d.name, data: d.data,
      borderColor: colors[i%3].border, backgroundColor: colors[i%3].bg,
      pointBackgroundColor: colors[i%3].border, pointRadius:2, pointHoverRadius:4,
      tension:0.4, fill:true, borderWidth:2,
    }))
  };
}

const C = { card: "bg-white dark:bg-kavach-cdark border border-kavach-silver/20 dark:border-white/6 shadow-card" };

function MetricCard({ icon: Icon, label, value, sub, isWarning = false }) {
  return (
    <div className={clsx("flex-1 rounded-xl p-3", C.card)}>
      <Icon size={13} className={isWarning ? "text-kavach-danger" : "text-kavach-teal dark:text-kavach-blue"} />
      <p className={clsx("text-base font-bold font-mono mt-1", isWarning ? "text-amber-600 dark:text-kavach-gold" : "text-kavach-teal dark:text-kavach-blue")}>{value}</p>
      <p className="text-[9px] uppercase tracking-wide text-kavach-silver dark:text-slate-500 mt-0.5 font-semibold">{label}</p>
      <p className="text-[9px] text-kavach-silver/60 dark:text-slate-600">{sub}</p>
    </div>
  );
}

export default function Analyze() {
  const [logs, setLogs] = useState([]);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let interval;
    const fetchLatest = async () => {
      const all = await getAllSessions();
      if (all.length > 0) {
        setSession(all[0]);
        const sLogs = await getSessionLogs(all[0].sessionId);
        setLogs(sLogs);
      }
    };
    fetchLatest();
    interval = setInterval(fetchLatest, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!session) return <div className="p-4 text-center mt-10">No live sessions recorded.</div>;

  const labels = logs.map(l => new Date(l.timestamp).toLocaleTimeString());
  
  const deviceMap = {};
  logs.forEach(l => {
    if (l.devices) l.devices.forEach(d => { if(!deviceMap[d.name]) deviceMap[d.name] = []; });
  });
  
  logs.forEach(l => {
    Object.keys(deviceMap).forEach(key => {
       const fd = l.devices ? l.devices.find(d => d.name === key) : null;
       deviceMap[key].push(fd ? fd.rssi : null);
    });
  });

  const datasets = Object.keys(deviceMap).map(name => ({ name, data: deviceMap[name] })).slice(0, 3); 

  let variance = 0, distance = 0;
  if (datasets.length > 0) {
    const validRssi = datasets[0].data.filter(d => d !== null);
    variance = calcVariance(validRssi);
    const validLocs = logs.map(l => l.location).filter(Boolean);
    distance = totalPathDistance(validLocs);
  }

  const isHigh = Boolean(session.isThreat);

  return (
    <div className="px-4 pt-5 space-y-5 pb-10">
      <div className="animate-slide-up">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-kavach-silver dark:text-slate-500">Forensics Mode</p>
        <h1 className="text-2xl font-bold text-kavach-navy dark:text-white mt-1">
          Signal <span className={isHigh ? "text-kavach-danger" : "text-kavach-teal"}>Analysis</span>
        </h1>
      </div>

      <Guide isThreat={isHigh} />

      <Report session={session} logs={logs} variance={variance} distance={distance} />

      <div className={clsx("animate-slide-up rounded-xl overflow-hidden", C.card)} style={{ animationDelay:"60ms" }}>
        <div className="flex items-center justify-between px-4 py-2.5 bg-kavach-surface/60">
          <div className="flex items-center gap-2">
            <BarChart2 size={13} className="text-kavach-danger" />
            <span className="section-label">Realtime DB Chart</span>
          </div>
        </div>
        <div id="kavach-chart-export" className="p-4 bg-white dark:bg-slate-900 rounded-lg" style={{ height: "210px" }}>
          <Line data={buildChartData(labels, datasets)} options={CHART_OPTIONS} />
        </div>
      </div>

      <div className="animate-slide-up flex gap-2.5" style={{ animationDelay:"100ms" }}>
        <MetricCard icon={TrendingDown} label="Tracker Variance" value={`${variance.toFixed(1)} dB²`} sub="Low = tracking" isWarning={isHigh} />
        <MetricCard icon={Crosshair}    label="User Distance"    value={`${distance.toFixed(0)}m`}     sub="Path length"  />
      </div>

      <div className="animate-slide-up space-y-2">
        <div className="flex items-center gap-2 px-0.5">
          <Crosshair size={13} className="text-kavach-danger" />
          <span className="section-label">Threat Map Extraction</span>
        </div>
        <KavachMap sessionId={session.sessionId} compact={false} />
      </div>

      <div className="animate-slide-up space-y-2 mt-4">
        <Replay sessionId={session.sessionId} />
      </div>
    </div>
  );
}
