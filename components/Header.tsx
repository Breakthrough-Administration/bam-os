import React, { useState } from 'react';
import {
  ShieldAlert,
  Wifi,
  WifiOff,
  Building2,
  UserCheck,
  Search,
  PlusCircle,
  FileCheck2,
  GraduationCap,
  Lock,
  Unlock,
  KeyRound,
} from 'lucide-react';
import { useManagementStore } from '../stores';
import { UserRole } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

export const Header: React.FC<{ onOpenQuickAction: () => void }> = ({ onOpenQuickAction }) => {
  const {
    currentUser,
    switchRole,
    isOnline,
    pendingSyncCount,
    incidents,
    setCommandPaletteOpen,
    setActiveTab,
  } = useManagementStore();

  const [isFieldLocked, setIsFieldLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const FIELD_PIN = '1234';

  const criticalIncidentsCount = incidents.filter(
    (inc) => inc.is24HourReportable && inc.status !== 'closed'
  ).length;

  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === FIELD_PIN || pinInput === '0000') {
      setIsFieldLocked(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const roles: { key: UserRole; label: string }[] = [
    { key: 'lead_clinician', label: 'Lead Clinician (PBS Specialist)' },
    { key: 'pbs_practitioner', label: 'PBS Practitioner' },
    { key: 'allied_health', label: 'Allied Health Practitioner' },
    { key: 'support_worker', label: 'Disability Support Worker' },
    { key: 'practice_manager', label: 'Practice Manager' },
    { key: 'compliance_officer', label: 'Compliance & Quality Officer' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & System Brand */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-emerald-500/40 shadow-sm shrink-0 bg-slate-950 flex items-center justify-center group">
              <img
                src="/breakthrough-brand.svg"
                alt="Breakthrough Clinical Brand"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-base tracking-tight">Breakthrough Manager</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  OS v2.4 (AU)
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">NDIS Practice Operations & Clinical Governance</p>
            </div>
          </div>

          {/* Quick Search & Command Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/80 text-xs transition shadow-sm"
              title="Open Global Clinical Command Bar"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Search participants, PAPL items, restrictive practices...</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 24-hour Critical Alert Flag */}
            {criticalIncidentsCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>{criticalIncidentsCount} Urgent 24h Esc</span>
              </div>
            )}

            {/* Network / Offline Sync Status */}
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${
                isOnline
                  ? 'bg-slate-800/60 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-950/40 text-amber-300 border-amber-500/30'
              }`}
              title={isOnline ? 'Online - Cloud Replicated' : 'Operating in Secure Offline-First Mode'}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" />
                  <span>Offline ({pendingSyncCount} queued)</span>
                </>
              )}
            </div>

            {/* PII Shield Pill */}
            <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
              <FileCheck2 className="w-3.5 h-3.5 text-teal-400" />
              <span>DLP Masker Active</span>
            </div>

            {/* User Role Switcher Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <select
                aria-label="Current Role"
                value={currentUser.role}
                onChange={(e) => switchRole(e.target.value as UserRole)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
              >
                {roles.map((r) => (
                  <option key={r.key} value={r.key} className="bg-slate-900 text-slate-200">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Academy & Tutorials Button */}
            <button
              onClick={() => setActiveTab('tutorials_academy')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-semibold transition"
              title="Open Breakthrough Clinician Academy & Tutorials"
            >
              <GraduationCap className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden xl:inline">Tutorials</span>
            </button>

            {/* Field Visit Quick PIN Lock */}
            <button
              onClick={() => setIsFieldLocked(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition"
              title="Quick Lock Session (For Clinicians Stepping Away on Community Visits)"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden 2xl:inline">Field Lock</span>
            </button>

            {/* Quick Record Action */}
            <PWAInstallButton />
            <button
              onClick={onOpenQuickAction}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quick Action</span>
            </button>
          </div>
        </div>
      </div>

      {/* Field Visit Quick PIN Lock Overlay Modal */}
      {isFieldLocked && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-sm w-full p-6 rounded-2xl bg-slate-900 border-2 border-teal-500/40 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6 text-teal-400" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-white tracking-tight">Clinician Field Mode Active</h2>
              <p className="text-xs text-slate-400">
                Participant records are securely locked while stepping away during community/home visits.
              </p>
            </div>

            <form onSubmit={handleUnlockPin} className="space-y-3">
              <div>
                <input
                  type="password"
                  maxLength={4}
                  autoFocus
                  placeholder="Enter 4-digit PIN (default: 1234)"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  className="w-full text-center py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm tracking-widest focus:outline-none focus:border-teal-500 transition"
                />
                {pinError && (
                  <p className="text-[11px] text-rose-400 mt-1 font-medium">
                    Incorrect PIN. Try 1234 or 0000.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Unlock Clinical Session</span>
              </button>
            </form>

            <p className="text-[10px] text-slate-500">
              Demo PIN: <span className="font-mono text-teal-400">1234</span>. Encrypted offline data remains intact.
            </p>
          </div>
        </div>
      )}
    </header>
  );
};
