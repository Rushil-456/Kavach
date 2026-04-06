import React from "react";
import { Info, Map, ShieldAlert } from "lucide-react";

export default function Guide({ isThreat }) {
  if (!isThreat) return null;

  return (
    <div className="bg-kavach-danger/5 border border-kavach-danger/20 rounded-2xl p-4 animate-fade-in shadow-sm">
      <h3 className="text-kavach-danger font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
         <ShieldAlert size={16}/> Anti-Stalking Action Guide
      </h3>
      <ul className="space-y-3">
        <li className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
           <Map className="flex-shrink-0 text-kavach-danger/70 mt-0.5" size={16}/>
           <span><strong>Move horizontally into crowds:</strong> Proceed immediately to a mall, metro, or cafe. Do not go to your home or isolated areas.</span>
        </li>
        <li className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
           <ShieldAlert className="flex-shrink-0 text-kavach-danger/70 mt-0.5" size={16}/>
           <span><strong>Avoid confrontation:</strong> DO NOT search your bag or car right now. Collect evidence via the Report tab and contact authorities when safe.</span>
        </li>
      </ul>
      <div className="mt-5 border-t border-kavach-danger/20 pt-4">
        <h4 className="text-xs font-semibold text-kavach-danger mb-2 uppercase tracking-wide">Emergency SOS</h4>
        <button
          type="button"
          onClick={() => {
            const openWa = (body) => {
              window.open(`https://wa.me/?text=${encodeURIComponent(body)}`, "_blank");
            };
            if (!("geolocation" in navigator)) {
              openWa(
                "URGENT: I may be followed — Kavach flagged persistent BLE proximity. Please call me; I could not attach GPS."
              );
              return;
            }
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                const maps = `https://maps.google.com/?q=${lat},${lng}`;
                openWa(
                  `URGENT: I may be followed — Kavach flagged persistent BLE proximity while I moved. Please check in. Location: ${maps}`
                );
              },
              () =>
                openWa(
                  "URGENT: I may be followed — Kavach flagged a risk. GPS unavailable; please call me."
                ),
              { enableHighAccuracy: true, maximumAge: 5000 }
            );
          }}
          className="w-full bg-kavach-danger text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition"
        >
           <ShieldAlert size={16}/> Send Silent WhatsApp SOS
        </button>
      </div>
    </div>
  );
}
