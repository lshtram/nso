"use client";

import React, { useState } from "react";
import { MissionControlHUD } from "@/components/MissionControlHUD";

export default function HUDDebugPage() {
  const [stage, setStage] = useState(1);
  const [elapsed, setElapsed] = useState(5);
  const [customMsg, setCustomMsg] = useState("");

  const stages = [
    "Discovery from nodes...",
    "Neural Scoring Triage...",
    "Hydration Deep Dive...",
    "Embedding Vectors...",
    "Synthesis Final Narrative..."
  ];

  const currentMsg = customMsg || `STAGE:${stage}:${stages[stage-1] || 'Unknown'}`;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-10 font-mono">
      <div className="fixed top-10 left-10 z-[2000] bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/10 space-y-6 w-96 shadow-2xl">
        <h1 className="text-xl font-black uppercase tracking-widest text-[var(--chrome-yellow)] mb-4">HUD Lab</h1>
        
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-black text-gray-400">Pipeline Stage ({stage})</label>
          <input 
            type="range" min="0" max="6" step="1" 
            value={stage} 
            onChange={(e) => setStage(parseInt(e.target.value))}
            className="w-full accent-[var(--chrome-yellow)]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-black text-gray-400">Time Elapsed ({elapsed}s)</label>
          <input 
            type="range" min="0" max="120" step="1" 
            value={elapsed} 
            onChange={(e) => setElapsed(parseInt(e.target.value))}
            className="w-full accent-[var(--chrome-yellow)]"
          />
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
          <button 
            onClick={() => setStage(prev => Math.min(6, prev + 1))}
            className="w-full py-3 bg-[var(--chrome-yellow)] text-black font-black uppercase text-[10px] tracking-widest rounded-lg hover:brightness-110 transition-all"
          >
            Advance Pipeline
          </button>
          <button 
            onClick={() => { setStage(0); setElapsed(0); }}
            className="w-full py-3 bg-white/5 text-white font-black uppercase text-[10px] tracking-widest rounded-lg hover:bg-white/10 transition-all"
          >
            Reset
          </button>
        </div>

        <div className="pt-4 text-[9px] text-gray-500 leading-relaxed">
          The Mission Control HUD uses the <strong>STAGE:N:Message</strong> protocol to sync UI state with the neural pipeline.
        </div>
      </div>

      <MissionControlHUD 
        statusMessage={currentMsg}
        timeElapsed={elapsed}
        isLoading={true}
      />
    </div>
  );
}
