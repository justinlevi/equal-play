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
  onShowSubStaging: () => void;
  stagedSubsCount: number;
  homeScore: number;
  awayScore: number;
  homeTeamName: string;
  awayTeamName: string;
  onIncrementHomeScore: () => void;
  onDecrementHomeScore: () => void;
  onIncrementAwayScore: () => void;
  onDecrementAwayScore: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  matchSeconds,
  onFieldCount,
  onFieldTarget,
  running,
  onToggleRunning,
  onShowSettings,
  onShowRoster,
  onShowSubStaging,
  stagedSubsCount,
  homeScore,
  awayScore,
  homeTeamName,
  awayTeamName,
  onIncrementHomeScore,
  onDecrementHomeScore,
  onIncrementAwayScore,
  onDecrementAwayScore,
}) => {
  return (
    <header className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Score section - Primary focus */}
        <div className="text-center px-2 sm:px-0">
          <div className="flex items-stretch justify-center gap-2 sm:gap-6 lg:gap-12 max-w-full">
            {/* Home Team */}
            <div className="flex items-stretch gap-1 sm:gap-2 flex-1 max-w-[45%] sm:max-w-none sm:flex-initial">
              <button
                onClick={onDecrementHomeScore}
                className="w-10 sm:w-12 bg-slate-600 hover:bg-slate-500 rounded-lg text-xl sm:text-2xl font-bold flex items-center justify-center transition-colors flex-shrink-0"
                title="Decrease home score"
              >
                −
              </button>
              <div className="text-center min-w-0 sm:min-w-[120px] flex flex-col justify-center py-2 flex-1 sm:flex-initial">
                <div className="text-white font-bold text-sm sm:text-lg mb-1 truncate">{homeTeamName}</div>
                <div className="text-3xl sm:text-4xl font-bold font-mono text-blue-400">{homeScore}</div>
              </div>
              <button
                onClick={onIncrementHomeScore}
                className="w-10 sm:w-12 bg-slate-600 hover:bg-slate-500 rounded-lg text-xl sm:text-2xl font-bold flex items-center justify-center transition-colors flex-shrink-0"
                title="Increase home score"
              >
                +
              </button>
            </div>
            
            {/* Score separator */}
            <div className="text-2xl sm:text-3xl font-bold text-slate-400 flex items-center flex-shrink-0 px-1 sm:px-4">VS</div>
            
            {/* Away Team */}
            <div className="flex items-stretch gap-1 sm:gap-2 flex-1 max-w-[45%] sm:max-w-none sm:flex-initial">
              <button
                onClick={onDecrementAwayScore}
                className="w-10 sm:w-12 bg-slate-600 hover:bg-slate-500 rounded-lg text-xl sm:text-2xl font-bold flex items-center justify-center transition-colors flex-shrink-0"
                title="Decrease away score"
              >
                −
              </button>
              <div className="text-center min-w-0 sm:min-w-[120px] flex flex-col justify-center py-2 flex-1 sm:flex-initial">
                <div className="text-white font-bold text-sm sm:text-lg mb-1 truncate">{awayTeamName}</div>
                <div className="text-3xl sm:text-4xl font-bold font-mono text-orange-400">{awayScore}</div>
              </div>
              <button
                onClick={onIncrementAwayScore}
                className="w-10 sm:w-12 bg-slate-600 hover:bg-slate-500 rounded-lg text-xl sm:text-2xl font-bold flex items-center justify-center transition-colors flex-shrink-0"
                title="Increase away score"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Match info and controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-600">
              <span className="text-slate-300 text-xs">MATCH</span>
              <span className="font-mono font-bold ml-2 text-white">{formatTime(matchSeconds)}</span>
            </div>
            <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-600">
              <span className="text-slate-300 text-xs">FIELD</span>
              <span className={`font-bold ml-2 ${onFieldCount !== onFieldTarget ? 'text-yellow-400' : 'text-white'}`}>
                {onFieldCount}/{onFieldTarget}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onShowSubStaging}
              className="p-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors relative"
              title="Stage Substitutions"
            >
              📋
              {stagedSubsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {stagedSubsCount}
                </span>
              )}
            </button>
            <button
              onClick={onShowSettings}
              className="p-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
              title="Settings"
            >
              ⚙️
            </button>
            <button
              onClick={onShowRoster}
              className="p-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
              title="Manage Roster"
            >
              👥
            </button>
          </div>
        </div>
        
        {/* Start/Pause button */}
        <button
          onClick={onToggleRunning}
          className={`w-full px-6 py-3 rounded-lg font-bold text-xl transition-colors ${
            running ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {running ? "⏸ PAUSE" : "▶ START"}
        </button>
      </div>
    </header>
  );
};