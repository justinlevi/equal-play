export interface Player {
  id: string;
  name: string;
  number: string;
  seconds: number;
  on: boolean;
  stats: Record<string, number>;
}

export interface CustomStat {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

export interface SubstitutionSuggestion {
  off: Player;
  on: Player;
  diff: number;
}

export interface MinutesStats {
  median: number;
  mean: number;
  stdev: number;
  max: number;
  min: number;
}