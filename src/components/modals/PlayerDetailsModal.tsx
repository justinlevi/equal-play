import React from 'react';
import { Player, CustomStat } from '../../types/index';
import { formatTime } from '../../utils/time';

interface PlayerDetailsModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  enabledStats: CustomStat[];
  onStatUpdate: (playerId: string, statId: string, delta: number) => void;
}

export const PlayerDetailsModal: React.FC<PlayerDetailsModalProps> = ({
  player,
  isOpen,
  onClose,
  enabledStats,
  onStatUpdate,
}) => {
  if (!isOpen || !player) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">
          {player.number && `#${player.number} `}
          {player.name}
        </h2>
        
        <div className="space-y-4">
          <div className="bg-slate-900 rounded p-3">
            <div className="text-sm opacity-70">Playing Time</div>
            <div className="text-2xl font-mono font-bold">{formatTime(player.seconds || 0)}</div>
            <div className={`text-sm mt-1 ${player.on ? 'text-green-400' : 'text-slate-400'}`}>
              {player.on ? '🟢 On Field' : '⚪ On Bench'}
            </div>
          </div>
          
          {enabledStats.length > 0 && (
            <div>
              <h3 className="font-bold mb-2">Statistics</h3>
              <div className="space-y-2">
                {enabledStats.map(stat => (
                  <div key={stat.id} className="flex items-center justify-between bg-slate-900 rounded p-3">
                    <div className="flex items-center gap-2">
                      <span>{stat.icon}</span>
                      <span>{stat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onStatUpdate(player.id, stat.id, -1)}
                        className="w-8 h-8 bg-red-600 hover:bg-red-700 rounded flex items-center justify-center"
                        disabled={(player.stats[stat.id] || 0) === 0}
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-xl w-8 text-center">
                        {player.stats[stat.id] || 0}
                      </span>
                      <button
                        onClick={() => onStatUpdate(player.id, stat.id, 1)}
                        className="w-8 h-8 bg-green-600 hover:bg-green-700 rounded flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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