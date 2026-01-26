"use client";

import React, { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { InterestEqualizer } from "./InterestEqualizer";

interface Props {
  summary: {
    headline: string;
    content: string;
    detailedNarrative?: string;
  };
  weights: Record<string, number>;
  onWeightChange: (id: string, value: number) => void;
}

export const DailySummaryHero: React.FC<Props> = ({ summary, weights, onWeightChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEqExpanded, setIsEqExpanded] = useState(false);

  return (
    <section className="section-dark min-h-[50vh] py-8 px-6 md:px-12 lg:px-24 relative overflow-hidden flex flex-col justify-center border-b border-white/5">
      {/* Side Meta - Rotated */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-24 items-center">
         <div className="rotate-90 origin-center whitespace-nowrap text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 flex items-center gap-4">
           <Sparkles size={12} className="text-[var(--chrome-yellow)] -rotate-90" /> The Narrative
         </div>
         <div className="rotate-90 origin-center whitespace-nowrap text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 italic">
           Jan 24, 2026
         </div>
      </div>

      <div className="max-w-6xl mx-auto w-full relative z-10 transition-all duration-700 pl-0 lg:pl-12">
        <div className="grid md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-8 flex flex-col justify-center">
            <h1 className="text-2xl md:text-4xl font-black mb-4 leading-tight tracking-tighter text-white">
              {summary.headline}
            </h1>
            
            <div className="relative">
              <p className="text-base md:text-lg leading-relaxed font-medium text-gray-100 max-w-2xl border-l-[3px] border-[var(--chrome-yellow)] pl-6 py-1">
                {summary.content}
                {!isExpanded && (
                  <button 
                    onClick={() => setIsExpanded(true)}
                    className="ml-4 text-[var(--chrome-yellow)] font-black text-[9px] uppercase tracking-widest inline-flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
                  >
                    Expand <ChevronDown size={12} />
                  </button>
                )}
              </p>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-6 space-y-4 text-white/90 text-base leading-relaxed font-serif italic border-t border-white/5 mt-6 relative">
                    {summary.detailedNarrative || "The global response has been surprisingly unified, with digital sovereignty emerging as the primary point of contention."}
                    <div className="flex justify-end mt-4">
                      <button 
                        onClick={() => setIsExpanded(false)}
                        className="text-[var(--chrome-yellow)] font-black text-[9px] uppercase tracking-widest flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
                      >
                        Collapse <ChevronUp size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="hidden md:flex md:col-span-4 flex-col gap-4">
            {/* Integrity Widget */}
            <div className="p-6 border border-white/10 rounded-[2.5rem] bg-white/5 backdrop-blur-sm">
               <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Integrity Score</div>
               <div className="flex items-end gap-2">
                 <div className="text-4xl font-black text-[var(--chrome-yellow)] leading-none">94</div>
                 <div className="text-[8px] font-bold text-gray-500 mb-1 uppercase tracking-tighter">SIG LEVEL</div>
               </div>
               <div className="mt-4 flex gap-1">
                  {[1,2,3,4,5,6,7].map(i => (
                    <div key={i} className={`h-1 w-full rounded-full ${i < 6 ? 'bg-[var(--chrome-yellow)]' : 'bg-white/10'}`}></div>
                  ))}
               </div>
            </div>

            {/* Interest EQ Widget */}
            <InterestEqualizer 
              variant={isEqExpanded ? "full" : "compact"} 
              onExpand={() => setIsEqExpanded(!isEqExpanded)}
              weights={weights}
              onWeightChange={onWeightChange}
            />
          </div>
        </div>
      </div>
      
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--background)]/10 to-transparent pointer-events-none"></div>
    </section>
  );
};
