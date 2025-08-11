import React, { useState } from 'react';
import { Player } from '../../types/index';

interface RosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onAddPlayer: (name: string, number: string) => void;
  onAddMultiplePlayers?: (names: string[]) => void;
  onRemovePlayer: (id: string) => void;
}

export const RosterModal: React.FC<RosterModalProps> = ({
  isOpen,
  onClose,
  players,
  onAddPlayer,
  onAddMultiplePlayers,
  onRemovePlayer,
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
    // Split by newlines or commas, trim each name, and filter out empty strings
    const names = bulkNames
      .split(/[\n,]+/)
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    // Use bulk add function if available, otherwise fall back to individual adds
    if (onAddMultiplePlayers) {
      onAddMultiplePlayers(names);
    } else {
      // Fallback - shouldn't be used but kept for safety
      names.forEach(name => {
        onAddPlayer(name, '');
      });
    }
    
    // Clear the bulk input
    setBulkNames('');
    setBulkMode(false);
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
                placeholder="Enter player names (one per line or comma-separated)&#10;&#10;Example:&#10;John Smith&#10;Sarah Johnson, Mike Wilson&#10;Emma Davis"
                value={bulkNames}
                onChange={(e) => setBulkNames(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 rounded h-32 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleBulkAdd}
                  disabled={!bulkNames.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:opacity-50 rounded font-bold"
                >
                  Add All Players ({bulkNames.split(/[\n,]+/).filter(n => n.trim()).length})
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
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm flex items-center gap-2"
              title={sortOrder === 'asc' ? 'Sort Z-A' : 'Sort A-Z'}
            >
              <span>Name</span>
              <span>{sortOrder === 'asc' ? '↓' : '↑'}</span>
            </button>
          </div>
          
          <div className="space-y-2">
            {sortedPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between bg-slate-900 rounded p-3"
              >
                <span>
                  {player.number && `#${player.number} `}
                  {player.name}
                </span>
                <button
                  onClick={() => onRemovePlayer(player.id)}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                >
                  Remove
                </button>
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