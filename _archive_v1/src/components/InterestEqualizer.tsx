"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sliders, Zap } from "lucide-react";

interface Props {
  variant?: "full" | "compact";
  onExpand?: () => void;
  weights: Record<string, number>;
  onWeightChange: (id: string, value: number) => void;
}

export const InterestEqualizer: React.FC<Props> = ({ 
  variant = "full", 
  onExpand, 
  weights, 
  onWeightChange 
}) => {
  const topics = [
    { id: "TECH", name: "Technology" },
    { id: "PHILOSOPHY", name: "Philosophy" },
    { id: "GEOPOLITICS", name: "Geopolitics" },
    { id: "SCIENCE", name: "Science" },
  ];

  if (variant === "compact") {
    return (
      <div 
        onClick={onExpand}
        className="p-8 border border-white/10 rounded-[3rem] bg-white/5 backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-colors group"
      >
        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 flex justify-between items-center">
          <span>Interests</span>
          <Sliders size={12} className="text-chrome-yellow" />
        </div>
        <div className="flex items-end gap-3 h-20">
          {topics.map((topic) => (
            <div key={topic.id} className="flex-grow flex flex-col items-center gap-3">
              <div className="w-1.5 h-full bg-white/5 rounded-full relative overflow-hidden">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${weights[topic.id] || 0}%` }}
                  className="absolute bottom-0 w-full bg-chrome-yellow"
                />
              </div>
              <span className="text-[7px] font-black text-gray-500 uppercase rotate-45 origin-left whitespace-nowrap">{topic.name.slice(0, 4)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111] rounded-[3rem] p-8 border border-white/10 shadow-2xl relative z-[100]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-chrome-yellow">
            <Sliders size={14} />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90">Equalizer</h3>
          </div>
        </div>
        <button 
          onClick={onExpand}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors"
        >
          <Zap size={14} className="text-chrome-yellow" />
        </button>
      </div>

      <div className="flex justify-between items-end h-48 gap-4 px-2">
        {topics.map((topic) => (
          <div key={topic.id} className="flex-grow flex flex-col items-center gap-4 group">
            <div className="relative h-32 w-full flex justify-center items-center">
              {/* Vertical Track Visual */}
              <div className="absolute inset-y-0 w-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${weights[topic.id] || 0}%` }}
                  className="absolute bottom-0 w-full bg-chrome-yellow"
                />
              </div>
              
              {/* SLIDER FIX: Vertical orientation handled via native style where supported, fallback to rotation */}
              <input 
                type="range"
                min="0"
                max="100"
                value={weights[topic.id] || 0}
                onChange={(e) => onWeightChange(topic.id, parseInt(e.target.value))}
                className="absolute w-32 h-32 opacity-0 cursor-pointer z-50 -rotate-90 appearance-none m-0"
                style={{ 
                   WebkitAppearance: 'none',
                   outline: 'none',
                   background: 'transparent'
                }}
              />
              
              {/* Slider Handle Visual */}
              <motion.div 
                animate={{ bottom: `${weights[topic.id] || 0}%` }}
                className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full border-2 border-chrome-yellow shadow-lg pointer-events-none group-hover:scale-125 transition-transform z-10"
              />
            </div>
            
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-white/60 uppercase tracking-widest mb-1">{topic.name}</span>
              <span className="text-[10px] font-black text-chrome-yellow">{weights[topic.id] || 0}%</span>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={onExpand}
        className="w-full mt-6 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all text-center"
      >
        Collapse Module
      </button>
    </div>
  );
};
