import React from 'react';
import { Player, CustomStat } from '../types';
import { formatTime } from '../utils/time';

interface PlayerCardProps {
  player: Player;
  enabledStats: CustomStat[];
  onToggle: (id: string) => void;
  onStatUpdate: (playerId: string, statId: string, delta: number) => void;
  onSelectPlayer: (player: Player) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  enabledStats,
  onToggle,
  onStatUpdate,
  onSelectPlayer,
}) => {
  return (
    <div
      className={`border rounded-lg p-3 ${
        player.on
          ? "bg-green-900/30 border-green-600"
          : "bg-slate-800 border-slate-700"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div 
          className="flex-1 cursor-pointer"
          onClick={() => onSelectPlayer(player)}
        >
          <span className="font-bold text-lg">
            {player.number && `#${player.number} `}
            {player.name}
          </span>
        </div>
        <button
          onClick={() => onToggle(player.id)}
          className={`px-3 py-1 rounded text-sm font-bold ${
            player.on
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {player.on ? "BENCH" : "FIELD"}
        </button>
      </div>
      
      <div className="text-sm opacity-90 mb-2">
        Time: <span className="font-mono font-bold">{formatTime(player.seconds || 0)}</span>
      </div>
      
      {enabledStats.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {enabledStats.map(stat => (
            <div key={stat.id} className="flex items-center gap-1 bg-slate-700 rounded px-2 py-1">
              <span className="text-xs">{stat.icon}</span>
              <span className="font-mono text-sm">{player.stats[stat.id] || 0}</span>
              <button
                onClick={() => onStatUpdate(player.id, stat.id, 1)}
                className="ml-1 text-green-400 hover:text-green-300 text-xs"
              >
                +
              </button>
              <button
                onClick={() => onStatUpdate(player.id, stat.id, -1)}
                className="text-red-400 hover:text-red-300 text-xs"
                disabled={(player.stats[stat.id] || 0) === 0}
              >
                -
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};