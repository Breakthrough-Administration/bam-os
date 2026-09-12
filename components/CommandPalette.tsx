import React, { useState, useEffect } from 'react';
import {
  Search,
  Lock,
  ShieldAlert,
  Receipt,
  CalendarCheck,
  FileText,
  Users,
  ShieldCheck,
  Zap,
  Cloud,
} from 'lucide-react';
import { useManagementStore } from '../stores';

export const CommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setActiveTab,
    participants,
    selectParticipant,
  } = useManagementStore();

  const [query, setQuery] = useState('');

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const quickActions = [
    {
      id: 'tab-escalation',
      title: 'NDIS Commission 24h Incident Escalator',
      desc: 'Lodge urgent reportable allegation to Commission portal',
      icon: ShieldAlert,
      iconColor: 'text-rose-400',
      action: () => {
        setActiveTab('incident_escalation');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'tab-rp',
      title: 'Restrictive Practice Protocol & Fading Register',
      desc: 'Log chemical, mechanical, physical, environmental restraint',
      icon: Lock,
      iconColor: 'text-amber-400',
      action: () => {
        setActiveTab('restrictive_practices');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'tab-papl',
      title: 'NDIS Pricing (PAPL) Calculator',
      desc: 'Calculate MMM 1-7 loadings & 30m/60m provider travel caps',
      icon: Receipt,
      iconColor: 'text-teal-400',
      action: () => {
        setActiveTab('billing_papl');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'tab-schads',
      title: 'Fair Work SCHADS Award Roster Auditor',
      desc: 'Check 2h minimums, broken shifts & 10h rest pauses',
      icon: CalendarCheck,
      iconColor: 'text-blue-400',
      action: () => {
        setActiveTab('schads_roster');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'tab-soap',
      title: 'SOAP Clinical Voice Scribe & Case Notes',
      desc: 'Client-side PII DLP sanitization & voice transcription',
      icon: FileText,
      iconColor: 'text-purple-400',
      action: () => {
        setActiveTab('case_notes');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'tab-audit',
      title: 'NDIS Practice Standards & Audit Bundle Export',
      desc: 'Worker screening check & legislative report manifest',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
      action: () => {
        setActiveTab('audit_compliance');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'tab-workspace',
      title: 'Google Workspace & Firebase Cloud Hub',
      desc: 'Drive, Sheets, Gmail, Calendar, Docs, Slides, Tasks, Chat, Forms, Keep, Meet, Contacts, Picker',
      icon: Cloud,
      iconColor: 'text-blue-400',
      action: () => {
        setActiveTab('workspace_hub');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'tab-security-rollout',
      title: 'Security & Phased Rollout Roadmap',
      desc: 'Zero-Trust RBAC, HMAC Webhooks, PRODA Firestore State, Audit Score (91/100)',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
      action: () => {
        setActiveTab('security_rollout');
        setCommandPaletteOpen(false);
      },
    },
  ];

  const filteredActions = quickActions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.desc.toLowerCase().includes(query.toLowerCase())
  );

  const matchedParticipants = participants.filter((p) =>
    p.fullName.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden text-slate-200">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Type command, action, or participant name... (ESC to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-hidden"
            autoFocus
          />
          <kbd className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="p-3 max-h-96 overflow-y-auto space-y-1">
          {matchedParticipants.length > 0 && query.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-1">
                Participants
              </div>
              {matchedParticipants.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    selectParticipant(p.id);
                    setActiveTab('participants');
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800 text-left transition group text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold text-slate-200">{p.fullName}</div>
                      <div className="text-[10px] text-slate-400">
                        NDIS: {p.ndisNumber} | MMM {p.mmmZone}
                      </div>
                    </div>
                  </div>
                  <span className="text-slate-500 group-hover:text-slate-300">&rarr;</span>
                </button>
              ))}
            </div>
          )}

          <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-1">
            System Commands & Workflows
          </div>

          {filteredActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.action}
                className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800 text-left transition group text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-md bg-slate-800 border border-slate-700 ${action.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100">{action.title}</div>
                    <div className="text-[11px] text-slate-400">{action.desc}</div>
                  </div>
                </div>
                <span className="text-slate-500 group-hover:text-slate-300">&rarr;</span>
              </button>
            );
          })}

          {filteredActions.length === 0 && matchedParticipants.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-400">
              No matching clinical commands found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
