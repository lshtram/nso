'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DailySummaryHero } from '@/components/DailySummaryHero';
import { TopicStream } from '@/components/TopicStream';
import { SteeringBar } from '@/components/SteeringBar';
import { DeepDiveView } from '@/components/DeepDiveView';
import { SourceRoom } from '@/components/SourceRoom';
import { BrainDiscoveryRoom } from '@/components/BrainDiscoveryRoom';
import { StoryCluster, SourceEntity } from '@/types';
import { AI_SEED_SOURCES } from '@/lib/pipeline/seed';
import { Settings, RefreshCw } from 'lucide-react';
import { getAggregatedNews } from '@/lib/actions/news';
import { getPipelineStatus, getActiveBrainAction } from '@/lib/actions/status';
import { MissionControlHUD } from '@/components/MissionControlHUD';

type ViewState = 'dashboard' | 'deep-dive' | 'management' | 'discovery';

export default function Home() {
  const [view, setView] = useState<ViewState>('dashboard');
  const [selectedCluster, setSelectedCluster] = useState<StoryCluster | null>(null);
  const [clusters, setClusters] = useState<StoryCluster[]>([]);
  const [activeSources, setActiveSources] = useState<SourceEntity[]>(AI_SEED_SOURCES as any);
  const [activeBrain, setActiveBrain] = useState<string>('Detecting...');
  const [persona, setPersona] = useState<string>('Neutral Brief');
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();
  
  const [weights, setWeights] = useState<Record<string, number>>({
    TECH: 85,
    PHILOSOPHY: 40,
    GEOPOLITICS: 65,
    SCIENCE: 30
  });

  const handleToggleSource = (id: string) => {
    setActiveSources(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  const [statusMessage, setStatusMessage] = useState('Initializing intelligence grid...');
  const [timeElapsed, setTimeElapsed] = useState(0);

  const fetchNews = async (isRefresh = false, overrides?: { weights?: Record<string, number>, persona?: string }) => {
    if (loading) return;
    setLoading(true);
    setTimeElapsed(0);
    setStatusMessage('STAGE:1:Initializing intelligence grid...');
    const targetWeights = overrides?.weights || weights;
    const targetPersona = overrides?.persona || persona;
    
    // Timer for user feedback
    const timer = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);

    // Start polling status (using API route to avoid Server Action queuing)
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/status', { cache: 'no-store' });
        const status = await res.json();
        if (status.message) setStatusMessage(status.message);
      } catch (e) {}
    }, 1000);

    // Safety timeout - 15 minutes max
    const safetyTimeout = setTimeout(() => {
       clearInterval(timer);
       clearInterval(pollInterval);
       setLoading(false);
    }, 900000);

    try {
      const { clusters: results, dailySummary: summary, activeBrain: brain } = await getAggregatedNews(targetWeights, isRefresh, targetPersona, activeSources);
      setClusters(results);
      setDailySummary(summary);
      setActiveBrain(brain);
    } catch (err) {
      console.error('Pipeline Error:', err);
    } finally {
      clearInterval(timer);
      clearInterval(pollInterval);
      clearTimeout(safetyTimeout);
      setLoading(false);
    }
  };

  // Effect to resolve brain name immediately
  useEffect(() => {
    const checkBrain = async () => {
      try {
        const name = await getActiveBrainAction();
        setActiveBrain(name);
      } catch (e) {
        setActiveBrain('Unknown Brain');
      }
    };
    checkBrain();

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      fetchNews();
    }, 500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [weights]);

  // Handle URL hash for back-button support
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#story-')) {
        const id = hash.replace('#story-', '');
        const story = clusters.find(c => c.id === id);
        if (story) {
          setSelectedCluster(story);
          setView('deep-dive');
        }
      } else if (hash === '#management') {
        setView('management');
      } else {
        setView('dashboard');
        setSelectedCluster(null);
      }
    };

    window.addEventListener('popstate', handleHashChange);
    // Handle initial load if hash is present
    if (clusters.length > 0) handleHashChange();

    return () => window.removeEventListener('popstate', handleHashChange);
  }, [clusters]);

  const handleDeepDive = (cluster: StoryCluster) => {
    window.location.hash = `story-${cluster.id}`;
    // View state will be updated by handleHashChange
  };

  const handleBack = () => {
    // Explicitly update view state to ensure immediate UI response
    setView('dashboard');
    window.location.hash = '';
  };

  const updateWeight = (id: string, value: number) => {
    const newWeights = { ...weights, [id]: value };
    setWeights(newWeights);
    fetchNews(false, { weights: newWeights });
  };

  const updatePersona = (p: string) => {
    setPersona(p);
    fetchNews(false, { persona: p });
  };

  if (view === 'deep-dive' && selectedCluster) {
    return (
      <DeepDiveView 
        cluster={selectedCluster} 
        onBack={handleBack} 
        sources={activeSources} 
        weights={weights} 
        onAddSource={(newSource) => {
          const source: SourceEntity = {
            id: newSource.id || `new-${Date.now()}`,
            name: newSource.name || 'Unnamed',
            type: (newSource.type as any) || 'rss',
            url: newSource.url || '',
            isActive: true,
            healthStatus: 'active'
          };
          setActiveSources(prev => [...prev, source]);
        }}
      />
    );
  }

  if (view === 'management') {
    return (
      <SourceRoom 
        onBack={handleBack} 
        persona={persona} 
        onPersonaChange={updatePersona} 
        onBrainDiscovery={() => setView('discovery')}
        sources={activeSources}
        onToggleSource={handleToggleSource}
      />
    );
  }

  if (view === 'discovery') {
    return (
      <BrainDiscoveryRoom 
        onBack={() => setView('management')} 
        sources={activeSources} 
        onAddSource={(newSource) => {
          const source: SourceEntity = {
            id: newSource.id || 'new-source',
            name: newSource.name || 'Unnamed',
            type: (newSource.type as any) || 'rss',
            url: newSource.url || '',
            isActive: true,
            healthStatus: 'active'
          };
          setActiveSources(prev => {
            if (prev.some(s => s.url === source.url)) return prev;
            return [...prev, source];
          });
          // Do not redirect back to management. Keep the user in the chat flow.
        }}
      />
    );
  }

  const heroSummary = dailySummary || {
    headline: "Synthesizing the Day's Intelligence...",
    content: "The 9-stage pipeline is currently scouting 15 high-signal AI sources across the global grid.",
    detailedNarrative: "Initial triage complete. Converging on primary technical themes."
  };

  return (
    <main className="min-h-screen pb-32">
       {/* Management Toggle & Refresh */}
       <div className="fixed top-8 right-8 z-50 flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end gap-1 px-4 py-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl">
          <span className="text-[7px] font-black uppercase tracking-[0.2em] text-gray-500">Active Brain</span>
          <span className={`text-[10px] font-bold ${activeBrain.includes('Gemini') ? 'text-[var(--chrome-yellow)]' : 'text-gray-400'}`}>
            {activeBrain}
          </span>
        </div>
        <button 
          onClick={() => fetchNews(true)}
          className="p-4 bg-white/10 backdrop-blur-xl shadow-2xl rounded-full text-white hover:bg-white hover:text-black transition-all border border-white/10"
          title="Manual Refresh"
        >
          <RefreshCw size={20} className={loading && clusters.length > 0 ? "animate-spin" : ""} />
        </button>
        <button 
          onClick={() => setView('management')}
          className="p-4 bg-white/10 backdrop-blur-xl shadow-2xl rounded-full text-white hover:bg-white hover:text-black transition-all border border-white/10"
          title="Management Source Room"
        >
          <Settings size={20} />
        </button>
      </div>

      <MissionControlHUD 
        isLoading={loading && clusters.length === 0}
        statusMessage={statusMessage}
        timeElapsed={timeElapsed}
      />

      <DailySummaryHero 
        summary={heroSummary} 
        weights={weights}
        onWeightChange={updateWeight}
      />
          
      <section className="section-light py-20 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto space-y-24">
          {[
            { id: 'TECH', label: 'Technology' },
            { id: 'PHILOSOPHY', label: 'Philosophy' },
            { id: 'GEOPOLITICS', label: 'Geopolitics' },
            { id: 'SCIENCE', label: 'Science' }
          ].map(cat => {
            const catClusters = clusters.filter(c => c.category === cat.id);
            if (catClusters.length === 0) return null;
            return (
              <TopicStream 
                key={cat.id} 
                title={cat.label} 
                clusters={catClusters} 
                onCardClick={handleDeepDive} 
              />
            );
          })}
        </div>
      </section>

      <SteeringBar 
        sources={activeSources} 
        weights={weights} 
        onAddSource={(newSource) => {
          const source: SourceEntity = {
            id: newSource.id || `new-${Date.now()}`,
            name: newSource.name || 'Unnamed',
            type: (newSource.type as any) || 'rss',
            url: newSource.url || '',
            isActive: true,
            healthStatus: 'active'
          };
          setActiveSources(prev => {
            if (prev.some(s => s.url === source.url)) return prev;
            return [...prev, source];
          });
        }} 
      />
    </main>
  );
}