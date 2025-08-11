import { Player, CustomStat, MinutesStats } from '../types/index';
import { formatTime } from './time';

export const generateReport = (
  players: Player[],
  matchSeconds: number,
  enabledStats: CustomStat[],
  minutesStats: MinutesStats
): string => {
  const sortedByMinutes = [...players].sort((a, b) => (b.seconds || 0) - (a.seconds || 0));
  let report = `GAME REPORT\n`;
  report += `Match Time: ${formatTime(matchSeconds)}\n`;
  report += `Date: ${new Date().toLocaleDateString()}\n\n`;
  
  report += `PLAYING TIME SUMMARY\n`;
  report += `${'='.repeat(30)}\n`;
  sortedByMinutes.forEach(p => {
    report += `${p.number ? '#' + p.number + ' ' : ''}${p.name}: ${formatTime(p.seconds || 0)}\n`;
  });
  
  report += `\nSTATS SUMMARY\n`;
  report += `${'='.repeat(30)}\n`;
  
  enabledStats.forEach(stat => {
    const leaders = players
      .filter(p => (p.stats[stat.id] || 0) > 0)
      .sort((a, b) => (b.stats[stat.id] || 0) - (a.stats[stat.id] || 0));
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
  report += `Average Playing Time: ${formatTime(minutesStats.mean)}\n`;
  report += `Playing Time Range: ${formatTime(minutesStats.min)} - ${formatTime(minutesStats.max)}\n`;
  report += `Standard Deviation: ${Math.round(minutesStats.stdev)}s\n`;
  report += `Fairness Rating: ${
    minutesStats.stdev < 60 
      ? 'Excellent' 
      : minutesStats.stdev < 120 
      ? 'Good' 
      : 'Needs Improvement'
  }\n`;
  
  return report;
};

export const exportCSV = (players: Player[], enabledStats: CustomStat[]): void => {
  const headers = ['Number', 'Name', 'Minutes'];
  enabledStats.forEach(stat => headers.push(stat.name));
  
  const rows = [headers];
  
  players.forEach(p => {
    const row = [
      p.number || '',
      p.name,
      formatTime(p.seconds || 0)
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