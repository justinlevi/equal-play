import React from 'react';
import { formatTime } from '../utils/time';

interface HeaderProps {
  matchSeconds: number;
  onFieldCount: number;
  onFieldTarget: number;
  running: boolean;
  onToggleRunning: () => void;
  onShowSettings: () => void;
  onShowRoster: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  matchSeconds,
  onFieldCount,
  onFieldTarget,
  running,
  onToggleRunning,
  onShowSettings,
  onShowRoster,
}) => {
  return (
    <header className="bg-slate-800 border-b border-slate-700 p-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto">
        {/* Top row - Match info */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="bg-slate-900 px-2 py-1 rounded">
              <span className="opacity-70 text-xs">Match:</span>
              <span className="font-mono font-bold ml-1">{formatTime(matchSeconds)}</span>
            </div>
            <div className="bg-slate-900 px-2 py-1 rounded">
              <span className="opacity-70 text-xs">Field:</span>
              <span className={`font-bold ml-1 ${onFieldCount !== onFieldTarget ? 'text-yellow-400' : ''}`}>
                {onFieldCount}/{onFieldTarget}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onShowSettings}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600"
              title="Settings"
            >
              ⚙️
            </button>
            <button
              onClick={onShowRoster}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600"
              title="Manage Roster"
            >
              👥
            </button>
          </div>
        </div>
        
        {/* Bottom row - Start/Pause button */}
        <button
          onClick={onToggleRunning}
          className={`w-full px-4 py-2 rounded-lg font-bold text-lg ${
            running ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {running ? "⏸ PAUSE" : "▶ START"}
        </button>
      </div>
    </header>
  );
};