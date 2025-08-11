import { Position } from '../types';

export const POSITION_CONFIG: Record<Position, { 
  label: string; 
  fullName: string; 
  color: string;
  bgColor: string;
}> = {
  GK: { 
    label: 'GK', 
    fullName: 'Goalkeeper',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/50'
  },
  DEF: { 
    label: 'DEF', 
    fullName: 'Defense',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/50'
  },
  MID: { 
    label: 'MID', 
    fullName: 'Midfield',
    color: 'text-green-400',
    bgColor: 'bg-green-900/50'
  },
  FWD: { 
    label: 'FWD', 
    fullName: 'Forward',
    color: 'text-red-400',
    bgColor: 'bg-red-900/50'
  }
};

export const ALL_POSITIONS: Position[] = ['GK', 'DEF', 'MID', 'FWD'];