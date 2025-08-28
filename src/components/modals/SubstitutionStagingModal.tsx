import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, useSensor, useSensors, TouchSensor, MouseSensor, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core';
import { Player, StagedSubstitution } from '../../types/index';
import { formatTime } from '../../utils/time';
import { POSITION_CONFIG } from '../../utils/positions';

interface SubstitutionStagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  stagedSubs: StagedSubstitution[];
  onAddStagedSub: (offPlayer: Player, onPlayer: Player) => void;
  onRemoveStagedSub: (id: string) => void;
  onClearAll: () => void;
}

export const SubstitutionStagingModal: React.FC<SubstitutionStagingModalProps> = ({
  isOpen,
  onClose,
  players,
  stagedSubs,
  onAddStagedSub,
  onRemoveStagedSub,
  onClearAll,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  if (!isOpen) return null;

  const onFieldPlayers = players.filter(p => p.on);
  const benchPlayers = players.filter(p => !p.on);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const benchPlayer = benchPlayers.find(p => p.id === active.id);
    const fieldPlayer = onFieldPlayers.find(p => p.id === over.id);

    if (benchPlayer && fieldPlayer) {
      // Check if this substitution is already staged
      const existingStaging = stagedSubs.find(
        sub => sub.offPlayer.id === fieldPlayer.id && sub.onPlayer.id === benchPlayer.id
      );
      
      if (!existingStaging) {
        onAddStagedSub(fieldPlayer, benchPlayer);
      }
    }
  };

  const getStagedPlayer = (playerId: string) => {
    return stagedSubs.find(sub => sub.offPlayer.id === playerId || sub.onPlayer.id === playerId);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🔄 Stage Substitutions</h2>
          <div className="flex items-center gap-3">
            {stagedSubs.length > 0 && (
              <button
                onClick={onClearAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold"
              >
                Clear All ({stagedSubs.length})
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
            >
              ✅ Done Staging
            </button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Field Players */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-bold text-green-400 mb-4">
                ⚽ On Field ({onFieldPlayers.length}) - Drop Zone
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[200px] p-4 border-2 border-dashed border-slate-600 rounded-lg">
                {onFieldPlayers.map(player => (
                  <FieldPlayerCard
                    key={player.id}
                    player={player}
                    staged={getStagedPlayer(player.id)}
                  />
                ))}
              </div>
            </div>

            {/* Bench Players */}
            <div>
              <h3 className="text-lg font-bold text-slate-400 mb-4">
                🪑 Bench ({benchPlayers.length}) - Drag Players
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {benchPlayers.map(player => (
                  <BenchPlayerCard
                    key={player.id}
                    player={player}
                    staged={getStagedPlayer(player.id)}
                    isDragging={activeId === player.id}
                  />
                ))}
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeId ? (
              <div className="p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-lg opacity-90">
                <div className="font-bold text-white">
                  {benchPlayers.find(p => p.id === activeId)?.name}
                </div>
                <div className="text-sm text-slate-300">Dragging to substitute...</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Staging Preview */}
        {stagedSubs.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-700">
            <h3 className="text-lg font-bold text-yellow-400 mb-4">
              📋 Staged Substitutions ({stagedSubs.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stagedSubs.map(sub => (
                <div key={sub.id} className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-red-400">↓ {sub.offPlayer.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-400">↑ {sub.onPlayer.name}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveStagedSub(sub.id)}
                      className="text-red-400 hover:text-red-300 font-bold"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stagedSubs.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <p className="mb-2">💡 Drag bench players onto field players to stage substitutions</p>
            <p className="text-sm opacity-70">Staged substitutions will be executed all at once when you return to the main screen</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Field Player - Droppable target
const FieldPlayerCard: React.FC<{ player: Player; staged?: StagedSubstitution }> = ({ player, staged }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: player.id,
    data: {
      type: 'field-player',
      player,
    },
  });

  return (
    <div 
      ref={setNodeRef}
      className={`p-3 rounded-lg border-2 transition-all min-h-[80px] ${
        staged 
          ? 'bg-yellow-900/30 border-yellow-500 shadow-yellow-500/20 shadow-lg' 
          : isOver
          ? 'bg-blue-900/30 border-blue-400 border-dashed shadow-blue-400/20 shadow-lg'
          : 'bg-green-900/20 border-green-600'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-white">
              {player.number && `#${player.number} `}
              {player.name}
            </span>
            {player.positions && player.positions.length > 0 && (
              <div className="flex gap-1">
                {player.positions.map(pos => {
                  const config = POSITION_CONFIG[pos];
                  return (
                    <span
                      key={pos}
                      className={`text-xs px-1.5 py-0.5 rounded ${config.bgColor} ${config.color} font-medium`}
                      title={config.fullName}
                    >
                      {config.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <div className="text-sm text-slate-300">
            Time: <span className="font-mono">{formatTime(player.seconds || 0)}</span>
          </div>
        </div>
      </div>
      {staged && (
        <div className="mt-2 text-xs text-yellow-300">
          ↔ Staged with {staged.onPlayer.name}
        </div>
      )}
      {isOver && !staged && (
        <div className="mt-2 text-xs text-blue-300">
          Drop here to stage substitution
        </div>
      )}
    </div>
  );
};

// Bench Player - Draggable item
const BenchPlayerCard: React.FC<{ player: Player; staged?: StagedSubstitution; isDragging: boolean }> = ({ player, staged, isDragging }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: player.id,
    data: {
      type: 'bench-player',
      player,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 rounded-lg border-2 transition-all cursor-grab active:cursor-grabbing touch-none min-h-[80px] ${
        isDragging 
          ? 'opacity-50 shadow-lg' 
          : staged 
          ? 'bg-yellow-900/30 border-yellow-500 shadow-yellow-500/20 shadow-lg'
          : 'bg-slate-700 border-slate-600 hover:border-slate-500 hover:bg-slate-600'
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <span className="font-bold text-white">
          {player.number && `#${player.number} `}
          {player.name}
        </span>
        {player.positions && player.positions.length > 0 && (
          <div className="flex gap-1">
            {player.positions.map(pos => {
              const config = POSITION_CONFIG[pos];
              return (
                <span
                  key={pos}
                  className={`text-xs px-1.5 py-0.5 rounded ${config.bgColor} ${config.color} font-medium`}
                  title={config.fullName}
                >
                  {config.label}
                </span>
              );
            })}
          </div>
        )}
      </div>
      <div className="text-sm text-slate-300">
        Time: <span className="font-mono">{formatTime(player.seconds || 0)}</span>
      </div>
      {staged && (
        <div className="mt-2 text-xs text-yellow-300">
          ↔ Staged with {staged.offPlayer.name}
        </div>
      )}
    </div>
  );
};