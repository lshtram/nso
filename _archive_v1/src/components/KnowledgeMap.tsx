"use client";

import React from "react";
import { motion } from "framer-motion";

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface Edge {
  from: string;
  to: string;
}

export const KnowledgeMap: React.FC = () => {
  const nodes: Node[] = [
    { id: "1", label: "Quantum Era", x: 150, y: 100 },
    { id: "2", label: "AI Safety", x: 50, y: 200 },
    { id: "3", label: "Global Treaty", x: 250, y: 200 },
    { id: "4", label: "Ethics", x: 150, y: 300 },
    { id: "5", label: "Frontend", x: 50, y: 400 },
    { id: "6", label: "Database", x: 250, y: 400 },
  ];

  const edges: Edge[] = [
    { from: "1", to: "2" },
    { from: "1", to: "3" },
    { from: "2", to: "4" },
    { from: "3", to: "4" },
    { from: "5", to: "6" },
  ];

  return (
    <div className="w-full h-80 bg-black/20 border border-white/5 rounded-3xl overflow-hidden relative group">
      <div className="absolute top-4 left-6 text-[8px] font-black text-white/30 uppercase tracking-[0.2em] z-10">Entity Relationship Map</div>
      
      <svg className="w-full h-full">
        {edges.map((edge, i) => {
          const from = nodes.find(n => n.id === edge.from)!;
          const to = nodes.find(n => n.id === edge.to)!;
          return (
            <motion.line 
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="white"
              strokeWidth="1"
              strokeOpacity="0.1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: i * 0.2 }}
            />
          );
        })}
        
        {nodes.map((node) => (
          <g key={node.id}>
            <motion.circle 
              cx={node.x}
              cy={node.y}
              r="4"
              fill="var(--chrome-yellow)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10, delay: parseInt(node.id) * 0.1 }}
            />
            <motion.text
              x={node.x + 8}
              y={node.y + 3}
              fill="white"
              fontSize="8"
              fontWeight="900"
              className="uppercase tracking-widest opacity-40 select-none group-hover:opacity-100 transition-opacity"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
            >
              {node.label}
            </motion.text>
          </g>
        ))}
      </svg>

      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </div>
  );
};
