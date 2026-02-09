'use client';

import React from 'react';
import { StoryCluster } from '@/types';
import { motion } from 'framer-motion';
import { MessageSquare, Zap, ExternalLink, Bookmark } from 'lucide-react';

interface StoryCardProps {
  cluster: StoryCluster;
  onClick: (cluster: StoryCluster) => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({ cluster, onClick }) => {
  const primaryItem = cluster.items[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="glass-card group relative p-6 rounded-2xl cursor-pointer flex flex-col gap-4"
      onClick={() => onClick(cluster)}
    >
      {/* Category & Stats */}
      <div className="flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-widest font-bold text-accent-primary bg-accent-primary/10 px-2 py-1 rounded">
          {cluster.category}
        </span>
        <div className="flex gap-3 text-text-muted">
          <div className="flex items-center gap-1">
            <MessageSquare size={14} />
            <span className="text-xs">{cluster.items.length}</span>
          </div>
          <div className="flex items-center gap-1 text-accent-gold">
            <Zap size={14} fill="currentColor" />
            <span className="text-xs font-medium">{Math.round(cluster.momentumScore)}</span>
          </div>
        </div>
      </div>

      {/* Featured Image placeholder if Stage 3 extracted it */}
      {primaryItem.imageUrl && (
        <div className="relative h-40 w-full overflow-hidden rounded-xl">
          <img 
            src={primaryItem.imageUrl} 
            alt={cluster.title}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-surface/80 to-transparent" />
        </div>
      )}

      {/* Narrative */}
      <div className="flex-grow">
        <h3 className="text-lg font-bold leading-tight group-hover:text-accent-primary transition-colors">
          {cluster.title}
        </h3>
        <p className="mt-2 text-sm text-text-secondary line-clamp-3">
          {cluster.narrative || primaryItem.summary}
        </p>
      </div>

      {/* Footer Info */}
      <div className="mt-auto pt-4 flex justify-between items-center border-t border-glass-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-accent-primary/20 flex items-center justify-center text-[10px] font-bold">
            {primaryItem.sourceName.charAt(0)}
          </div>
          <span className="text-[10px] font-semibold text-text-muted">
            {primaryItem.sourceName}
          </span>
        </div>
        <div className="flex gap-2">
           <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-text-muted">
            <Bookmark size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
