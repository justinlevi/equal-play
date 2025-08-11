import React, { useEffect, useMemo, useRef, useState } from "react";

export default function App() {
  // ---------- Settings ----------
  const [onFieldTarget, setOnFieldTarget] = useState(() =>
    parseInt(localStorage.getItem("ep.onFieldTarget") || "7", 10)
  );
  const [halfMinutes, setHalfMinutes] = useState(() =>
    parseInt(localStorage.getItem("ep.halfMinutes") || "25", 10)
  );
  
  // Custom stats configuration
  const [customStats, setCustomStats] = useState(() => {
    const saved = localStorage.getItem("ep.customStats");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return [
      { id: 'goals', name: 'Goals', icon: '⚽', enabled: true },
      { id: 'assists', name: 'Assists', icon: '🅰️', enabled: true },
      { id: 'saves', name: 'Saves', icon: '🧤', enabled: true },
      { id: 'shots', name: 'Shots', icon: '🎯', enabled: false },
      { id: 'steals', name: 'Steals', icon: '🦶', enabled: false },
      { id: 'blocks', name: 'Blocks', icon: '🛡️', enabled: false },
    ];
  });

  // ---------- Players ----------
  const [players, setPlayers] = useState(() => {
    const raw = localStorage.getItem("ep.players");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return parsed.map((p) => ({ 
          ...p, 
          id: p.id ?? crypto.randomUUID(),
          number: p.number || "",
          stats: p.stats || {}
        }));
      } catch (_) {}
    }
    return [];
  });

  // ---------- Match State ----------
  const [running, setRunning] = useState(false);
  const [matchSeconds, setMatchSeconds] = useState(() =>
    parseInt(localStorage.getItem("ep.matchSeconds") || "0", 10)
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const tickRef = useRef(null);

  // ---------- Derived ----------
  const targetSeconds = halfMinutes * 60;
  const onFieldPlayers = players.filter(p => p.on);
  const benchPlayers = players.filter(p => !p.on);
  const enabledStats = customStats.filter(s => s.enabled);

  const minutesStats = useMemo(() => {
    if (players.length === 0) return { median: 0, mean: 0, stdev: 0, max: 0, min: 0 };
    const secs = players.map((p) => p.seconds || 0).slice().sort((a, b) => a - b);
    const n = secs.length;
    const median = n % 2 ? secs[(n - 1) / 2] : (secs[n / 2 - 1] + secs[n / 2]) / 2;
    const mean = secs.reduce((a, b) => a + b, 0) / n;
    const stdev = Math.sqrt(
      secs.map((x) => (x - mean) ** 2).reduce((a, b) => a + b, 0) / n
    );
    return { median, mean, stdev, max: Math.max(...secs), min: Math.min(...secs) };
  }, [players]);

  // ---------- Persistence ----------
  useEffect(() => {
    localStorage.setItem("ep.players", JSON.stringify(players));
  }, [players]);
  useEffect(() => {
    localStorage.setItem("ep.onFieldTarget", String(onFieldTarget));
  }, [onFieldTarget]);
  useEffect(() => {
    localStorage.setItem("ep.halfMinutes", String(halfMinutes));
  }, [halfMinutes]);
  useEffect(() => {
    localStorage.setItem("ep.matchSeconds", String(matchSeconds));
  }, [matchSeconds]);
  useEffect(() => {
    localStorage.setItem("ep.customStats", JSON.stringify(customStats));
  }, [customStats]);

  // ---------- Timer ----------
  useEffect(() => {
    if (running) {
      tickRef.current = setInterval(() => {
        setMatchSeconds((s) => s + 1);
        setPlayers((prev) =>
          prev.map((p) => (p.on ? { ...p, seconds: (p.seconds || 0) + 1 } : p))
        );
      }, 1000);
    }
    return () => tickRef.current && clearInterval(tickRef.current);
  }, [running]);

  // ---------- Helpers ----------
  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };

  const addPlayer = (name, number = "") => {
    if (!name.trim()) return;
    setPlayers((p) => [
      ...p,
      { 
        id: crypto.randomUUID(), 
        name: name.trim(), 
        number: number.trim(), 
        seconds: 0, 
        on: false,
        stats: {}
      },
    ]);
  };

  const removePlayer = (id) => {
    setPlayers((p) => p.filter((x) => x.id !== id));
  };

  const resetMinutes = () => {
    if (window.confirm("Reset all player minutes to 00:00?")) {
      setPlayers((p) => p.map((x) => ({ ...x, seconds: 0 })));
      setMatchSeconds(0);
    }
  };

  const resetStats = () => {
    if (window.confirm("Reset all player stats (goals, assists, etc)?")) {
      setPlayers((p) => p.map((x) => ({ ...x, stats: {} })));
    }
  };

  const togglePlayer = (id) => {
    setPlayers((p) => {
      const player = p.find(x => x.id === id);
      if (!player) return p;
      
      // If turning ON, check field limit
      if (!player.on) {
        const currentOn = p.filter(x => x.on).length;
        if (currentOn >= onFieldTarget) {
          // Find player with most minutes to suggest swapping
          const maxMinPlayer = p.filter(x => x.on).sort((a,b) => (b.seconds||0) - (a.seconds||0))[0];
          if (maxMinPlayer && window.confirm(`Field is full. Swap ${player.name} with ${maxMinPlayer.name}?`)) {
            return p.map(x => {
              if (x.id === id) return { ...x, on: true };
              if (x.id === maxMinPlayer.id) return { ...x, on: false };
              return x;
            });
          }
          return p;
        }
      }
      
      return p.map(x => x.id === id ? { ...x, on: !x.on } : x);
    });
  };

  const updateStat = (playerId, statId, delta) => {
    setPlayers(p => p.map(x => 
      x.id === playerId 
        ? { ...x, stats: { ...x.stats, [statId]: Math.max(0, (x.stats[statId] || 0) + delta) }}
        : x
    ));
  };

  const toggleStatEnabled = (statId) => {
    setCustomStats(stats => stats.map(s => 
      s.id === statId ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const addCustomStat = (name, icon) => {
    if (!name.trim()) return;
    setCustomStats(stats => [...stats, {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name: name.trim(),
      icon: icon || '📊',
      enabled: true
    }]);
  };

  const removeCustomStat = (statId) => {
    // Don't allow removing the core stats
    if (['goals', 'assists', 'saves'].includes(statId)) return;
    setCustomStats(stats => stats.filter(s => s.id !== statId));
  };

  const benchAll = () => setPlayers((p) => p.map((x) => ({ ...x, on: false })));

  // Get suggested substitutions
  const getSuggestedSubs = () => {
    if (onFieldPlayers.length === 0 || benchPlayers.length === 0) return [];
    
    const subs = [];
    const fieldSorted = [...onFieldPlayers].sort((a,b) => (b.seconds||0) - (a.seconds||0));
    const benchSorted = [...benchPlayers].sort((a,b) => (a.seconds||0) - (b.seconds||0));
    
    // Suggest up to 3 swaps where field player has significantly more time
    for (let i = 0; i < Math.min(3, fieldSorted.length, benchSorted.length); i++) {
      const fieldPlayer = fieldSorted[i];
      const benchPlayer = benchSorted[i];
      const diff = (fieldPlayer.seconds || 0) - (benchPlayer.seconds || 0);
      
      if (diff > 60) { // Only suggest if >1 minute difference
        subs.push({ off: fieldPlayer, on: benchPlayer, diff });
      }
    }
    
    return subs;
  };

  const executeSwap = (offId, onId) => {
    setPlayers(p => p.map(x => {
      if (x.id === offId) return { ...x, on: false };
      if (x.id === onId) return { ...x, on: true };
      return x;
    }));
  };

  // Generate report text
  const generateReport = () => {
    const sortedByMinutes = [...players].sort((a, b) => (b.seconds || 0) - (a.seconds || 0));
    let report = `GAME REPORT\n`;
    report += `Match Time: ${fmt(matchSeconds)}\n`;
    report += `Date: ${new Date().toLocaleDateString()}\n\n`;
    
    report += `PLAYING TIME SUMMARY\n`;
    report += `${'='.repeat(30)}\n`;
    sortedByMinutes.forEach(p => {
      report += `${p.number ? '#' + p.number + ' ' : ''}${p.name}: ${fmt(p.seconds || 0)}\n`;
    });
    
    report += `\nSTATS SUMMARY\n`;
    report += `${'='.repeat(30)}\n`;
    
    enabledStats.forEach(stat => {
      const leaders = players.filter(p => (p.stats[stat.id] || 0) > 0).sort((a, b) => (b.stats[stat.id] || 0) - (a.stats[stat.id] || 0));
      if (leaders.length > 0) {
        report += `\n${stat.name.toUpperCase()}:\n`;
        leaders.forEach(p => {
          report += `  ${p.name}: ${p.stats[stat.id]}\n`;
        });
      }
    });
    
    report += `\nTEAM TOTALS:\n`;
    enabledStats.forEach(stat => {
      const total = players.reduce((sum, p) => sum + (p.stats[stat.id] || 0), 0);
      if (total > 0) {
        report += `  ${stat.name}: ${total}\n`;
      }
    });
    
    report += `\nFAIRNESS METRICS\n`;
    report += `${'='.repeat(30)}\n`;
    report += `Average Playing Time: ${fmt(minutesStats.mean)}\n`;
    report += `Playing Time Range: ${fmt(minutesStats.min)} - ${fmt(minutesStats.max)}\n`;
    report += `Standard Deviation: ${Math.round(minutesStats.stdev)}s\n`;
    report += `Fairness Rating: ${minutesStats.stdev < 60 ? 'Excellent' : minutesStats.stdev < 120 ? 'Good' : 'Needs Improvement'}\n`;
    
    return report;
  };

  const copyReport = () => {
    const report = generateReport();
    navigator.clipboard.writeText(report);
    alert('Report copied to clipboard!');
  };

  const exportCSV = () => {
    const headers = ['Number', 'Name', 'Minutes'];
    enabledStats.forEach(stat => headers.push(stat.name));
    
    const rows = [headers];
    
    players.forEach(p => {
      const row = [
        p.number || '',
        p.name,
        fmt(p.seconds || 0)
      ];
      enabledStats.forEach(stat => {
        row.push(String(p.stats[stat.id] || 0));
      });
      rows.push(row);
    });
    
    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const suggestedSubs = getSuggestedSubs();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold hidden sm:block">EqualPlay</h1>
            <div className="flex items-center gap-3 text-sm">
              <div className="bg-slate-900 px-3 py-1.5 rounded-lg">
                <span className="opacity-70">Match:</span>
                <span className="font-mono font-bold ml-2 text-lg">{fmt(matchSeconds)}</span>
              </div>
              <div className="bg-slate-900 px-3 py-1.5 rounded-lg">
                <span className="opacity-70">Field:</span>
                <span className={`font-bold ml-2 text-lg ${onFieldPlayers.length !== onFieldTarget ? 'text-yellow-400' : ''}`}>
                  {onFieldPlayers.length}/{onFieldTarget}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRunning(!running)}
              className={`px-4 py-2 rounded-lg font-bold text-lg ${
                running ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {running ? "⏸ PAUSE" : "▶ START"}
            </button>
            <button
              onClick={() => setShowReport(true)}
              className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
              title="View Report"
            >
              📊
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600"
              title="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-slate-800 border-b border-slate-700 p-4">
          <div className="max-w-7xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            {/* Basic Settings */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="text-xs opacity-70">Players on Field</label>
                <input
                  type="number"
                  value={onFieldTarget}
                  onChange={(e) => setOnFieldTarget(parseInt(e.target.value || "7"))}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5"
                />
              </div>
              <div>
                <label className="text-xs opacity-70">Half Length (min)</label>
                <input
                  type="number"
                  value={halfMinutes}
                  onChange={(e) => setHalfMinutes(parseInt(e.target.value || "25"))}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5"
                />
              </div>
              <button
                onClick={() => setShowRoster(true)}
                className="bg-slate-700 hover:bg-slate-600 rounded px-3 py-1.5 self-end"
              >
                📝 Edit Roster
              </button>
              <button
                onClick={resetMinutes}
                className="bg-slate-700 hover:bg-slate-600 rounded px-3 py-1.5 self-end"
              >
                🔄 Reset Time
              </button>
              <button
                onClick={resetStats}
                className="bg-slate-700 hover:bg-slate-600 rounded px-3 py-1.5 self-end"
              >
                🎯 Reset Stats
              </button>
            </div>
            
            {/* Stats Configuration */}
            <div className="border-t border-slate-700 pt-3">
              <h3 className="text-sm font-bold mb-2">Stats to Track</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {customStats.map(stat => (
                  <div key={stat.id} className="flex items-center gap-2 bg-slate-900 rounded p-2">
                    <input
                      type="checkbox"
                      checked={stat.enabled}
                      onChange={() => toggleStatEnabled(stat.id)}
                      disabled={['goals', 'assists', 'saves'].includes(stat.id)}
                      className="rounded"
                    />
                    <span className="text-lg">{stat.icon}</span>
                    <span className="text-sm flex-1">{stat.name}</span>
                    {!['goals', 'assists', 'saves'].includes(stat.id) && (
                      <button
                        onClick={() => removeCustomStat(stat.id)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-1 bg-slate-900 rounded p-2">
                  <input
                    id="newStatIcon"
                    placeholder="📊"
                    className="w-10 bg-slate-800 rounded px-1 py-0.5 text-center"
                    defaultValue="📊"
                  />
                  <input
                    id="newStatName"
                    placeholder="Add custom..."
                    className="flex-1 bg-slate-800 rounded px-2 py-0.5 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const nameInput = document.getElementById('newStatName');
                        const iconInput = document.getElementById('newStatIcon');
                        addCustomStat(nameInput.value, iconInput.value);
                        nameInput.value = '';
                        iconInput.value = '📊';
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-900 rounded p-2">
                <span className="opacity-70">Avg:</span> <span className="font-mono">{fmt(minutesStats.mean)}</span>
              </div>
              <div className="bg-slate-900 rounded p-2">
                <span className="opacity-70">Range:</span> <span className="font-mono">{fmt(minutesStats.min)}-{fmt(minutesStats.max)}</span>
              </div>
              <div className="bg-slate-900 rounded p-2">
                <span className="opacity-70">Target/player:</span> <span className="font-mono">{fmt(targetSeconds)}</span>
              </div>
              <div className="bg-slate-900 rounded p-2">
                <span className="opacity-70">Fairness:</span> <span className={`font-bold ${minutesStats.stdev < 60 ? 'text-green-400' : minutesStats.stdev < 120 ? 'text-yellow-400' : 'text-red-400'}`}>{Math.round(minutesStats.stdev)}s</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roster Editor Modal */}
      {showRoster && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Roster Management</h2>
              <button onClick={() => setShowRoster(false)} className="text-slate-400 hover:text-white text-2xl">✕</button>
            </div>
            
            <div className="p-4 grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-bold mb-2">Current Roster</h3>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {players.length === 0 && (
                    <p className="text-slate-400 text-sm p-2">No players added yet</p>
                  )}
                  {players.map(p => (
                    <div key={p.id} className="flex items-center gap-2 bg-slate-900 rounded p-2">
                      <input
                        value={p.number}
                        onChange={(e) => setPlayers(prev => prev.map(x => x.id === p.id ? {...x, number: e.target.value} : x))}
                        placeholder="#"
                        className="w-12 bg-slate-800 rounded px-2 py-1 text-center"
                      />
                      <input
                        value={p.name}
                        onChange={(e) => setPlayers(prev => prev.map(x => x.id === p.id ? {...x, name: e.target.value} : x))}
                        className="flex-1 bg-slate-800 rounded px-2 py-1"
                      />
                      <button
                        onClick={() => removePlayer(p.id)}
                        className="text-red-400 hover:text-red-300 px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-bold mb-2">Add Players</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      id="addNumber"
                      placeholder="#"
                      className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1.5"
                    />
                    <input
                      id="addName"
                      placeholder="Player name"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const nameInput = document.getElementById('addName');
                          const numInput = document.getElementById('addNumber');
                          addPlayer(nameInput.value, numInput.value);
                          nameInput.value = '';
                          numInput.value = '';
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const nameInput = document.getElementById('addName');
                        const numInput = document.getElementById('addNumber');
                        addPlayer(nameInput.value, numInput.value);
                        nameInput.value = '';
                        numInput.value = '';
                      }}
                      className="bg-green-600 hover:bg-green-700 rounded px-4 py-1.5"
                    >
                      Add
                    </button>
                  </div>
                  
                  <div>
                    <label className="text-xs opacity-70">Bulk add (one per line, format: "# Name" or just "Name")</label>
                    <textarea
                      id="bulkAdd"
                      rows={4}
                      className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5"
                      placeholder="7 Emma&#10;10 Liam&#10;3 Olivia&#10;Noah"
                    />
                    <button
                      onClick={() => {
                        const textarea = document.getElementById('bulkAdd');
                        const lines = textarea.value.split('\n');
                        lines.forEach(line => {
                          const match = line.match(/^(\d+)?\s*(.+)$/);
                          if (match && match[2]) {
                            addPlayer(match[2].trim(), match[1] || '');
                          }
                        });
                        textarea.value = '';
                      }}
                      className="bg-blue-600 hover:bg-blue-700 rounded px-4 py-1.5 mt-2 w-full"
                    >
                      Add All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">📊 Game Report</h2>
              <button onClick={() => setShowReport(false)} className="text-slate-400 hover:text-white text-2xl">✕</button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-900 rounded p-3">
                  <div className="text-xs opacity-70">Match Time</div>
                  <div className="text-2xl font-bold">{fmt(matchSeconds)}</div>
                </div>
                {enabledStats.map(stat => {
                  const total = players.reduce((sum, p) => sum + (p.stats[stat.id] || 0), 0);
                  return (
                    <div key={stat.id} className="bg-slate-900 rounded p-3">
                      <div className="text-xs opacity-70">Team {stat.name}</div>
                      <div className="text-2xl font-bold">{stat.icon} {total}</div>
                    </div>
                  );
                })}
                <div className="bg-slate-900 rounded p-3">
                  <div className="text-xs opacity-70">Fairness</div>
                  <div className={`text-2xl font-bold ${minutesStats.stdev < 60 ? 'text-green-400' : minutesStats.stdev < 120 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {minutesStats.stdev < 60 ? 'Excellent' : minutesStats.stdev < 120 ? 'Good' : 'Poor'}
                  </div>
                </div>
              </div>

              {/* Playing Time Table */}
              <div>
                <h3 className="text-lg font-bold mb-2">Playing Time</h3>
                <div className="bg-slate-900 rounded overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-800">
                      <tr>
                        <th className="text-left p-2">#</th>
                        <th className="text-left p-2">Name</th>
                        <th className="text-center p-2">Minutes</th>
                        <th className="text-center p-2">+/-</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...players].sort((a, b) => (b.seconds || 0) - (a.seconds || 0)).map(p => {
                        const diff = (p.seconds || 0) - minutesStats.median;
                        return (
                          <tr key={p.id} className="border-t border-slate-800">
                            <td className="p-2">{p.number || '-'}</td>
                            <td className="p-2">{p.name}</td>
                            <td className="text-center p-2 font-mono">{fmt(p.seconds || 0)}</td>
                            <td className={`text-center p-2 ${diff > 60 ? 'text-red-400' : diff < -60 ? 'text-blue-400' : 'text-slate-400'}`}>
                              {diff > 0 ? '+' : ''}{Math.round(diff/60)}m
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Stats Table */}
              {enabledStats.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-2">Player Statistics</h3>
                  <div className="bg-slate-900 rounded overflow-hidden overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-800">
                        <tr>
                          <th className="text-left p-2">#</th>
                          <th className="text-left p-2">Name</th>
                          {enabledStats.map(stat => (
                            <th key={stat.id} className="text-center p-2">{stat.icon}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {players.map(p => (
                          <tr key={p.id} className="border-t border-slate-800">
                            <td className="p-2">{p.number || '-'}</td>
                            <td className="p-2">{p.name}</td>
                            {enabledStats.map(stat => (
                              <td key={stat.id} className="text-center p-2">{p.stats[stat.id] || 0}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Export Buttons */}
              <div className="flex gap-3 justify-center pt-4">
                <button
                  onClick={copyReport}
                  className="bg-blue-600 hover:bg-blue-700 rounded px-4 py-2"
                >
                  📋 Copy Text Report
                </button>
                <button
                  onClick={exportCSV}
                  className="bg-green-600 hover:bg-green-700 rounded px-4 py-2"
                >
                  📊 Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suggested Substitutions */}
      {suggestedSubs.length > 0 && (
        <div className="bg-yellow-900/20 border-b border-yellow-700/50 p-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 overflow-x-auto">
              <span className="text-sm font-bold text-yellow-400 whitespace-nowrap">Quick Subs:</span>
              {suggestedSubs.map(sub => (
                <button
                  key={`${sub.off.id}-${sub.on.id}`}
                  onClick={() => executeSwap(sub.off.id, sub.on.id)}
                  className="bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap flex items-center gap-2"
                >
                  <span className="font-bold">{sub.off.number || '?'} {sub.off.name}</span>
                  <span>↔</span>
                  <span className="font-bold">{sub.on.number || '?'} {sub.on.name}</span>
                  <span className="text-xs opacity-70">({Math.round(sub.diff/60)}m diff)</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Field/Bench Layout */}
      <main className="max-w-7xl mx-auto p-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* On Field */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-green-400">⚽ ON FIELD ({onFieldPlayers.length})</h2>
              {onFieldPlayers.length > onFieldTarget && (
                <span className="text-sm bg-red-600 px-2 py-1 rounded">Too many!</span>
              )}
            </div>
            <div className="space-y-2">
              {onFieldPlayers.length === 0 && (
                <div className="text-slate-500 text-center py-8 border-2 border-dashed border-slate-700 rounded-lg">
                  Tap bench players to add to field
                </div>
              )}
              {onFieldPlayers
                .sort((a,b) => (b.seconds || 0) - (a.seconds || 0))
                .map(player => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    median={minutesStats.median}
                    onClick={() => togglePlayer(player.id)}
                    onSelect={() => setSelectedPlayer(player)}
                    isOn={true}
                    enabledStats={enabledStats}
                  />
                ))}
            </div>
          </div>

          {/* Bench */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-slate-400">🪑 BENCH ({benchPlayers.length})</h2>
            </div>
            <div className="space-y-2">
              {benchPlayers.length === 0 && players.length > 0 && (
                <div className="text-slate-500 text-center py-8 border-2 border-dashed border-slate-700 rounded-lg">
                  All players on field
                </div>
              )}
              {benchPlayers
                .sort((a,b) => (a.seconds || 0) - (b.seconds || 0))
                .map(player => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    median={minutesStats.median}
                    onClick={() => togglePlayer(player.id)}
                    onSelect={() => setSelectedPlayer(player)}
                    isOn={false}
                    enabledStats={enabledStats}
                  />
                ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {players.length > 0 && (
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={benchAll}
              className="bg-slate-700 hover:bg-slate-600 rounded-lg px-4 py-2"
            >
              Bench All Players
            </button>
          </div>
        )}

        {/* Initial Setup Message */}
        {players.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-slate-400 mb-4">No players added yet</p>
            <button
              onClick={() => setShowRoster(true)}
              className="bg-blue-600 hover:bg-blue-700 rounded-lg px-6 py-3 text-lg font-bold"
            >
              Add Players to Get Started
            </button>
          </div>
        )}
      </main>

      {/* Stats Bar - Fixed at bottom */}
      {selectedPlayer && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-4 z-30">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold">
                  {selectedPlayer.number && `#${selectedPlayer.number} `}
                  {selectedPlayer.name}
                </h3>
                <span className="text-sm opacity-70">Tap stats to update</span>
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {enabledStats.map(stat => (
                <StatButton
                  key={stat.id}
                  label={stat.name}
                  icon={stat.icon}
                  value={selectedPlayer.stats[stat.id] || 0}
                  onInc={() => updateStat(selectedPlayer.id, stat.id, 1)}
                  onDec={() => updateStat(selectedPlayer.id, stat.id, -1)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerCard({ player, median, onClick, onSelect, isOn, enabledStats }) {
  const diff = (player.seconds || 0) - median;
  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${String(ss).padStart(2, "0")}`;
  };

  // Color coding based on time difference from median
  let bgColor = "bg-slate-800";
  let borderColor = "border-slate-700";
  let timeColor = "";
  
  if (isOn) {
    bgColor = "bg-green-900/20";
    borderColor = "border-green-700";
  }
  
  if (Math.abs(diff) > 180) {
    timeColor = diff > 0 ? "text-red-400" : "text-blue-400";
    borderColor = diff > 0 ? "border-red-600" : "border-blue-600";
  } else if (Math.abs(diff) > 90) {
    timeColor = diff > 0 ? "text-yellow-400" : "text-green-400";
    borderColor = diff > 0 ? "border-yellow-600" : "border-green-600";
  }

  const hasStats = enabledStats.some(stat => player.stats && player.stats[stat.id] > 0);

  return (
    <div className={`${bgColor} border-2 ${borderColor} rounded-lg overflow-hidden transition-all`}>
      <div
        onClick={onClick}
        className="p-3 cursor-pointer hover:brightness-110"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {player.number && (
              <div className="text-2xl font-bold w-10 text-center opacity-70">
                {player.number}
              </div>
            )}
            <div className="flex-1">
              <div className="font-bold text-lg flex items-center gap-2">
                {player.name}
                {hasStats && (
                  <div className="flex gap-1">
                    {enabledStats.map(stat => {
                      const value = player.stats[stat.id] || 0;
                      if (value > 0) {
                        return (
                          <span key={stat.id} className="text-xs bg-slate-700 px-1.5 py-0.5 rounded">
                            {stat.icon} {value}
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
              <div className={`text-sm ${timeColor} font-mono`}>
                {fmt(player.seconds || 0)}
                {diff !== 0 && (
                  <span className="ml-2 text-xs opacity-70">
                    ({diff > 0 ? '+' : ''}{Math.round(diff/60)}m)
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="p-2 hover:bg-slate-700/50 rounded transition-colors"
              title="Track stats"
            >
              📈
            </button>
            <div className="text-3xl opacity-30">
              {isOn ? "⚽" : "🪑"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatButton({ label, icon, value, onInc, onDec }) {
  return (
    <div className="bg-slate-900 rounded-lg p-3">
      <div className="text-xs opacity-70 text-center mb-1">{label}</div>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onDec}
          className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center text-lg font-bold"
        >
          -
        </button>
        <div className="w-12 text-center text-xl font-bold">
          {value}
        </div>
        <button
          onClick={onInc}
          className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center text-lg font-bold"
        >
          +
        </button>
      </div>
      <div className="text-center mt-1 text-2xl">{icon}</div>
    </div>
  );
}