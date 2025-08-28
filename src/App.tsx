import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/Header';
import { PlayerCard } from './components/PlayerCard';
import { SubstitutionSuggestions } from './components/SubstitutionSuggestions';
import { SettingsModal } from './components/modals/SettingsModal';
import { RosterModal } from './components/modals/RosterModal';
import { ReportModal } from './components/modals/ReportModal';
import { PlayerDetailsModal } from './components/modals/PlayerDetailsModal';
import { SubstitutionStagingModal } from './components/modals/SubstitutionStagingModal';
import { Player, CustomStat, SubstitutionSuggestion, Position, StagedSubstitution } from './types/index';
import { calculateMinutesStats } from './utils/stats';
import { formatTime } from './utils/time';
import { useLocalStorage } from './hooks/useLocalStorage';

const DEFAULT_CUSTOM_STATS: CustomStat[] = [
  { id: 'goals', name: 'Goals', icon: '⚽', enabled: true },
  { id: 'assists', name: 'Assists', icon: '🅰️', enabled: true },
  { id: 'saves', name: 'Saves', icon: '🧤', enabled: true },
  { id: 'shots', name: 'Shots', icon: '🎯', enabled: false },
  { id: 'steals', name: 'Steals', icon: '🦶', enabled: false },
  { id: 'blocks', name: 'Blocks', icon: '🛡️', enabled: false },
];

function App() {
  // Settings
  const [onFieldTarget, setOnFieldTarget] = useLocalStorage('ep.onFieldTarget', 7);
  const [halfMinutes, setHalfMinutes] = useLocalStorage('ep.halfMinutes', 25);
  const [customStats, setCustomStats] = useLocalStorage('ep.customStats', DEFAULT_CUSTOM_STATS);
  const [maxSubSuggestions, setMaxSubSuggestions] = useLocalStorage('ep.maxSubSuggestions', 5);
  
  // Game Score
  const [homeScore, setHomeScore] = useLocalStorage('ep.homeScore', 0);
  const [awayScore, setAwayScore] = useLocalStorage('ep.awayScore', 0);
  const [homeTeamName, setHomeTeamName] = useLocalStorage('ep.homeTeamName', 'Home');
  const [awayTeamName, setAwayTeamName] = useLocalStorage('ep.awayTeamName', 'Away');
  
  // Players
  const [players, setPlayers] = useLocalStorage<Player[]>('ep.players', []);
  
  // Match State
  const [running, setRunning] = useLocalStorage('ep.running', false);
  const [matchSeconds, setMatchSeconds] = useLocalStorage('ep.matchSeconds', 0);
  const [matchStartTime, setMatchStartTime] = useLocalStorage<number | null>('ep.matchStartTime', null);
  
  // Staging
  const [stagedSubs, setStagedSubs] = useLocalStorage<StagedSubstitution[]>('ep.stagedSubs', []);
  
  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showSubStaging, setShowSubStaging] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [onFieldSortOrder, setOnFieldSortOrder] = useLocalStorage<'asc' | 'desc' | 'none'>('ep.onFieldSort', 'none');
  const [benchSortOrder, setBenchSortOrder] = useLocalStorage<'asc' | 'desc' | 'none'>('ep.benchSort', 'none');
  
  const tickRef = useRef<number | null>(null);

  // Derived values
  const onFieldPlayersUnsorted = players.filter(p => p.on);
  const benchPlayersUnsorted = players.filter(p => !p.on);
  
  // Apply sorting if needed
  const onFieldPlayers = useMemo(() => {
    if (onFieldSortOrder === 'none') return onFieldPlayersUnsorted;
    return [...onFieldPlayersUnsorted].sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return onFieldSortOrder === 'asc' ? comparison : -comparison;
    });
  }, [onFieldPlayersUnsorted, onFieldSortOrder]);
  
  const benchPlayers = useMemo(() => {
    if (benchSortOrder === 'none') return benchPlayersUnsorted;
    return [...benchPlayersUnsorted].sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return benchSortOrder === 'asc' ? comparison : -comparison;
    });
  }, [benchPlayersUnsorted, benchSortOrder]);
  
  const enabledStats = customStats.filter(s => s.enabled);
  const minutesStats = useMemo(() => calculateMinutesStats(players), [players]);

  // Handle page refresh - restore timer state
  useEffect(() => {
    if (running && matchStartTime) {
      const elapsed = Math.floor((Date.now() - matchStartTime) / 1000);
      const storedSeconds = matchSeconds;
      if (elapsed > storedSeconds) {
        // Page was refreshed while timer was running
        setMatchSeconds(elapsed);
        // Update player seconds based on the difference
        const diff = elapsed - storedSeconds;
        setPlayers(prev =>
          prev.map(p => (p.on ? { ...p, seconds: (p.seconds || 0) + diff } : p))
        );
      }
    }
  }, []); // Run only on mount

  // Timer effect
  useEffect(() => {
    if (running) {
      if (!matchStartTime) {
        // Starting timer for the first time or after a stop
        setMatchStartTime(Date.now() - (matchSeconds * 1000));
      }
      
      tickRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - (matchStartTime || Date.now())) / 1000);
        setMatchSeconds(elapsed);
        setPlayers(prev =>
          prev.map(p => (p.on ? { ...p, seconds: (p.seconds || 0) + 1 } : p))
        );
      }, 1000);
    } else {
      // Timer stopped
      if (matchStartTime) {
        setMatchStartTime(null);
      }
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [running, matchStartTime, setMatchSeconds, setPlayers, setMatchStartTime]);

  // Player management
  const addPlayer = (name: string, number = '') => {
    if (!name.trim()) return;
    
    // Check for duplicate names (case-insensitive)
    const normalizedName = name.trim().toLowerCase();
    setPlayers(p => {
      const exists = p.some(player => player.name.toLowerCase() === normalizedName);
      if (exists) return p; // Silently ignore duplicates
      
      return [
        ...p,
        {
          id: crypto.randomUUID(),
          name: name.trim(),
          number: number.trim(),
          seconds: 0,
          on: false,
          stats: {},
        },
      ];
    });
  };

  const addMultiplePlayers = (names: string[]) => {
    setPlayers(p => {
      // Get existing player names (normalized)
      const existingNames = new Set(p.map(player => player.name.toLowerCase()));
      
      // Filter out duplicates and create new players
      const newPlayers = names
        .filter(name => name.trim())
        .filter(name => !existingNames.has(name.trim().toLowerCase())) // Skip duplicates
        .map(name => ({
          id: crypto.randomUUID(),
          name: name.trim(),
          number: '',
          seconds: 0,
          on: false,
          stats: {},
        }));
      
      return [...p, ...newPlayers];
    });
  };

  const addMultiplePlayersWithPositions = (playersData: Array<{name: string; positions?: Position[]}>) => {
    setPlayers(p => {
      // Get existing player names (normalized)
      const existingNames = new Set(p.map(player => player.name.toLowerCase()));
      
      // Filter out duplicates and create new players with positions
      const newPlayers = playersData
        .filter(data => data.name.trim())
        .filter(data => !existingNames.has(data.name.trim().toLowerCase())) // Skip duplicates
        .map(data => ({
          id: crypto.randomUUID(),
          name: data.name.trim(),
          number: '',
          seconds: 0,
          on: false,
          stats: {},
          positions: data.positions,
        }));
      
      return [...p, ...newPlayers];
    });
  };

  const removePlayer = (id: string) => {
    setPlayers(p => p.filter(x => x.id !== id));
  };

  const togglePlayer = (id: string) => {
    setPlayers(p => {
      const player = p.find(x => x.id === id);
      if (!player) return p;
      
      // If turning ON, check field limit
      if (!player.on) {
        const currentOn = p.filter(x => x.on).length;
        if (currentOn >= onFieldTarget) {
          // Find player with most minutes to suggest swapping
          const maxMinPlayer = p
            .filter(x => x.on)
            .sort((a, b) => (b.seconds || 0) - (a.seconds || 0))[0];
          if (
            maxMinPlayer &&
            window.confirm(`Field is full. Swap ${player.name} with ${maxMinPlayer.name}?`)
          ) {
            return p.map(x => {
              if (x.id === id) return { ...x, on: true };
              if (x.id === maxMinPlayer.id) return { ...x, on: false };
              return x;
            });
          }
          return p;
        }
      }
      
      return p.map(x => (x.id === id ? { ...x, on: !x.on } : x));
    });
  };

  const updateStat = (playerId: string, statId: string, delta: number) => {
    setPlayers(p =>
      p.map(x =>
        x.id === playerId
          ? { ...x, stats: { ...x.stats, [statId]: Math.max(0, (x.stats[statId] || 0) + delta) } }
          : x
      )
    );
  };

  const togglePosition = (playerId: string, position: Position) => {
    setPlayers(p =>
      p.map(player => {
        if (player.id !== playerId) return player;
        
        const currentPositions = player.positions || [];
        const hasPosition = currentPositions.includes(position);
        
        return {
          ...player,
          positions: hasPosition
            ? currentPositions.filter(pos => pos !== position)
            : [...currentPositions, position]
        };
      })
    );
  };

  // Stats management
  const toggleStatEnabled = (statId: string) => {
    setCustomStats(stats =>
      stats.map(s => (s.id === statId ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const addCustomStat = (name: string, icon: string) => {
    if (!name.trim()) return;
    setCustomStats(stats => [
      ...stats,
      {
        id: name.toLowerCase().replace(/\s+/g, '_'),
        name: name.trim(),
        icon: icon || '📊',
        enabled: true,
      },
    ]);
  };

  const removeCustomStat = (statId: string) => {
    // Don't allow removing core stats
    if (['goals', 'assists', 'saves'].includes(statId)) return;
    setCustomStats(stats => stats.filter(s => s.id !== statId));
  };

  // Score management
  const incrementHomeScore = () => setHomeScore(prev => prev + 1);
  const decrementHomeScore = () => setHomeScore(prev => Math.max(0, prev - 1));
  const incrementAwayScore = () => setAwayScore(prev => prev + 1);
  const decrementAwayScore = () => setAwayScore(prev => Math.max(0, prev - 1));

  // Staging management
  const addStagedSubstitution = (offPlayer: Player, onPlayer: Player) => {
    const newSub: StagedSubstitution = {
      id: crypto.randomUUID(),
      offPlayer,
      onPlayer,
      timestamp: Date.now(),
    };
    setStagedSubs(prev => [...prev, newSub]);
  };

  const removeStagedSubstitution = (id: string) => {
    setStagedSubs(prev => prev.filter(sub => sub.id !== id));
  };

  const clearAllStagedSubs = () => {
    setStagedSubs([]);
  };

  const executeAllStagedSubs = () => {
    if (stagedSubs.length === 0) return;
    
    setPlayers(p =>
      p.map(player => {
        const stagingOff = stagedSubs.find(sub => sub.offPlayer.id === player.id);
        const stagingOn = stagedSubs.find(sub => sub.onPlayer.id === player.id);
        
        if (stagingOff) return { ...player, on: false };
        if (stagingOn) return { ...player, on: true };
        return player;
      })
    );
    
    clearAllStagedSubs();
  };

  // Reset functions
  const resetMinutes = () => {
    if (window.confirm('Reset all player minutes to 00:00?')) {
      setPlayers(p => p.map(x => ({ ...x, seconds: 0 })));
      setMatchSeconds(0);
      setMatchStartTime(null);
      setRunning(false);
    }
  };

  const resetStats = () => {
    if (window.confirm('Reset all player stats (goals, assists, etc)?')) {
      setPlayers(p => p.map(x => ({ ...x, stats: {} })));
    }
  };

  const benchAll = () => setPlayers(p => p.map(x => ({ ...x, on: false })));

  // Get suggested substitutions
  const getSuggestedSubs = (): SubstitutionSuggestion[] => {
    if (onFieldPlayers.length === 0 || benchPlayers.length === 0) return [];
    
    const subs: SubstitutionSuggestion[] = [];
    const usedFieldPlayers = new Set<string>();
    const usedBenchPlayers = new Set<string>();
    
    const fieldSorted = [...onFieldPlayers].sort((a, b) => (b.seconds || 0) - (a.seconds || 0));
    const benchSorted = [...benchPlayers].sort((a, b) => (a.seconds || 0) - (b.seconds || 0));
    
    // Calculate max suggestions based on available players and user preference
    const maxSuggestions = Math.min(maxSubSuggestions, fieldSorted.length, benchSorted.length);
    
    // First pass: Position-based matching for players with significant time difference
    for (const fieldPlayer of fieldSorted) {
      if (subs.length >= maxSuggestions) break;
      if (usedFieldPlayers.has(fieldPlayer.id)) continue;
      
      const fieldPositions = fieldPlayer.positions || [];
      
      // Find best matching bench player who hasn't been used
      const matchingBenchPlayer = benchSorted.find(benchPlayer => {
        if (usedBenchPlayers.has(benchPlayer.id)) return false;
        
        const benchPositions = benchPlayer.positions || [];
        const timeDiff = (fieldPlayer.seconds || 0) - (benchPlayer.seconds || 0);
        
        // Check position compatibility
        const hasMatchingPosition = fieldPositions.length === 0 || 
                                   benchPositions.length === 0 ||
                                   fieldPositions.some(pos => benchPositions.includes(pos));
        
        return hasMatchingPosition && timeDiff > 60;
      });
      
      if (matchingBenchPlayer) {
        const diff = (fieldPlayer.seconds || 0) - (matchingBenchPlayer.seconds || 0);
        subs.push({ off: fieldPlayer, on: matchingBenchPlayer, diff });
        usedFieldPlayers.add(fieldPlayer.id);
        usedBenchPlayers.add(matchingBenchPlayer.id);
      }
    }
    
    // Second pass: Time-based matching for remaining slots
    if (subs.length < maxSuggestions) {
      for (const fieldPlayer of fieldSorted) {
        if (subs.length >= maxSuggestions) break;
        if (usedFieldPlayers.has(fieldPlayer.id)) continue;
        
        // Find any bench player with significant time difference
        const benchPlayer = benchSorted.find(bp => {
          if (usedBenchPlayers.has(bp.id)) return false;
          const timeDiff = (fieldPlayer.seconds || 0) - (bp.seconds || 0);
          return timeDiff > 60;
        });
        
        if (benchPlayer) {
          const diff = (fieldPlayer.seconds || 0) - (benchPlayer.seconds || 0);
          subs.push({ off: fieldPlayer, on: benchPlayer, diff });
          usedFieldPlayers.add(fieldPlayer.id);
          usedBenchPlayers.add(benchPlayer.id);
        }
      }
    }
    
    return subs;
  };

  const executeSwap = (offId: string, onId: string) => {
    setPlayers(p =>
      p.map(x => {
        if (x.id === offId) return { ...x, on: false };
        if (x.id === onId) return { ...x, on: true };
        return x;
      })
    );
  };

  const suggestedSubs = getSuggestedSubs();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-32">
      <Header
        matchSeconds={matchSeconds}
        onFieldCount={onFieldPlayers.length}
        onFieldTarget={onFieldTarget}
        running={running}
        onToggleRunning={() => setRunning(!running)}
        onShowSettings={() => setShowSettings(true)}
        onShowRoster={() => setShowRoster(true)}
        onShowSubStaging={() => setShowSubStaging(true)}
        stagedSubsCount={stagedSubs.length}
        homeScore={homeScore}
        awayScore={awayScore}
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        onIncrementHomeScore={incrementHomeScore}
        onDecrementHomeScore={decrementHomeScore}
        onIncrementAwayScore={incrementAwayScore}
        onDecrementAwayScore={decrementAwayScore}
      />

      <main className="max-w-7xl mx-auto p-4">
        {/* Staged Substitutions Execution */}
        {stagedSubs.length > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-yellow-400 font-bold">⚡ Ready to Execute</h3>
              <button
                onClick={clearAllStagedSubs}
                className="text-yellow-400 hover:text-yellow-300 text-sm"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-2 mb-4">
              {stagedSubs.map((sub) => (
                <div key={sub.id} className="bg-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-red-400">↓ {sub.offPlayer.name}</span>
                        <span className="text-xs text-slate-400">
                          ({formatTime(sub.offPlayer.seconds || 0)})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">↑ {sub.onPlayer.name}</span>
                        <span className="text-xs text-slate-400">
                          ({formatTime(sub.onPlayer.seconds || 0)})
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeStagedSubstitution(sub.id)}
                      className="text-red-400 hover:text-red-300 font-bold"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={executeAllStagedSubs}
              className="w-full px-6 py-4 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-bold text-xl text-black transition-colors"
            >
              ⚡ Execute {stagedSubs.length} Staged Substitution{stagedSubs.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}

        <SubstitutionSuggestions
          suggestions={suggestedSubs}
          onExecuteSwap={executeSwap}
        />

        {/* On Field Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-green-400">
              ⚽ On Field ({onFieldPlayers.length}/{onFieldTarget})
            </h2>
            {onFieldPlayers.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (onFieldSortOrder === 'none') setOnFieldSortOrder('asc');
                    else if (onFieldSortOrder === 'asc') setOnFieldSortOrder('desc');
                    else setOnFieldSortOrder('none');
                  }}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm flex items-center gap-1"
                  title={onFieldSortOrder === 'none' ? 'Sort A-Z' : onFieldSortOrder === 'asc' ? 'Sort Z-A' : 'Clear sort'}
                >
                  <span>Name</span>
                  {onFieldSortOrder === 'asc' && <span>↓</span>}
                  {onFieldSortOrder === 'desc' && <span>↑</span>}
                  {onFieldSortOrder === 'none' && <span className="opacity-50">⇅</span>}
                </button>
                <button
                  onClick={benchAll}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm"
                >
                  Bench All
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {onFieldPlayers.map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                enabledStats={enabledStats}
                onToggle={togglePlayer}
                onStatUpdate={updateStat}
                onSelectPlayer={setSelectedPlayer}
              />
            ))}
          </div>
        </section>

        {/* Bench Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-400">
              🪑 Bench ({benchPlayers.length})
            </h2>
            {benchPlayers.length > 0 && (
              <button
                onClick={() => {
                  if (benchSortOrder === 'none') setBenchSortOrder('asc');
                  else if (benchSortOrder === 'asc') setBenchSortOrder('desc');
                  else setBenchSortOrder('none');
                }}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm flex items-center gap-1"
                title={benchSortOrder === 'none' ? 'Sort A-Z' : benchSortOrder === 'asc' ? 'Sort Z-A' : 'Clear sort'}
              >
                <span>Name</span>
                {benchSortOrder === 'asc' && <span>↓</span>}
                {benchSortOrder === 'desc' && <span>↑</span>}
                {benchSortOrder === 'none' && <span className="opacity-50">⇅</span>}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {benchPlayers.map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                enabledStats={enabledStats}
                onToggle={togglePlayer}
                onStatUpdate={updateStat}
                onSelectPlayer={setSelectedPlayer}
              />
            ))}
          </div>
        </section>

        {/* Quick Add Section */}
        {players.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">No players added yet.</p>
            <button
              onClick={() => setShowRoster(true)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold"
            >
              Add Players
            </button>
          </div>
        )}
      </main>

      {/* Fixed bottom report button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-800 border-t border-slate-700">
        <button
          onClick={() => setShowReport(true)}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg flex items-center justify-center gap-2"
        >
          <span>📊</span>
          <span>View Game Report</span>
        </button>
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onFieldTarget={onFieldTarget}
        setOnFieldTarget={setOnFieldTarget}
        halfMinutes={halfMinutes}
        setHalfMinutes={setHalfMinutes}
        maxSubSuggestions={maxSubSuggestions}
        setMaxSubSuggestions={setMaxSubSuggestions}
        homeTeamName={homeTeamName}
        setHomeTeamName={setHomeTeamName}
        awayTeamName={awayTeamName}
        setAwayTeamName={setAwayTeamName}
        customStats={customStats}
        onToggleStatEnabled={toggleStatEnabled}
        onAddCustomStat={addCustomStat}
        onRemoveCustomStat={removeCustomStat}
        onResetMinutes={resetMinutes}
        onResetStats={resetStats}
      />

      <RosterModal
        isOpen={showRoster}
        onClose={() => setShowRoster(false)}
        players={players}
        onAddPlayer={addPlayer}
        onAddMultiplePlayers={addMultiplePlayers}
        onAddMultiplePlayersWithPositions={addMultiplePlayersWithPositions}
        onRemovePlayer={removePlayer}
        onPositionToggle={togglePosition}
      />

      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        players={players}
        matchSeconds={matchSeconds}
        enabledStats={enabledStats}
        minutesStats={minutesStats}
      />

      <PlayerDetailsModal
        player={selectedPlayer ? players.find(p => p.id === selectedPlayer.id) || null : null}
        isOpen={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        enabledStats={enabledStats}
        onStatUpdate={updateStat}
        onPositionToggle={togglePosition}
      />

      <SubstitutionStagingModal
        isOpen={showSubStaging}
        onClose={() => setShowSubStaging(false)}
        players={players}
        stagedSubs={stagedSubs}
        onAddStagedSub={addStagedSubstitution}
        onRemoveStagedSub={removeStagedSubstitution}
        onClearAll={clearAllStagedSubs}
      />
    </div>
  );
}

export default App;