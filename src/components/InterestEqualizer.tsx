"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sliders, Zap } from "lucide-react";

interface TopicWeight {
  id: string;
  name: string;
  weight: number; // 0 to 100
}

interface Props {
  variant?: "full" | "compact";
  onExpand?: () => void;
}

export const InterestEqualizer: React.FC<Props> = ({ variant = "full", onExpand }) => {
  const [weights, setWeights] = useState<TopicWeight[]>([
    { id: "tech", name: "Technology", weight: 85 },
    { id: "philosophy", name: "Philosophy", weight: 40 },
    { id: "geopolitics", name: "Geopolitics", weight: 65 },
    { id: "science", name: "Science", weight: 30 },
  ]);

  const updateWeight = (id: string, value: number) => {
    setWeights(prev => prev.map(w => w.id === id ? { ...w, weight: value } : w));
  };

  if (variant === "compact") {
    return (
      <div 
        onClick={onExpand}
        className="p-8 border border-white/10 rounded-[3rem] bg-white/5 backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-colors group"
      >
        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 flex justify-between items-center">
          <span>Interests</span>
          <Sliders size={12} className="text-[var(--chrome-yellow)]" />
        </div>
        <div className="flex items-end gap-3 h-20">
          {weights.map((topic) => (
            <div key={topic.id} className="flex-grow flex flex-col items-center gap-3">
              <div className="w-1.5 h-full bg-white/5 rounded-full relative overflow-hidden">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${topic.weight}%` }}
                  className="absolute bottom-0 w-full bg-[var(--chrome-yellow)]"
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
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[var(--chrome-yellow)]">
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
          <Zap size={14} className="text-[var(--chrome-yellow)]" />
        </button>
      </div>

      <div className="flex justify-between items-end h-48 gap-4 px-2">
        {weights.map((topic) => (
          <div key={topic.id} className="flex-grow flex flex-col items-center gap-4 group">
            <div className="relative h-32 w-full flex justify-center">
              <div className="absolute inset-y-0 w-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${topic.weight}%` }}
                  className="absolute bottom-0 w-full bg-[var(--chrome-yellow)]"
                />
              </div>
              
              <input 
                type="range"
                min="0"
                max="100"
                value={topic.weight}
                onChange={(e) => updateWeight(topic.id, parseInt(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none -rotate-90 origin-center"
                style={{ width: '32px', height: '128px', transform: 'rotate(-90deg) translate(-48px, 0)' }}
              />
              
              <motion.div 
                animate={{ bottom: `${topic.weight}%` }}
                className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full border-2 border-[var(--chrome-yellow)] shadow-lg pointer-events-none group-hover:scale-125 transition-transform"
              />
            </div>
            
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-white/60 uppercase tracking-widest mb-1">{topic.name}</span>
              <span className="text-[10px] font-black text-[var(--chrome-yellow)]">{topic.weight}%</span>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={onExpand}
        className="w-full mt-6 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
      >
        Collapse Module
      </button>
    </div>
  );
};
