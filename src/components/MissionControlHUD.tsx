"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface Props {
  statusMessage: string;
  timeElapsed: number;
  isLoading: boolean;
}

const STAGES = ['Discovery', 'Triage', 'Hydration', 'Embedding', 'Synthesis'];

export const MissionControlHUD: React.FC<Props> = ({ statusMessage, timeElapsed, isLoading }) => {
  if (!isLoading) return null;

  const match = (statusMessage || "").match(/STAGE:(\d+):/);
  const currentStage = match ? parseInt(match[1]) : 0;
  const displayMessage = statusMessage?.includes('STAGE:') ? statusMessage.split(':')[2] : statusMessage;

  return (
    <div className="min-h-screen section-dark flex flex-col items-center justify-center gap-10 px-12 text-center bg-black fixed inset-0 z-[1000]">
      <div className="relative">
        <Loader2 className="animate-spin text-[var(--chrome-yellow)]" size={64} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-mono text-[var(--chrome-yellow)] font-bold">
            {timeElapsed}s
          </span>
        </div>
      </div>
      
      <div className="space-y-6 max-w-lg w-full">
        <div className="space-y-4">
          <div className="flex justify-center gap-3">
            {STAGES.map((stage, i) => {
              const stageIndex = i + 1; // 1-5
              const isActive = currentStage === stageIndex;
              const isPast = currentStage > stageIndex;
              
              return (
                <div key={stage} className="flex flex-col items-center gap-2">
                   <div 
                     className={`h-1 w-8 rounded-full transition-all duration-700 ${
                       isActive 
                        ? 'bg-[var(--chrome-yellow)] w-12 shadow-[0_0_15px_rgba(255,184,0,0.5)]' 
                        : isPast 
                          ? 'bg-white/40' 
                          : 'bg-white/10'
                     }`} 
                   />
                   <span className={`text-[7px] font-black uppercase tracking-widest transition-colors duration-500 ${
                     isActive 
                      ? 'text-[var(--chrome-yellow)]' 
                      : isPast 
                        ? 'text-white/60' 
                        : 'text-white/20'
                   }`}>
                     {stage}
                   </span>
                </div>
              );
            })}
          </div>
          
          <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-white drop-shadow-2xl h-8 overflow-hidden">
            {displayMessage}
          </h2>

          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--chrome-yellow)] transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, (timeElapsed / 120) * 100)}%` }}
            />
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-[0.3em] font-medium opacity-60">
            Synchronizing High-Signal Intelligence Nodes
          </p>
          <div className="flex gap-4 items-center pt-4 opacity-40 grayscale scale-75">
             <div className="text-white font-black text-xs tracking-tighter">OPENAI</div>
             <div className="text-white font-black text-xs tracking-tighter">DEEPMIND</div>
             <div className="text-white font-black text-xs tracking-tighter">ANTHROPIC</div>
          </div>
        </div>
      </div>
    </div>
  );
};
