'use client';

import React from 'react';
import { StoryCluster } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Info, AlertTriangle } from 'lucide-react';

interface DeepDiveProps {
  cluster: StoryCluster | null;
  onClose: () => void;
}

export const DeepDive: React.FC<DeepDiveProps> = ({ cluster, onClose }) => {
  if (!cluster) return null;

  const mainItem = cluster.items[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative h-full w-full max-w-2xl bg-bg-surface border-l border-glass-border overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 glass-pane p-4 flex justify-between items-center">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex gap-4">
              <a
                href={mainItem.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-accent-primary rounded-full text-xs font-bold hover:glow-primary transition-all"
              >
                ORIGINAL SOURCE <ExternalLink size={14} />
              </a>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Metadata Tier */}
            <div className="space-y-4">
              <span className="px-3 py-1 bg-accent-primary/20 text-accent-primary text-[10px] font-bold rounded-lg tracking-widest uppercase">
                {cluster.category} Signal
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight">{cluster.title}</h1>
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span>{new Date(mainItem.publishedAt).toLocaleDateString()}</span>
                <span>•</span>
                <span className="font-semibold">{mainItem.sourceName}</span>
              </div>
            </div>

            {/* Stage 8 Narrative */}
            <div className="p-6 bg-accent-primary/5 border border-accent-primary/10 rounded-2xl italic text-text-secondary leading-relaxed">
              "{cluster.narrative}"
            </div>

            {/* Stage 4: Conflict Summary Panel */}
            {cluster.conflictSummary && (
              <div className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-orange-400">
                  <AlertTriangle size={18} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Points of Contradiction</h3>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {cluster.conflictSummary}
                </p>
              </div>
            )}

            {/* Why It Matters */}
            {cluster.whyItMatters && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-accent-gold">
                  <Info size={18} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">The "Deep Mind" Insight</h3>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {cluster.whyItMatters}
                </p>
              </div>
            )}

            {/* Full Body */}
            <hr className="border-glass-border" />
            <div className="prose prose-invert max-w-none">
              <div 
                className="text-text-secondary leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: mainItem.fullText || '' }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
