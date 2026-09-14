import React from 'react';
import { useManagementStore } from '../../stores';
import { NDISGoal } from '../../types';
import { Target, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

export const NDISGoalTracker: React.FC = () => {
  const { participants } = useManagementStore();
  
  // Flatten goals from all participants
  const allGoals = participants.flatMap(p => 
    (p.goals || []).map(g => ({ ...g, participantName: p.fullName }))
  );

  const getStatusIcon = (status: NDISGoal['status']) => {
    switch (status) {
      case 'achieved': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-blue-400" />;
      case 'abandoned': return <XCircle className="w-5 h-5 text-rose-400" />;
      default: return <AlertCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: NDISGoal['status']) => {
    switch (status) {
      case 'achieved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'abandoned': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col">
      <h2 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
        <Target className="w-4 h-4 text-indigo-400" />
        NDIS Goal Tracker
      </h2>
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[300px]">
        {allGoals.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            No NDIS goals configured for current participants.
          </div>
        ) : (
          allGoals.map((goal) => (
            <div key={goal.id} className="p-3 rounded-lg border border-slate-800 bg-slate-800/50 flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{goal.title}</h3>
                  <p className="text-xs text-slate-400">{goal.participantName}</p>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-medium uppercase tracking-wider ${getStatusColor(goal.status)}`}>
                  {getStatusIcon(goal.status)}
                  <span>{goal.status.replace('_', ' ')}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">{goal.description}</p>
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                <span className="uppercase tracking-wider">{goal.category.replace('_', ' ')}</span>
                <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
