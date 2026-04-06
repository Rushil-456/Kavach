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
    </div>
  );
}
