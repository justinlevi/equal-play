import React from 'react';
import { Player, CustomStat, MinutesStats } from '../../types/index';
import { generateReport, exportCSV } from '../../utils/report';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  matchSeconds: number;
  enabledStats: CustomStat[];
  minutesStats: MinutesStats;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  players,
  matchSeconds,
  enabledStats,
  minutesStats,
}) => {
  if (!isOpen) return null;

  const report = generateReport(players, matchSeconds, enabledStats, minutesStats);

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    alert('Report copied to clipboard!');
  };

  const handleExportCSV = () => {
    exportCSV(players, enabledStats);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Game Report</h2>
        
        <pre className="bg-slate-900 rounded p-4 text-sm whitespace-pre-wrap mb-4">
          {report}
        </pre>
        
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            📋 Copy Report
          </button>
          <button
            onClick={handleExportCSV}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
          >
            📊 Export CSV
          </button>
        </div>
        
        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};