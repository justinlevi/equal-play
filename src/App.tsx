import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/Header';
import { PlayerCard } from './components/PlayerCard';
import { SubstitutionSuggestions } from './components/SubstitutionSuggestions';
import { SettingsModal } from './components/modals/SettingsModal';
import { RosterModal } from './components/modals/RosterModal';
import { ReportModal } from './components/modals/ReportModal';
import { PlayerDetailsModal } from './components/modals/PlayerDetailsModal';
import { Player, CustomStat, SubstitutionSuggestion } from './types/index';
import { calculateMinutesStats } from './utils/stats';
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
  
  // Players
  const [players, setPlayers] = useLocalStorage<Player[]>('ep.players', []);
  
  // Match State
  const [running, setRunning] = useState(false);
  const [matchSeconds, setMatchSeconds] = useLocalStorage('ep.matchSeconds', 0);
  
  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  // Derived values
  const onFieldPlayers = players.filter(p => p.on);
  const benchPlayers = players.filter(p => !p.on);
  const enabledStats = customStats.filter(s => s.enabled);
  const minutesStats = useMemo(() => calculateMinutesStats(players), [players]);

  // Timer effect
  useEffect(() => {
    if (running) {
      tickRef.current = setInterval(() => {
        setMatchSeconds(s => s + 1);
        setPlayers(prev =>
          prev.map(p => (p.on ? { ...p, seconds: (p.seconds || 0) + 1 } : p))
        );
      }, 1000);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [running, setMatchSeconds, setPlayers]);

  // Player management
  const addPlayer = (name: string, number = '') => {
    if (!name.trim()) return;
    setPlayers(p => [
      ...p,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        number: number.trim(),
        seconds: 0,
        on: false,
        stats: {},
      },
    ]);
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

  // Reset functions
  const resetMinutes = () => {
    if (window.confirm('Reset all player minutes to 00:00?')) {
      setPlayers(p => p.map(x => ({ ...x, seconds: 0 })));
      setMatchSeconds(0);
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
    const fieldSorted = [...onFieldPlayers].sort((a, b) => (b.seconds || 0) - (a.seconds || 0));
    const benchSorted = [...benchPlayers].sort((a, b) => (a.seconds || 0) - (b.seconds || 0));
    
    // Suggest up to 3 swaps where field player has significantly more time
    for (let i = 0; i < Math.min(3, fieldSorted.length, benchSorted.length); i++) {
      const fieldPlayer = fieldSorted[i];
      const benchPlayer = benchSorted[i];
      const diff = (fieldPlayer.seconds || 0) - (benchPlayer.seconds || 0);
      
      if (diff > 60) {
        // Only suggest if >1 minute difference
        subs.push({ off: fieldPlayer, on: benchPlayer, diff });
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
      />

      <main className="max-w-7xl mx-auto p-4">
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
              <button
                onClick={benchAll}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm"
              >
                Bench All
              </button>
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
          <h2 className="text-lg font-bold text-slate-400 mb-4">
            🪑 Bench ({benchPlayers.length})
          </h2>
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
        onRemovePlayer={removePlayer}
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
        player={selectedPlayer}
        isOpen={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        enabledStats={enabledStats}
        onStatUpdate={updateStat}
      />
    </div>
  );
}

export default App;