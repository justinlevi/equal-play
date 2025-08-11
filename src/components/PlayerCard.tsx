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
      className={`border rounded-lg p-3 cursor-pointer hover:brightness-110 transition-all ${
        player.on
          ? "bg-green-900/30 border-green-600"
          : "bg-slate-800 border-slate-700"
      }`}
      onClick={() => onSelectPlayer(player)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <span className="font-bold text-lg">
            {player.number && `#${player.number} `}
            {player.name}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(player.id);
          }}
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
            <button
              key={stat.id}
              onClick={(e) => {
                e.stopPropagation();
                onStatUpdate(player.id, stat.id, 1);
              }}
              className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 rounded px-3 py-1 transition-colors cursor-pointer"
              title={`Click to add ${stat.name}`}
            >
              <span className="text-sm">{stat.icon}</span>
              <span className="font-mono text-sm font-bold">{player.stats[stat.id] || 0}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};