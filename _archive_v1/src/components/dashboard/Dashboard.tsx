'use client';

import React, { useState, useEffect } from 'react';
import { StoryCluster, SourceEntity, SteeringContext } from '@/types';
import { StoryCard } from './StoryCard';
import { InterestEqualizer } from './InterestEqualizer';
import { DeepDive } from './DeepDive';
import { getAggregatedNews } from '@/lib/actions/news';
import { Loader2, RefreshCw, Zap } from 'lucide-react';

export default function Dashboard() {
  const [clusters, setClusters] = useState<StoryCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<StoryCluster | null>(null);
  
  // Weights for the Interest Equalizer (Stage 7 Steering)
  const [weights, setWeights] = useState<Record<string, number>>({
    TECH: 80,
    POLITICS: 40,
    PHILOSOPHY: 60,
    GENERAL: 30
  });

  const fetchNews = async (isRefresh = false) => {
    setLoading(true);
    
    try {
      const { clusters } = await getAggregatedNews(weights);
      setClusters(clusters);
    } catch (err) {
      console.error('Pipeline Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time re-ranking when weights change
  useEffect(() => {
    fetchNews();
  }, [weights]);

  return (
    <div className="min-h-screen pb-20">
      {/* Header Tier */}
      <header className="px-8 py-10 flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-accent-primary tracking-[0.3em] uppercase">
            Intelligence Pulse
          </p>
          <h1 className="heading-hero glow-text">Daily Narrative</h1>
        </div>
        <button 
          onClick={() => fetchNews(true)}
          className="p-3 glass-card rounded-full text-text-secondary hover:text-white"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <main className="px-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side: Controls */}
        <aside className="lg:col-span-1 space-y-6">
          <InterestEqualizer 
            weights={weights} 
            onChange={(cat, val) => setWeights(prev => ({ ...prev, [cat]: val }))} 
          />
          
          <div className="glass-card p-6 rounded-3xl space-y-4 border-accent-gold/20">
            <div className="flex items-center gap-2 text-accent-gold">
               <Zap size={18} fill="currentColor" />
               <h3 className="text-xs font-bold uppercase tracking-widest">Momentum Pulse</h3>
            </div>
            <p className="text-[10px] text-text-muted leading-relaxed">
              Tracking high-velocity signals outside your immediate interest equalizer.
            </p>
          </div>
        </aside>

        {/* Center: Story Stream */}
        <section className="lg:col-span-3">
          {loading && clusters.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4 text-text-muted">
              <Loader2 className="animate-spin" size={32} />
              <p className="text-sm font-medium tracking-widest uppercase">Executing 9-Stage Pipeline...</p>
            </div>
          ) : (
            <div className="dashboard-grid">
              {clusters.map((cluster) => (
                <StoryCard 
                  key={cluster.id} 
                  cluster={cluster} 
                  onClick={setSelectedCluster} 
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <DeepDive 
        cluster={selectedCluster} 
        onClose={() => setSelectedCluster(null)} 
      />
    </div>
  );
}
