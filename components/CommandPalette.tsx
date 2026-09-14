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
  GraduationCap,
  Keyboard,
  X,
  Sparkles,
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
  const [showShortcutsTooltip, setShowShortcutsTooltip] = useState(false);

  // Listen for global hotkeys: Cmd+K / Ctrl+K, Ctrl+N (SOAP note), Ctrl+T (Tutorials), Ctrl+I (Incidents), Ctrl+B (Billing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // 1. Toggle Command Palette: Cmd+K / Ctrl+K
      if (isMod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
        setShowShortcutsTooltip(false);
        return;
      }

      // 2. Escape: close Shortcuts Tooltip first if open, or close Command Palette
      if (e.key === 'Escape' && commandPaletteOpen) {
        e.preventDefault();
        if (showShortcutsTooltip) {
          setShowShortcutsTooltip(false);
        } else {
          setCommandPaletteOpen(false);
        }
        return;
      }

      // 3. Toggle Shortcuts Tooltip with '?' when CommandPalette is open and not typing in search
      if (commandPaletteOpen && e.key === '?' && !isMod) {
        setShowShortcutsTooltip((prev) => !prev);
        return;
      }

      // 3. New SOAP Case Note: Cmd+N / Ctrl+N or Alt+N
      if (((isMod && !e.shiftKey) || e.altKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setActiveTab('case_notes');
        setCommandPaletteOpen(false);
        return;
      }

      // 4. Tutorials & Clinician Academy: Cmd+T / Ctrl+T or Alt+T
      if (((isMod && !e.shiftKey) || e.altKey) && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        setActiveTab('tutorials_academy');
        setCommandPaletteOpen(false);
        return;
      }

      // 5. NDIS Commission 24h Incident Escalator: Cmd+I / Ctrl+I or Alt+I
      if (((isMod && !e.shiftKey) || e.altKey) && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        setActiveTab('incident_escalation');
        setCommandPaletteOpen(false);
        return;
      }

      // 6. NDIS Pricing (PAPL) Calculator: Cmd+B / Ctrl+B or Alt+B
      if (((isMod && !e.shiftKey) || e.altKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setActiveTab('billing_papl');
        setCommandPaletteOpen(false);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [commandPaletteOpen, setCommandPaletteOpen, setActiveTab]);

  if (!commandPaletteOpen) return null;

  const quickActions = [
    {
      id: 'tab-soap',
      title: 'SOAP Clinical Voice Scribe & Case Notes',
      desc: 'Client-side PII DLP sanitization & voice transcription',
      icon: FileText,
      iconColor: 'text-purple-400',
      hotkey: 'Ctrl+N',
      action: () => {
        setActiveTab('case_notes');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'tab-tutorials-academy',
      title: 'Tutorials & Clinician Academy',
      desc: 'Interactive step-by-step guides, regulatory cheat sheets & onboarding quiz',
      icon: GraduationCap,
      iconColor: 'text-teal-400',
      hotkey: 'Ctrl+T',
      action: () => {
        setActiveTab('tutorials_academy');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'tab-escalation',
      title: 'NDIS Commission 24h Incident Escalator',
      desc: 'Lodge urgent reportable allegation to Commission portal',
      icon: ShieldAlert,
      iconColor: 'text-rose-400',
      hotkey: 'Ctrl+I',
      action: () => {
        setActiveTab('incident_escalation');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'tab-papl',
      title: 'NDIS Pricing (PAPL) Calculator',
      desc: 'Calculate MMM 1-7 loadings & 30m/60m provider travel caps',
      icon: Receipt,
      iconColor: 'text-teal-400',
      hotkey: 'Ctrl+B',
      action: () => {
        setActiveTab('billing_papl');
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
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden text-slate-200 relative">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Type command, action, or participant name... (ESC to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-hidden"
            autoFocus
          />

          <div className="flex items-center gap-2 shrink-0">
            {/* Shortcuts Tooltip Toggle Button */}
            <button
              type="button"
              onClick={() => setShowShortcutsTooltip((prev) => !prev)}
              onMouseEnter={() => setShowShortcutsTooltip(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer border ${
                showShortcutsTooltip
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              }`}
              title="Toggle global shortcuts tooltip overlay (or press '?')"
              aria-label="Toggle keyboard shortcuts tooltip overlay"
            >
              <Keyboard className="w-3.5 h-3.5 text-teal-400" />
              <span>Shortcuts</span>
              <kbd className="px-1 py-0.2 rounded bg-slate-900 text-[9px] text-teal-400 font-mono border border-slate-700">
                ?
              </kbd>
            </button>

            <kbd className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700 font-mono">
              ESC
            </kbd>
          </div>
        </div>

        {/* Shortcuts Tooltip Overlay */}
        {showShortcutsTooltip && (
          <div
            className="absolute top-16 right-3 left-3 sm:left-auto sm:w-[410px] z-30 p-4 rounded-xl bg-slate-950/95 border border-teal-500/40 shadow-2xl backdrop-blur-md text-slate-200 animate-in fade-in zoom-in-95 duration-150"
            onMouseLeave={() => setShowShortcutsTooltip(false)}
          >
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-teal-500/20 text-teal-400 border border-teal-500/30">
                  <Keyboard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">Global Hotkeys & Shortcuts</h4>
                  <p className="text-[10px] text-slate-400">Power user keyboard navigation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsTooltip(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close shortcuts tooltip"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Category: Clinical Navigation */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-teal-400 mb-1.5 flex items-center justify-between">
                  <span>Clinical Navigation</span>
                  <span className="text-[9px] text-slate-500 font-normal">Works everywhere</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-200 text-[11px] font-medium">New SOAP Voice Scribe Note</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-purple-300 font-bold">
                        Ctrl+N
                      </kbd>
                      <span className="text-[9px] text-slate-500">or</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-400">
                        Alt+N
                      </kbd>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-200 text-[11px] font-medium">Tutorials & Clinician Academy</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-teal-300 font-bold">
                        Ctrl+T
                      </kbd>
                      <span className="text-[9px] text-slate-500">or</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-400">
                        Alt+T
                      </kbd>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-200 text-[11px] font-medium">NDIS 24h Incident Escalator</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-rose-300 font-bold">
                        Ctrl+I
                      </kbd>
                      <span className="text-[9px] text-slate-500">or</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-400">
                        Alt+I
                      </kbd>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-200 text-[11px] font-medium">NDIS Pricing (PAPL) Calculator</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-emerald-300 font-bold">
                        Ctrl+B
                      </kbd>
                      <span className="text-[9px] text-slate-500">or</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-400">
                        Alt+B
                      </kbd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category: System Controls */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  System & Palette Controls
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-200 text-[11px] font-medium">Toggle Command Palette</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-amber-300 font-bold">
                      Ctrl+K / ⌘K
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-200 text-[11px] font-medium">Dismiss Overlay / Palette</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">
                      ESC
                    </kbd>
                  </div>
                </div>
              </div>
            </div>

            {/* Pro tip footer */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-start gap-2 text-[10px] text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-200">Tip:</strong> Global hotkeys trigger actions immediately from any screen without clicking navigation buttons.
              </span>
            </div>
          </div>
        )}

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
                <div className="flex items-center gap-2">
                  {'hotkey' in action && action.hotkey && (
                    <kbd className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700 shadow-xs group-hover:border-teal-500/40 group-hover:text-teal-300 transition">
                      {action.hotkey}
                    </kbd>
                  )}
                  <span className="text-slate-500 group-hover:text-slate-300">&rarr;</span>
                </div>
              </button>
            );
          })}

          {filteredActions.length === 0 && matchedParticipants.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-400">
              No matching clinical commands found for "{query}".
            </div>
          )}
        </div>

        {/* Global Hotkeys Legend Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-purple-300 font-bold">Ctrl+N</kbd>
              <span>New SOAP Note</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-teal-300 font-bold">Ctrl+T</kbd>
              <span>Tutorials</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-rose-300 font-bold">Ctrl+I</kbd>
              <span>Incidents</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-emerald-300 font-bold">Ctrl+B</kbd>
              <span>Billing</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowShortcutsTooltip((prev) => !prev)}
            className="text-[10px] text-teal-400 hover:text-teal-300 font-mono flex items-center gap-1.5 transition cursor-pointer px-1.5 py-0.5 rounded hover:bg-slate-800/80"
          >
            <Keyboard className="w-3 h-3 text-teal-400" />
            <span>{showShortcutsTooltip ? 'Hide Shortcuts' : 'All Shortcuts (?)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
