'use client';

import React from 'react';
import { AI_SEED_SOURCES } from '@/lib/pipeline/seed';
import { Database, Link as LinkIcon, Activity } from 'lucide-react';
import Link from 'next/link';

export default function SourcesPage() {
  return (
    <div className="min-h-screen bg-bg-deep p-8 space-y-8">
      <header className="flex justify-between items-center">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-accent-primary tracking-[0.3em] uppercase">Intelligence Inventory</p>
          <h1 className="heading-hero glow-text">Active Feeds</h1>
        </div>
        <Link href="/" className="px-6 py-2 glass-card rounded-full text-xs font-bold hover:glow-primary transition-all">
          BACK TO DASHBOARD
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AI_SEED_SOURCES.map((source) => (
          <div key={source.id} className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-white/5 rounded-xl">
                <Database size={20} className="text-accent-primary" />
              </div>
              <span className="text-[10px] uppercase font-bold text-text-muted bg-white/5 px-2 py-1 rounded">
                Source: {source.type}
              </span>
            </div>
            
            <div>
              <h3 className="text-lg font-bold">{source.name}</h3>
              <div className="flex items-center gap-1 mt-1 text-text-muted">
                <LinkIcon size={12} />
                <span className="text-[10px] truncate max-w-[200px]">{source.url}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-glass-border">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${source.isActive ? 'bg-sage' : 'bg-red-500'} animate-pulse`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {source.isActive ? 'Polling Active' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-accent-gold">
                <Activity size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">94% Integrity</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
