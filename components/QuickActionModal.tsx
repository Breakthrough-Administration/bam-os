import React from 'react';
import {
  Lock,
  AlertTriangle,
  Receipt,
  FileText,
  CalendarCheck,
  X,
} from 'lucide-react';
import { useManagementStore } from '../stores';

export const QuickActionModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { setActiveTab } = useManagementStore();

  if (!isOpen) return null;

  const actions = [
    {
      title: 'Lodge Urgent 24h Incident Report',
      description: 'Mandatory Section 73Z reportable allegation to NDIS Commission',
      icon: AlertTriangle,
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      action: () => {
        setActiveTab('incident_escalation');
        onClose();
      },
    },
    {
      title: 'Log Restrictive Practice Intervention',
      description: 'Record chemical, mechanical, physical, environmental or seclusion event',
      icon: Lock,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      action: () => {
        setActiveTab('restrictive_practices');
        onClose();
      },
    },
    {
      title: 'Dictate SOAP Clinical Case Note',
      description: 'Voice transcribe session notes with automatic PII DLP redaction',
      icon: FileText,
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      action: () => {
        setActiveTab('case_notes');
        onClose();
      },
    },
    {
      title: 'Calculate PAPL Billing & Travel Caps',
      description: 'NDIS price limits, MMM 1-7 loadings, and provider travel calculations',
      icon: Receipt,
      color: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
      action: () => {
        setActiveTab('billing_papl');
        onClose();
      },
    },
    {
      title: 'Schedule SCHADS Award Compliant Shift',
      description: '2h minimum engagement, broken shifts, and 10-hour rest pause validation',
      icon: CalendarCheck,
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      action: () => {
        setActiveTab('schads_roster');
        onClose();
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-base text-white">Clinical Quick Actions</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {actions.map((act, i) => {
            const Icon = act.icon;
            return (
              <button
                key={i}
                onClick={act.action}
                className="w-full flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition group"
              >
                <div className={`p-2 rounded-lg border shrink-0 ${act.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="font-semibold text-xs text-slate-100 group-hover:text-emerald-400 transition">
                    {act.title}
                  </div>
                  <div className="text-[11px] text-slate-400 leading-tight">
                    {act.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
