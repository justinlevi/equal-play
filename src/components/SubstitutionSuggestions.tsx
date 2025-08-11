import React, { useState, useEffect } from 'react';
import { SubstitutionSuggestion } from '../types/index';
import { formatTime } from '../utils/time';
import { POSITION_CONFIG } from '../utils/positions';

interface SubstitutionSuggestionsProps {
  suggestions: SubstitutionSuggestion[];
  onExecuteSwap: (offId: string, onId: string) => void;
}

export const SubstitutionSuggestions: React.FC<SubstitutionSuggestionsProps> = ({
  suggestions,
  onExecuteSwap,
}) => {
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('ep.suggestionsMinimized');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('ep.suggestionsMinimized', isMinimized.toString());
  }, [isMinimized]);

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-yellow-400 font-bold">⚡ Suggested Substitutions</h3>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-yellow-400 hover:text-yellow-300 text-sm"
        >
          {isMinimized ? '▼ Show' : '▲ Hide'}
        </button>
      </div>
      {!isMinimized && (
        <div className="space-y-3">
        {suggestions.map((sub, idx) => (
          <div key={idx} className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                {/* Off player */}
                <div className="flex items-center gap-2">
                  <span className="text-red-400">↓</span>
                  <span className="text-red-400 font-medium">{sub.off.name}</span>
                  {sub.off.positions && sub.off.positions.length > 0 && (
                    <div className="flex gap-1">
                      {sub.off.positions.map(pos => (
                        <span 
                          key={pos} 
                          className={`text-xs px-1.5 py-0.5 rounded ${POSITION_CONFIG[pos].bgColor} ${POSITION_CONFIG[pos].color}`}
                        >
                          {POSITION_CONFIG[pos].label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* On player */}
                <div className="flex items-center gap-2">
                  <span className="text-green-400">↑</span>
                  <span className="text-green-400 font-medium">{sub.on.name}</span>
                  {sub.on.positions && sub.on.positions.length > 0 && (
                    <div className="flex gap-1">
                      {sub.on.positions.map(pos => (
                        <span 
                          key={pos} 
                          className={`text-xs px-1.5 py-0.5 rounded ${POSITION_CONFIG[pos].bgColor} ${POSITION_CONFIG[pos].color}`}
                        >
                          {POSITION_CONFIG[pos].label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Time difference and swap button */}
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs opacity-70 whitespace-nowrap">
                  Δ {formatTime(sub.diff)}
                </span>
                <button
                  onClick={() => onExecuteSwap(sub.off.id, sub.on.id)}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm font-bold"
                >
                  SWAP
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};