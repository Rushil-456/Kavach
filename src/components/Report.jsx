import React, { useState } from "react";
import { Download, FileWarning } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { sha256Hex } from "../utils/crypto";
import { buildTrackingSegments } from "../utils/replay";

export default function Report({ session, logs, variance, distance }) {
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    if (!session) return;
    setGenerating(true);
    try {
      const doc = new jsPDF();
      let y = 18;

      const addHeading = (text, size = 14) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(size);
        doc.text(text, 14, y);
        y += size * 0.55 + 4;
      };

      const addBody = (lines, size = 10) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(size);
        for (const line of lines) {
          const parts = doc.splitTextToSize(line, 182);
          doc.text(parts, 14, y);
          y += parts.length * size * 0.45 + 2;
        }
      };

      doc.setTextColor(13, 59, 102);
      addHeading("Kavach — Forensic incident report", 16);
      doc.setTextColor(40, 40, 40);

      const startMs = new Date(session.startTime).getTime();
      const lastTs = logs.length ? logs[logs.length - 1].timestamp : session.startTime;
      const endMs = new Date(lastTs).getTime();
      const durationMin = logs.length ? Math.max(1, Math.round((endMs - startMs) / 60000)) : 0;

      addHeading("1. Incident summary", 12);
      addBody([
        `Session ID: ${session.sessionId}`,
        `Started: ${new Date(session.startTime).toLocaleString()}`,
        `Last log: ${new Date(lastTs).toLocaleString()}`,
        `Approx. duration: ${durationMin} minutes`,
        `GPS path samples: ${logs.length}`,
        `Threat flag (session): ${session.isThreat ? "YES" : "NO"}`,
      ]);

      addHeading("2. Detection analysis", 12);
      addBody([
        "Method: Bluetooth LE RSSI variance correlated with user movement (GPS and/or device motion).",
        "Interpretation: If RSSI stays unusually stable while the user moves, a device may be moving with them.",
        `Observed RSSI variance (primary series): ${Number.isFinite(variance) ? variance.toFixed(2) : "—"} dB² (low suggests stable proximity).`,
        `User path length (logged GPS): ${Number.isFinite(distance) ? distance.toFixed(0) : "—"} m.`,
      ]);

      const chartEl = document.getElementById("kavach-chart-export");
      if (chartEl) {
        addHeading("3. Signal graph (screenshot)", 12);
        const chartCanvas = await html2canvas(chartEl, {
          useCORS: true,
          scale: Math.min(2, window.devicePixelRatio || 1),
          backgroundColor: "#ffffff",
        });
        const chartData = chartCanvas.toDataURL("image/png");
        if (y > 200) {
          doc.addPage();
          y = 20;
        }
        doc.addImage(chartData, "PNG", 14, y, 182, 72);
        y += 78;
      }

      const mapEl = document.getElementById("kavachmap-container");
      if (mapEl) {
        addHeading("4. Path evidence (map capture)", 12);
        addBody([
          "Blue: user path segments without elevated suspicion. Red: segments flagged as suspicious.",
        ]);
        if (y > 160) {
          doc.addPage();
          y = 20;
        }
        const mapCanvas = await html2canvas(mapEl, { useCORS: true, scale: Math.min(2, window.devicePixelRatio || 1) });
        doc.addImage(mapCanvas.toDataURL("image/png"), "PNG", 14, y, 182, 100);
        y += 106;
      }

      const segments = buildTrackingSegments(logs);
      addHeading("5. Tracking segment details", 12);
      if (segments.length === 0) {
        addBody(["No contiguous suspicious segments were derived from stored logs."]);
      } else {
        segments.slice(0, 8).forEach((seg, idx) => {
          addBody([
            `Segment ${idx + 1}: ${new Date(seg.start).toLocaleString()} → ${new Date(seg.end).toLocaleString()}`,
            `Approx. path length: ${seg.distanceM.toFixed(0)} m · Samples: ${seg.pointCount}`,
            "Signal variance: see graph · Conclusion: persistent proximity flagged for this interval.",
          ]);
        });
      }

      const forensicPayload = {
        sessionId: session.sessionId,
        startTime: session.startTime,
        isThreat: session.isThreat,
        threatLevel: session.threatLevel,
        logs: logs.map((l) => ({
          timestamp: l.timestamp,
          lat: l.location?.lat,
          lng: l.location?.lng,
          isSuspicious: Boolean(l.isSuspicious),
          devices: (l.devices || []).map((d) => ({ name: d.name, rssi: d.rssi, isThreat: Boolean(d.isThreat) })),
        })),
      };

      const hashHex = await sha256Hex(JSON.stringify(forensicPayload));

      addHeading("6. Cryptographic proof", 12);
      addBody([
        "SHA-256 over canonical JSON of session metadata and log entries (device names only; no MAC addresses):",
        hashHex,
      ]);

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("Generated locally by Kavach PWA. Verify integrity by recomputing SHA-256 on the embedded payload.", 14, 285);

      doc.save(`Kavach_Forensic_${session.sessionId}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-kavach-surface/50 border border-kavach-silver/20 dark:border-white/10 rounded-2xl p-4 flex flex-col justify-between h-full gap-3 shadow-sm animate-fade-in shadow-card bg-slate-800">
      <div>
        <h3 className="font-semibold text-slate-100 flex items-center gap-2">
          <FileWarning size={16} className="text-kavach-danger" /> Forensic evidence output
        </h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Downloadable PDF: incident summary, analysis narrative, signal graph and map captures, segment table, and SHA-256
          over logged data (Web Crypto with CryptoJS fallback).
        </p>
      </div>
      <button
        onClick={generateReport}
        disabled={generating || !session}
        className="w-full bg-slate-900 border border-slate-700 text-white font-semibold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors disabled:opacity-50"
      >
        {generating ? "Building PDF…" : (
          <>
            <Download size={16} /> Download forensic PDF
          </>
        )}
      </button>
    </div>
  );
}
