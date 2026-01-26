'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';

interface InterestEqualizerProps {
  weights: Record<string, number>;
  onChange: (category: string, value: number) => void;
}

export const InterestEqualizer: React.FC<InterestEqualizerProps> = ({ weights, onChange }) => {
  const categories = Object.keys(weights);

  return (
    <div className="glass-pane p-6 rounded-3xl space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <SlidersHorizontal size={18} className="text-accent-primary" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-secondary">
          Interest Equalizer
        </h2>
      </div>

      <div className="space-y-5">
        {categories.map((category) => (
          <div key={category} className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold tracking-wider uppercase text-text-muted">
              <span>{category}</span>
              <span className="text-accent-primary">{weights[category]}%</span>
            </div>
            <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <input
                type="range"
                min="0"
                max="100"
                value={weights[category]}
                onChange={(e) => onChange(category, parseInt(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <motion.div
                initial={false}
                animate={{ width: `${weights[category]}%` }}
                className="h-full bg-gradient-to-r from-accent-primary to-blue-400"
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-2 text-[10px] text-text-muted italic leading-tight">
        * Steering Stage 7 (Ranking) weights in real-time.
      </div>
    </div>
  );
};
