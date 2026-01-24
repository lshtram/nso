"use client";

import React, { useState, useRef } from "react";
import { StoryCluster } from "@/types";
import { TrendingUp, ThumbsUp, ThumbsDown, Bookmark, ArrowRight, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  cluster: StoryCluster;
  onCardClick: (cluster: StoryCluster) => void;
}

export const StoryCard: React.FC<Props> = ({ cluster, onCardClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  
  const mainImage = cluster.topItems[0]?.imageUrl || "https://images.unsplash.com/photo-1485083269755-a7b559a4fe5e?auto=format&fit=crop&q=80&w=800";

  // Trigger only on actual mouse movement to avoid scroll-auto-trigger
  const handleMouseMove = (e: React.MouseEvent) => {
    if (Math.abs(e.clientX - lastPos.current.x) > 1 || Math.abs(e.clientY - lastPos.current.y) > 1) {
      setIsHovered(true);
    }
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  return (
    <div 
      className="relative w-full h-[400px]" // Fixed layout slot
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div 
        animate={{ 
          height: isHovered ? "auto" : "400px",
          scale: isHovered ? 1.02 : 1,
          zIndex: isHovered ? 50 : 10
        }}
        transition={{ 
          height: { type: "spring", stiffness: 300, damping: 30 },
          scale: { type: "tween", duration: 0.2 },
          zIndex: { duration: 0 }
        }}
        className="absolute inset-x-0 top-0 flex flex-col bg-white rounded-[2.2rem] overflow-hidden shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] transition-shadow duration-500 border border-gray-100 cursor-pointer pointer-events-auto"
      >
        {/* Image Container */}
        <motion.div 
          animate={{ height: isHovered ? "120px" : "180px" }}
          className="relative w-full overflow-hidden"
        >
          <img 
            src={mainImage} 
            alt={cluster.title}
            className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent opacity-0 transition-opacity"></div>
          
          <div className="absolute top-4 left-4">
            <div className="px-3 py-1 bg-white/95 backdrop-blur shadow-sm rounded-lg text-[10px] font-black text-gray-900 border border-gray-100 flex items-center gap-2 uppercase tracking-tighter">
              <TrendingUp size={10} className="text-[var(--chrome-yellow)]" />
              {cluster.relevanceScore}%
            </div>
          </div>
        </motion.div>

        <div className="p-7 flex flex-col flex-grow bg-white">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Layers size={10} /> {cluster.items[0]?.sourceName || "Source"}
            </span>
          </div>

          <h3 className="font-black text-xl mb-4 text-gray-900 leading-[1.1] tracking-tighter">
            {cluster.title}
          </h3>
          
          <div className="flex-grow">
            <p className={`text-gray-500 text-sm leading-relaxed transition-all duration-500 ${isHovered ? 'line-clamp-none' : 'line-clamp-2'}`}>
              {cluster.narrative}
            </p>
            
            <AnimatePresence>
              {isHovered && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-6 space-y-6"
                >
                  <p className="text-[13px] font-medium text-gray-600 italic pt-4 border-t border-gray-50">
                    Why it matters: {cluster.whyItMatters}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4">
                    <div className="flex gap-2">
                       <button className="p-2 bg-gray-50 text-gray-400 hover:text-black rounded-xl transition-all"><ThumbsUp size={16} /></button>
                       <button className="p-2 bg-gray-50 text-gray-400 hover:text-black rounded-xl transition-all"><ThumbsDown size={16} /></button>
                       <button className="p-2 bg-gray-50 text-gray-400 hover:text-black rounded-xl transition-all"><Bookmark size={16} /></button>
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); onCardClick(cluster); }}
                      className="bg-black text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-gray-800 transition-all shadow-xl"
                    >
                      DEEP DIVE <ArrowRight size={14} className="text-[var(--chrome-yellow)]" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Hover Border Accent */}
        <div className={`absolute inset-0 border-2 transition-colors duration-500 rounded-[2.2rem] pointer-events-none ${isHovered ? 'border-[var(--chrome-yellow)]/30' : 'border-transparent'}`}></div>
      </motion.div>
    </div>
  );
};
