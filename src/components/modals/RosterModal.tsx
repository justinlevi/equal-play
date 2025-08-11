import React, { useState } from 'react';
import { Player } from '../../types/index';

interface RosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onAddPlayer: (name: string, number: string) => void;
  onRemovePlayer: (id: string) => void;
}

export const RosterModal: React.FC<RosterModalProps> = ({
  isOpen,
  onClose,
  players,
  onAddPlayer,
  onRemovePlayer,
}) => {
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (newName.trim()) {
      onAddPlayer(newName, newNumber);
      setNewName('');
      setNewNumber('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Manage Roster</h2>
        
        <div className="mb-4">
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
          
          <div className="space-y-2">
            {players.map((player) => (
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