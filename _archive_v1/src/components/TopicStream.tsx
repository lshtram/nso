"use client";

import React, { useState } from "react";
import { StoryCluster } from "@/types";
import { StoryCard } from "./StoryCard";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  title: string;
  clusters: StoryCluster[];
  onCardClick: (cluster: StoryCluster) => void;
}

export const TopicStream: React.FC<Props> = ({ title, clusters, onCardClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Show only 3 items (one row) if not expanded
  const visibleClusters = isExpanded ? clusters : clusters.slice(0, 3);

  return (
    <div className="flex gap-8 mb-12">
      {/* Sidebar Title Component */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer group flex flex-col items-center py-4 border-r border-gray-100 pr-6 select-none"
      >
        <div className="flex flex-col items-center gap-4 sticky top-12">
          <span className="[writing-mode:vertical-rl] rotate-180 text-4xl font-black text-gray-200 tracking-tighter uppercase group-hover:text-indigo-600 transition-colors">
            {title}
          </span>
          <div className="text-gray-300 group-hover:text-indigo-600 transition-all">
            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </div>
        </div>
      </div>
      
      {/* Grid of Cards */}
      <div className="flex-grow">
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {visibleClusters.map((cluster) => (
              <motion.div
                key={cluster.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                onClick={() => onCardClick(cluster)}
              >
                <StoryCard cluster={cluster} onCardClick={onCardClick} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {clusters.length > 3 && !isExpanded && (
          <button 
            onClick={() => setIsExpanded(true)}
            className="mt-6 text-[10px] font-bold text-gray-400 hover:text-indigo-600 uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            Show {clusters.length - 3} more {title} items <ChevronDown size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
