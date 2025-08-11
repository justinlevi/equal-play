import React, { useState } from 'react';
import { Player, Position } from '../../types/index';
import { POSITION_CONFIG, ALL_POSITIONS } from '../../utils/positions';

interface RosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onAddPlayer: (name: string, number: string) => void;
  onAddMultiplePlayers?: (names: string[]) => void;
  onAddMultiplePlayersWithPositions?: (playersData: Array<{name: string; positions?: Position[]}>) => void;
  onRemovePlayer: (id: string) => void;
  onPositionToggle: (playerId: string, position: Position) => void;
}

export const RosterModal: React.FC<RosterModalProps> = ({
  isOpen,
  onClose,
  players,
  onAddPlayer,
  onAddMultiplePlayers,
  onAddMultiplePlayersWithPositions,
  onRemovePlayer,
  onPositionToggle,
}) => {
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkNames, setBulkNames] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  if (!isOpen) return null;

  // Sort players alphabetically
  const sortedPlayers = [...players].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name);
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleAdd = () => {
    if (newName.trim()) {
      onAddPlayer(newName, newNumber);
      setNewName('');
      setNewNumber('');
    }
  };

  const handleBulkAdd = () => {
    // Parse each line for name and optional positions (one player per line)
    const lines = bulkNames.split('\n').filter(line => line.trim());
    const playersData: Array<{name: string; positions?: Position[]}> = [];
    
    for (const line of lines) {
      // Check if line contains positions (format: "Name, POS1, POS2")
      const parts = line.split(',').map(p => p.trim()).filter(p => p);
      if (parts.length === 0) continue;
      
      const name = parts[0];
      const positions: Position[] = [];
      
      // Check remaining parts for valid positions
      for (let i = 1; i < parts.length; i++) {
        const upperPart = parts[i].toUpperCase();
        if (ALL_POSITIONS.includes(upperPart as Position)) {
          positions.push(upperPart as Position);
        }
      }
      
      playersData.push({ name, positions: positions.length > 0 ? positions : undefined });
    }
    
    // Use the new function if available
    if (onAddMultiplePlayersWithPositions) {
      onAddMultiplePlayersWithPositions(playersData);
    } else if (onAddMultiplePlayers) {
      // Fallback to just names
      onAddMultiplePlayers(playersData.map(p => p.name));
    }
    
    // Clear the bulk input
    setBulkNames('');
    setBulkMode(false);
  };
  
  // Helper function to count valid players in bulk input
  const getBulkPlayerCount = () => {
    return bulkNames
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        // Get just the name part (before any comma)
        const namePart = trimmed.split(',')[0].trim();
        return namePart.length > 0;
      }).length;
  };

  const handleExport = () => {
    const exportText = sortedPlayers.map(player => {
      const positions = player.positions?.join(', ') || '';
      return positions ? `${player.name}, ${positions}` : player.name;
    }).join('\n');
    
    navigator.clipboard.writeText(exportText).then(() => {
      alert('Roster copied to clipboard!');
    }).catch(() => {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = exportText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Roster copied to clipboard!');
    });
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
        <h2 className="text-xl font-bold mb-4">Manage Roster</h2>
        
        <div className="mb-4">
          {/* Toggle between single and bulk mode */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setBulkMode(false)}
              className={`flex-1 px-3 py-2 rounded ${
                !bulkMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Add Single Player
            </button>
            <button
              onClick={() => setBulkMode(true)}
              className={`flex-1 px-3 py-2 rounded ${
                bulkMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Bulk Add Players
            </button>
          </div>

          {/* Single player input */}
          {!bulkMode ? (
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Player name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="flex-1 px-3 py-2 bg-slate-900 rounded"
              />
              <input
                type="text"
                placeholder="#"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="w-16 px-3 py-2 bg-slate-900 rounded text-center"
                maxLength={2}
              />
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-bold"
              >
                Add
              </button>
            </div>
          ) : (
            /* Bulk player input */
            <div className="space-y-2 mb-4">
              <textarea
                placeholder="Enter one player per line with optional positions&#10;&#10;Format:&#10;Name, Position1, Position2&#10;&#10;Examples:&#10;John Smith, GK&#10;Sarah Johnson, DEF, MID&#10;Emma Davis&#10;Mike Wilson, FWD"
                value={bulkNames}
                onChange={(e) => setBulkNames(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 rounded h-32 resize-none font-mono text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleBulkAdd}
                  disabled={!bulkNames.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:opacity-50 rounded font-bold"
                >
                  Add All Players ({getBulkPlayerCount()})
                </button>
                <button
                  onClick={() => setBulkNames('')}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
          
          {/* Sort controls and player list */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">
              {players.length} {players.length === 1 ? 'Player' : 'Players'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                disabled={players.length === 0}
              >
                Export
              </button>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm flex items-center gap-2"
                title={sortOrder === 'asc' ? 'Sort Z-A' : 'Sort A-Z'}
              >
                <span>Name</span>
                <span>{sortOrder === 'asc' ? '↓' : '↑'}</span>
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {sortedPlayers.map((player) => (
              <div
                key={player.id}
                className="bg-slate-900 rounded p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>
                      {player.number && `#${player.number} `}
                      {player.name}
                    </span>
                    {player.positions && player.positions.length > 0 && (
                      <div className="flex gap-1">
                        {player.positions.map(pos => (
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
                  <button
                    onClick={() => onRemovePlayer(player.id)}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex gap-1">
                  {ALL_POSITIONS.map(position => {
                    const config = POSITION_CONFIG[position];
                    const isSelected = player.positions?.includes(position);
                    return (
                      <button
                        key={position}
                        onClick={() => onPositionToggle(player.id, position)}
                        className={`px-2 py-0.5 rounded text-xs transition-all ${
                          isSelected 
                            ? `${config.bgColor} ${config.color}`
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-500'
                        }`}
                        title={config.fullName}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};