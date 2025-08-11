import { Player, MinutesStats } from '../types/index';

export const calculateMinutesStats = (players: Player[]): MinutesStats => {
  if (players.length === 0) {
    return { median: 0, mean: 0, stdev: 0, max: 0, min: 0 };
  }
  
  const secs = players.map((p) => p.seconds || 0).slice().sort((a, b) => a - b);
  const n = secs.length;
  const median = n % 2 ? secs[(n - 1) / 2] : (secs[n / 2 - 1] + secs[n / 2]) / 2;
  const mean = secs.reduce((a, b) => a + b, 0) / n;
  const stdev = Math.sqrt(
    secs.map((x) => (x - mean) ** 2).reduce((a, b) => a + b, 0) / n
  );
  
  return { 
    median, 
    mean, 
    stdev, 
    max: Math.max(...secs), 
    min: Math.min(...secs) 
  };
};