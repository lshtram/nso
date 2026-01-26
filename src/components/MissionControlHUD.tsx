"use client";

import React, { useEffect, useState, useRef } from "react";
import { Loader2, Terminal, Activity, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  statusMessage: string;
  timeElapsed: number;
  isLoading: boolean;
}

const STAGES = ['Discovery', 'Triage', 'Hydration', 'Embedding', 'Synthesis'];

export const MissionControlHUD: React.FC<Props> = ({ statusMessage, timeElapsed, isLoading }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (statusMessage) {
      setLogs(prev => {
        // Only add if it's a new unique message or if it's been a while (to avoid polling duplicates)
        if (prev[prev.length - 1] === statusMessage) return prev;
        return [...prev, statusMessage].slice(-50); // Keep last 50
      });
    }
  }, [statusMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isLoading) return null;

  const match = (statusMessage || "").match(/STAGE:(\d+):/);
  const currentStage = match ? parseInt(match[1]) : 0;
  
  return (
    <div className="min-h-screen bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 md:p-12 fixed inset-0 z-[1000] overflow-hidden">
      <div className="w-full max-w-4xl h-[80vh] flex flex-col gap-6">
        
        {/* Header Section */}
        <div className="flex justify-between items-end border-b border-white/10 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-[var(--chrome-yellow)]">
              <Zap size={16} className="animate-pulse" />
              <h1 className="text-sm font-black uppercase tracking-[0.4em]">Intelligence Ingestion Active</h1>
            </div>
            <p className="text-[10px] text-gray-500 font-mono">NODE_HASH: {Math.random().toString(16).substring(2, 10).toUpperCase()} // ELAPSED: {timeElapsed}s</p>
          </div>
          
          <div className="flex gap-2">
            {STAGES.map((s, i) => (
              <div 
                key={s} 
                className={`h-1 w-6 rounded-full transition-all duration-700 ${
                  currentStage > i ? 'bg-[var(--chrome-yellow)]' : 'bg-white/10'
                }`} 
              />
            ))}
          </div>
        </div>

        {/* Live Terminal Content */}
        <div className="flex-grow flex flex-col bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5 bg-white/[0.03]">
             <Terminal size={14} className="text-gray-500" />
             <span className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-widest">System Log // Real-time Feed</span>
             <div className="ml-auto flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500/20" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                <div className="w-2 h-2 rounded-full bg-green-500/20" />
             </div>
          </div>

          <div 
            ref={scrollRef}
            className="flex-grow overflow-y-auto p-8 font-mono text-[11px] space-y-3 no-scrollbar scroll-smooth"
          >
            <AnimatePresence mode="popLayout">
              {logs.map((log, i) => {
                const stageMatch = log.match(/STAGE:(\d+):/);
                const isStage = !!stageMatch;
                const stageNum = stageMatch ? stageMatch[1] : null;
                const content = isStage ? log.split(':')[2] : log;
                
                return (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex gap-4 group ${isStage ? 'text-[var(--chrome-yellow)] pt-4 first:pt-0' : 'text-gray-400'}`}
                  >
                    <span className="opacity-30 shrink-0">[{i.toString().padStart(3, '0')}]</span>
                    <span className={`leading-relaxed ${isStage ? 'font-black uppercase tracking-wider' : 'font-medium'}`}>
                      {isStage && <span className="mr-2 text-[var(--chrome-yellow)]/50">[STAGE {stageNum}] &gt;</span>}
                      {content}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div className="flex items-center gap-2 text-[var(--chrome-yellow)] animate-pulse pt-4">
              <span className="block w-2 h-4 bg-[var(--chrome-yellow)]" />
              <span className="text-[10px] font-bold">AWAITING SIGNAL...</span>
            </div>
          </div>

          {/* Visual Activity Overlay */}
          <div className="absolute right-8 bottom-8 pointer-events-none opacity-20">
             <Activity className="text-[var(--chrome-yellow)] animate-pulse" size={120} strokeWidth={1} />
          </div>
        </div>

        {/* Footer Meta */}
        <div className="flex justify-between items-center px-4">
           <div className="flex gap-8">
              <div className="flex flex-col gap-1">
                 <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Active Model</span>
                 <span className="text-[10px] text-white font-bold">GEMINI_FLASH_TIERED</span>
              </div>
              <div className="flex flex-col gap-1 border-l border-white/10 pl-8">
                 <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Throughput</span>
                 <span className="text-[10px] text-white font-bold">{(timeElapsed > 0 ? (logs.length / timeElapsed).toFixed(2) : 0)} OPS/S</span>
              </div>
           </div>
           
           <div className="flex items-center gap-3 bg-[var(--chrome-yellow)]/10 px-4 py-2 rounded-xl border border-[var(--chrome-yellow)]/20">
              <Loader2 className="animate-spin text-[var(--chrome-yellow)]" size={12} />
              <span className="text-[9px] font-black text-[var(--chrome-yellow)] uppercase tracking-widest">Syncing Global Intelligence Grid</span>
           </div>
        </div>

      </div>
    </div>
  );
};
