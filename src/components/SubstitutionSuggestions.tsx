import React, { useState, useEffect } from 'react';
import { SubstitutionSuggestion } from '../types/index';
import { formatTime } from '../utils/time';

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
        <div className="space-y-2">
        {suggestions.map((sub, idx) => (
          <div key={idx} className="flex items-center justify-between bg-slate-800 rounded p-2">
            <div className="text-sm">
              <span className="text-red-400">↓ {sub.off.name}</span>
              <span className="mx-2">→</span>
              <span className="text-green-400">↑ {sub.on.name}</span>
              <span className="ml-2 opacity-70">
                (Δ {formatTime(sub.diff)})
              </span>
            </div>
            <button
              onClick={() => onExecuteSwap(sub.off.id, sub.on.id)}
              className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs font-bold"
            >
              SWAP
            </button>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};