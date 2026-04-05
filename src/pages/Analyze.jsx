import React, { useState, useCallback } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { Line } from "react-chartjs-2";
import { Activity, BarChart2, Crosshair, Info, TrendingDown } from "lucide-react";
import { clsx } from "clsx";
import Scanner from "../components/Scanner";
import KavachMap from "../components/Map";
import { CHART_LABELS, CHART_RSSI, CHART_NORMAL } from "../utils/mockData";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 350 },
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: {
      display: true, position: "bottom",
      labels: { color:"#B5B5B7", font:{ family:"JetBrains Mono", size:10 }, padding:14, boxWidth:12, boxHeight:2 },
    },
    tooltip: {
      backgroundColor:"#ffffff", titleColor:"#0D3B66", bodyColor:"#235B7E",
      borderColor:"#B5B5B7", borderWidth:1, padding:10, cornerRadius:8,
      titleFont:{ family:"JetBrains Mono", size:10, weight:"600" },
      bodyFont:{ family:"JetBrains Mono", size:11 },
      callbacks:{ label: ctx => ` ${ctx.dataset.label}: ${ctx.raw} dBm` },
    },
  },
  scales: {
    x: {
      grid:{ color:"rgba(181,181,183,0.12)", drawBorder:false },
      ticks:{ color:"#B5B5B7", font:{ family:"JetBrains Mono", size:9 }, maxTicksLimit:6 },
    },
    y: {
      grid:{ color:"rgba(181,181,183,0.12)", drawBorder:false },
      ticks:{ color:"#B5B5B7", font:{ family:"JetBrains Mono", size:9 } },
      title:{ display:true, text:"RSSI (dBm)", color:"#B5B5B7", font:{ family:"JetBrains Mono", size:9 } },
    },
  },
};

function buildChartData(labels, tracker, normal) {
  return {
    labels,
    datasets: [
      {
        label:"Tracker RSSI", data:tracker,
        borderColor:"#C0392B", backgroundColor:"rgba(192,57,43,0.07)",
        pointBackgroundColor:"#C0392B", pointRadius:3, pointHoverRadius:5,
        tension:0.4, fill:true, borderWidth:2,
      },
      {
        label:"Normal Device", data:normal,
        borderColor:"#6EB0DC", backgroundColor:"rgba(110,176,220,0.06)",
        pointBackgroundColor:"#6EB0DC", pointRadius:3, pointHoverRadius:5,
        tension:0.4, fill:true, borderWidth:2,
      },
    ],
  };
}

const C = { card: "bg-white dark:bg-kavach-cdark border border-kavach-silver/20 dark:border-white/6 shadow-card" };

function MetricCard({ icon: Icon, label, value, sub, isWarning = false }) {
  return (
    <div className={clsx("flex-1 rounded-xl p-3", C.card)}>
      <Icon size={13} className={isWarning ? "text-kavach-danger" : "text-kavach-teal dark:text-kavach-blue"} />
      <p className={clsx("text-base font-bold font-mono mt-1", isWarning ? "text-amber-600 dark:text-kavach-gold" : "text-kavach-teal dark:text-kavach-blue")}>
        {value}
      </p>
      <p className="text-[9px] uppercase tracking-wide text-kavach-silver dark:text-slate-500 mt-0.5 font-semibold">{label}</p>
      <p className="text-[9px] text-kavach-silver/60 dark:text-slate-600">{sub}</p>
    </div>
  );
}

export default function Analyze() {
  const [chartLabels, setChartLabels] = useState([...CHART_LABELS]);
  const [trackerRssi, setTrackerRssi] = useState([...CHART_RSSI]);
  const [normalRssi,  setNormalRssi ] = useState([...CHART_NORMAL]);
  const [showMap,     setShowMap    ] = useState(false);
  const [simResult,   setSimResult  ] = useState(null);

  const handleSimulationData = useCallback((dataPoints, result) => {
    if (result) { setSimResult(result); setShowMap(true); }
    else {
      dataPoints.forEach(d => {
        const trim = arr => { const n=[...arr]; if(n.length>30) n.shift(); return n; };
        setChartLabels(p => trim([...p, d.timeLabel]));
        setTrackerRssi(p => trim([...p, d.rssi]));
        setNormalRssi (p => trim([...p, d.normalRssi]));
      });
    }
  }, []);

  const variance   = simResult ? simResult.variance?.toFixed(2) : "1.80";
  const distance   = simResult ? simResult.distance?.toFixed(0)  : "625";
  const confidence = simResult ? `${simResult.confidence}%`      : "91%";
  const isHigh     = parseFloat(variance) < 5;

  return (
    <div className="px-4 pt-5 space-y-5">

      <div className="animate-slide-up">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-kavach-silver dark:text-slate-500">Forensics Mode</p>
        <h1 className="text-2xl font-bold text-kavach-navy dark:text-white mt-1">
          Signal <span className="text-kavach-danger">Analysis</span>
        </h1>
        <p className="text-sm text-kavach-silver dark:text-slate-400 mt-1">Real-time BLE RSSI forensics and tracker correlation.</p>
      </div>

      {/* Chart card */}
      <div className={clsx("animate-slide-up rounded-xl overflow-hidden", C.card)} style={{ animationDelay:"60ms" }}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-kavach-silver/10 dark:border-white/5 bg-kavach-surface/60 dark:bg-white/2">
          <div className="flex items-center gap-2">
            <BarChart2 size={13} className="text-kavach-danger" />
            <span className="section-label">RSSI vs Time</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-kavach-silver dark:text-slate-500">variance:</span>
            <span className={clsx("text-[10px] font-mono font-bold", isHigh ? "text-amber-600 dark:text-kavach-gold" : "text-kavach-teal dark:text-kavach-blue")}>
              {variance} dB²
            </span>
          </div>
        </div>
        <div className="p-4" style={{ height:"210px" }}>
          <Line data={buildChartData(chartLabels, trackerRssi, normalRssi)} options={CHART_OPTIONS} />
        </div>
        <div className="flex items-start gap-2 px-4 py-2.5 border-t border-kavach-silver/10 dark:border-white/5 bg-kavach-surface/60 dark:bg-white/2">
          <Info size={11} className="text-kavach-silver flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-kavach-silver dark:text-slate-500 leading-relaxed">
            Red line (tracker) stays flat → low variance (&lt;5 dB²) while user moves →{" "}
            <span className="text-kavach-danger font-semibold">stalking detected</span>.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="animate-slide-up flex gap-2.5" style={{ animationDelay:"100ms" }}>
        <MetricCard icon={TrendingDown} label="Tracker Variance" value={`${variance} dB²`} sub="Low = danger"  isWarning={isHigh} />
        <MetricCard icon={Crosshair}    label="User Distance"    value={`${distance}m`}     sub="Path length"  />
        <MetricCard icon={Activity}     label="Confidence"       value={confidence}          sub="Threat score" />
      </div>

      {/* Scanner */}
      <div className="animate-slide-up space-y-2" style={{ animationDelay:"140ms" }}>
        <div className="flex items-center gap-2 px-0.5">
          <Activity size={13} className="text-kavach-teal dark:text-kavach-blue" />
          <span className="section-label">Live Scanner</span>
        </div>
        <Scanner onSimulationData={handleSimulationData} />
      </div>

      {/* Threat map */}
      {showMap && (
        <div className="animate-slide-up space-y-2">
          <div className="flex items-center gap-2 px-0.5">
            <Crosshair size={13} className="text-kavach-danger" />
            <span className="section-label">Threat Map — Koramangala</span>
          </div>
          <KavachMap compact={false} />
        </div>
      )}
      <div className="h-2" />
    </div>
  );
}
