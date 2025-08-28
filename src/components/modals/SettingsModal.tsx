import React, { useState } from 'react';
import { CustomStat } from '../../types/index';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFieldTarget: number;
  setOnFieldTarget: (value: number) => void;
  halfMinutes: number;
  setHalfMinutes: (value: number) => void;
  maxSubSuggestions: number;
  setMaxSubSuggestions: (value: number) => void;
  homeTeamName: string;
  setHomeTeamName: (value: string) => void;
  awayTeamName: string;
  setAwayTeamName: (value: string) => void;
  customStats: CustomStat[];
  onToggleStatEnabled: (statId: string) => void;
  onAddCustomStat: (name: string, icon: string) => void;
  onRemoveCustomStat: (statId: string) => void;
  onResetMinutes: () => void;
  onResetStats: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onFieldTarget,
  setOnFieldTarget,
  halfMinutes,
  setHalfMinutes,
  maxSubSuggestions,
  setMaxSubSuggestions,
  homeTeamName,
  setHomeTeamName,
  awayTeamName,
  setAwayTeamName,
  customStats,
  onToggleStatEnabled,
  onAddCustomStat,
  onRemoveCustomStat,
  onResetMinutes,
  onResetStats,
}) => {
  const [newStatName, setNewStatName] = useState('');
  const [newStatIcon, setNewStatIcon] = useState('📊');

  if (!isOpen) return null;

  const handleAddStat = () => {
    if (newStatName.trim()) {
      onAddCustomStat(newStatName, newStatIcon);
      setNewStatName('');
      setNewStatIcon('📊');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm opacity-70 mb-1">Players on Field</label>
            <input
              type="number"
              value={onFieldTarget}
              onChange={(e) => setOnFieldTarget(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 bg-slate-900 rounded"
              min="1"
              max="11"
            />
          </div>
          
          <div>
            <label className="block text-sm opacity-70 mb-1">Half Duration (minutes)</label>
            <input
              type="number"
              value={halfMinutes}
              onChange={(e) => setHalfMinutes(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 bg-slate-900 rounded"
              min="1"
              max="90"
            />
          </div>
          
          <div>
            <label className="block text-sm opacity-70 mb-1">Max Substitution Suggestions</label>
            <input
              type="number"
              value={maxSubSuggestions}
              onChange={(e) => setMaxSubSuggestions(Math.max(1, Math.min(10, parseInt(e.target.value) || 5)))}
              className="w-full px-3 py-2 bg-slate-900 rounded"
              min="1"
              max="10"
            />
          </div>
          
          <div>
            <label className="block text-sm opacity-70 mb-1">Home Team Name</label>
            <input
              type="text"
              value={homeTeamName}
              onChange={(e) => setHomeTeamName(e.target.value)}
              onBlur={(e) => setHomeTeamName(e.target.value.trim() || 'Home')}
              className="w-full px-3 py-2 bg-slate-900 rounded"
              placeholder="Home"
              maxLength={20}
            />
          </div>
          
          <div>
            <label className="block text-sm opacity-70 mb-1">Away Team Name</label>
            <input
              type="text"
              value={awayTeamName}
              onChange={(e) => setAwayTeamName(e.target.value)}
              onBlur={(e) => setAwayTeamName(e.target.value.trim() || 'Away')}
              className="w-full px-3 py-2 bg-slate-900 rounded"
              placeholder="Away"
              maxLength={20}
            />
          </div>
          
          <div>
            <h3 className="font-bold mb-2">Statistics Tracking</h3>
            <div className="space-y-2 mb-3">
              {customStats.map(stat => (
                <div key={stat.id} className="flex items-center justify-between bg-slate-900 rounded p-2">
                  <div className="flex items-center gap-2">
                    <span>{stat.icon}</span>
                    <span>{stat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleStatEnabled(stat.id)}
                      className={`px-2 py-1 rounded text-xs ${
                        stat.enabled ? 'bg-green-600' : 'bg-slate-700'
                      }`}
                    >
                      {stat.enabled ? 'ON' : 'OFF'}
                    </button>
                    {!['goals', 'assists', 'saves'].includes(stat.id) && (
                      <button
                        onClick={() => onRemoveCustomStat(stat.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New stat name"
                value={newStatName}
                onChange={(e) => setNewStatName(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-900 rounded"
              />
              <input
                type="text"
                value={newStatIcon}
                onChange={(e) => setNewStatIcon(e.target.value)}
                className="w-16 px-3 py-2 bg-slate-900 rounded text-center"
                maxLength={2}
              />
              <button
                onClick={handleAddStat}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Add
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onResetMinutes}
              className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded"
            >
              Reset Minutes
            </button>
            <button
              onClick={onResetStats}
              className="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded"
            >
              Reset Stats
            </button>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};