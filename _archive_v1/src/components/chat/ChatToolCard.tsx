
import React, { useState } from 'react';
import { Check, Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { SourceEntity } from '@/types';

interface ToolAction {
  action: string;
  name: string;
  url: string;
  type: 'rss' | 'github' | 'youtube';
}

interface Props {
  tool: ToolAction;
  onAddSource: (source: Partial<SourceEntity>) => void;
  isExisting: boolean;
  variant?: 'overlay' | 'full';
}

export const ChatToolCard: React.FC<Props> = ({ tool, onAddSource, isExisting, variant = 'full' }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>(isExisting ? 'success' : 'idle');

  const handleClick = async () => {
    if (status !== 'idle') return;
    
    setStatus('loading');
    
    // Simulate network delay for animation feel + actual add
    await new Promise(resolve => setTimeout(resolve, 800));
    onAddSource({ 
        id: tool.name.toLowerCase().replace(/\s/g, '-'), 
        name: tool.name, 
        url: tool.url, 
        type: tool.type, 
        isActive: true 
    });
    
    setStatus('success');
  };

  const isOverlay = variant === 'overlay';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative border rounded-2xl flex items-center justify-between gap-4 transition-all
        ${isOverlay ? 'p-4 bg-white/40 border-white/60 backdrop-blur-md' : 'p-5 bg-white border-dashed border-[var(--chrome-yellow)]/30'}
        ${status === 'success' ? 'border-green-500/20 bg-green-50/50' : ''}
      `}
    >
        <div className="flex items-center gap-3 overflow-hidden">
            <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm flex-shrink-0
                ${status === 'success' ? 'bg-green-100 text-green-600' : 'bg-[var(--chrome-yellow)] text-black'}
            `}>
                {tool.type === 'rss' && '📰'}
                {tool.type === 'github' && '🛠️'}
                {tool.type === 'youtube' && '📺'}
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase text-gray-900 truncate">{tool.name}</span>
                <span className="text-[8px] font-mono text-gray-400 truncate max-w-[150px]">{tool.url}</span>
            </div>
        </div>

        <button 
            onClick={handleClick}
            disabled={status !== 'idle'}
            className={`
                px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 transition-all shadow-md
                ${status === 'idle' ? 'bg-black text-[var(--chrome-yellow)] hover:scale-105 active:scale-95' : ''}
                ${status === 'loading' ? 'bg-gray-800 text-white cursor-wait' : ''}
                ${status === 'success' ? 'bg-green-500 text-white cursor-default' : ''}
            `}
        >
            {status === 'idle' && (
                <>
                    <Plus size={12} /> Subscribe
                </>
            )}
            {status === 'loading' && (
                <>
                    <Loader2 size={12} className="animate-spin" /> Activating
                </>
            )}
            {status === 'success' && (
                <>
                    <Check size={12} /> Active
                </>
            )}
        </button>
    </motion.div>
  );
};
