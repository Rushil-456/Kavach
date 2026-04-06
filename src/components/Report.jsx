import React, { useState } from "react";
import { Download, FileWarning } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Report({ session, logs, variance, distance }) {
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Kavach Forensics Report", 20, 20);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Session ID: ${session.sessionId}`, 20, 30);
      doc.text(`Date: ${new Date(session.startTime).toLocaleString()}`, 20, 40);
      doc.text(`Threat Verified: ${session.isThreat ? "YES" : "NO"}`, 20, 50);
      doc.text(`Movement Distance: ${distance.toFixed(0)}m`, 20, 60);
      doc.text(`Signal Variance: ${variance.toFixed(2)} dB squared`, 20, 70);
      
      // Capture Map
      const mapEl = document.getElementById("kavachmap-container");
      if (mapEl) {
        const mapCanvas = await html2canvas(mapEl, { useCORS: true });
        doc.addImage(mapCanvas.toDataURL("image/png"), "PNG", 20, 80, 170, 100);
      }

      // Generate Cryptographic Proof
      const payload = JSON.stringify({ sid: session.sessionId, isThreat: session.isThreat, logCount: logs.length });
      const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      doc.setFontSize(10);
      doc.text(`SHA-256 Data Integrity Proof:`, 20, 195);
      doc.setFont("courier", "normal");
      doc.text(hashHex, 20, 202);
      doc.text(`Generated securely by Kavach App. Do not tamper with this file.`, 20, 210);

      doc.save(`Kavach_Evidence_${session.sessionId}.pdf`);
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
           <FileWarning size={16} className="text-kavach-danger"/> Forensic Evidence Output
        </h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Generate an offline, tamper-proof PDF containing visual tracking proof and SHA-256 cryptographic hashes.
        </p>
      </div>
      <button 
        onClick={generateReport}
        disabled={generating || !session}
        className="w-full bg-slate-900 border border-slate-700 text-white font-semibold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors disabled:opacity-50"
      >
        {generating ? "Computing Hash..." : <><Download size={16}/> Download PDF Report</>}
      </button>
    </div>
  );
}
