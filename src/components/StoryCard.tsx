"use client";

import React, { useState, useRef } from "react";
import { StoryCluster } from "@/types";
import { TrendingUp, ThumbsUp, ThumbsDown, Bookmark, ArrowRight, Layers, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  cluster: StoryCluster;
  onCardClick: (cluster: StoryCluster) => void;
}

export const StoryCard: React.FC<Props> = ({ cluster, onCardClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const primaryItem = cluster.items[0];
  
  // Only use image if it is a REAL image from the feed
  const hasRealImage = !!primaryItem?.imageUrl;
  
  // Generate a consistent gradient based on the title hash if no image
  const getGradient = () => {
    const hash = cluster.title.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
    const hues = [210, 280, 45, 180, 15]; // Blue, Purple, Gold, Cyan, Red
    const hue = hues[Math.abs(hash) % hues.length];
    return `linear-gradient(135deg, hsl(${hue}, 20%, 95%) 0%, hsl(${hue}, 30%, 98%) 100%)`;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (Math.abs(e.clientX - lastPos.current.x) > 1 || Math.abs(e.clientY - lastPos.current.y) > 1) {
      setIsHovered(true);
    }
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  return (
    <div 
      className="relative w-full h-[450px]"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div 
        animate={{ 
          height: isHovered ? "auto" : "450px",
          scale: isHovered ? 1.02 : 1,
          zIndex: isHovered ? 50 : 10
        }}
        transition={{ 
          height: { type: "spring", stiffness: 300, damping: 30 },
          scale: { type: "tween", duration: 0.2 }
        }}
        className="absolute inset-x-0 top-0 flex flex-col bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] transition-shadow duration-500 border border-gray-200 cursor-pointer pointer-events-auto"
      >
        <motion.div 
          animate={{ height: isHovered && hasRealImage ? "160px" : "240px" }}
          className="relative w-full overflow-hidden shrink-0"
          style={{ background: hasRealImage ? 'black' : getGradient() }}
        >
          {hasRealImage ? (
            <img 
              src={primaryItem.imageUrl} 
              alt={cluster.title}
              className="w-full h-full object-cover transition-all duration-700"
            />
          ) : (
             <div className="w-full h-full p-8 flex flex-col justify-between relative">
                {/* Decorative Typography Background */}
                <div className="absolute -right-4 -bottom-8 text-[180px] font-black text-black/[0.03] leading-none select-none overflow-hidden" style={{ fontFamily: 'serif' }}>
                  Aa
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4 opacity-60">
                     <FileText size={14} className="text-gray-500" />
                     <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Intelligence Brief</span>
                  </div>
                  <h3 className="text-2xl font-serif font-medium text-gray-800 leading-tight line-clamp-4 tracking-tight">
                    {cluster.title}
                  </h3>
                </div>
             </div>
          )}

          <div className="absolute top-5 right-5 z-20">
            <div className="px-3 py-1.5 bg-white/95 backdrop-blur-md shadow-sm rounded-lg text-[10px] font-black text-gray-900 border border-black/5 flex items-center gap-2 uppercase tracking-widest">
              <TrendingUp size={10} className="text-[#FFB800]" />
              {Math.round(cluster.relevanceScore || 85)}% Signal
            </div>
          </div>
        </motion.div>

        <div className="p-8 flex flex-col flex-grow bg-white relative">
          <div className="flex justify-between items-center mb-4">
            <span className="px-3 py-1 bg-gray-100 rounded-md text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Layers size={10} className="text-gray-400" /> {primaryItem?.sourceName?.toUpperCase() || "SOURCE"}
            </span>
          </div>

          {/* Only show title in body if we have an image (otherwise it's in the header) */}
          {hasRealImage && (
            <h3 className="font-bold text-lg mb-4 text-gray-900 leading-[1.2] tracking-tight">
              {cluster.title}
            </h3>
          )}
          
          <div className="flex-grow">
            <p className={`text-gray-500 text-sm leading-relaxed transition-all duration-500 ${isHovered ? 'line-clamp-none' : 'line-clamp-3'}`}>
              {(() => {
                try {
                  if (cluster.narrative.startsWith('{')) {
                    const parsed = JSON.parse(cluster.narrative);
                    return parsed.brief || parsed.summary || cluster.narrative;
                  }
                } catch (e) {}
                return cluster.narrative.split('\n')[0].substring(0, 180) + '...';
              })()}
            </p>
            
            <AnimatePresence>
              {isHovered && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 space-y-6 overflow-hidden"
                >
                  <div className="p-4 bg-yellow-50/50 rounded-xl border border-yellow-100/50">
                    <p className="text-[12px] font-medium text-gray-800 italic flex gap-3">
                      <span className="text-[#FFB800] shrink-0 font-bold">Why it matters:</span>
                      {cluster.whyItMatters}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex gap-2">
                       <button className="p-2.5 hover:bg-gray-50 text-gray-400 hover:text-black rounded-lg transition-all"><ThumbsUp size={16} /></button>
                       <button className="p-2.5 hover:bg-gray-50 text-gray-400 hover:text-black rounded-lg transition-all"><ThumbsDown size={16} /></button>
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); onCardClick(cluster); }}
                      className="bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                    >
                      READ BRIEF <ArrowRight size={14} className="text-[#FFB800]" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
