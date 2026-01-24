"use client";

import React from "react";
import { SourceEntity } from "@/types";
import { motion } from "framer-motion";
import { Activity, Zap, ShieldCheck } from "lucide-react";

interface Props {
  source: SourceEntity;
  onClick: () => void;
}

export const SourceEntityCard: React.FC<Props> = ({ source, onClick }) => {
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      onClick={onClick}
      className={`bg-white border rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col items-center text-center gap-6 relative overflow-hidden group ${source.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60 grayscale'}`}
    >
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-[4rem] -z-10 group-hover:bg-[var(--chrome-yellow)]/5 transition-colors" />

      {/* Avatar/Icon */}
      <div className="w-24 h-24 rounded-[2.5rem] bg-gray-50 flex items-center justify-center text-4xl shadow-inner border-4 border-white mb-2">
        {source.type === 'youtube' && '📺'}
        {source.type === 'rss' && '📰'}
        {source.type === 'x' && '𝕏'}
        {source.type === 'arxiv' && '📄'}
        {source.type === 'github' && '🛠️'}
      </div>

      <div>
        <h3 className="text-lg font-black uppercase tracking-tighter text-gray-900 leading-none mb-2">{source.name}</h3>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{source.type} channel</p>
      </div>

      <div className="w-full flex justify-between gap-4 py-4 px-6 bg-gray-50/50 rounded-2xl">
         <div className="text-center">
            <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Signal</div>
            <div className="text-xs font-black text-black">{source.signalScore ?? 'N/A'}%</div>
         </div>
         <div className="w-[1px] h-full bg-gray-200" />
         <div className="text-center">
            <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</div>
            <div className="text-xs font-black text-[var(--chrome-yellow)] uppercase">{source.healthStatus}</div>
         </div>
      </div>

      <div className="w-full h-8 flex items-end gap-1 px-4">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="flex-grow bg-gray-100 rounded-t-sm" 
            style={{ height: `${20 + Math.random() * 80}%` }}
          />
        ))}
      </div>

      {source.signalScore && source.signalScore > 90 && (
        <div className="absolute top-4 left-4 p-2 bg-green-50 rounded-xl text-green-600">
           <ShieldCheck size={14} />
        </div>
      )}
    </motion.div>
  );
};
