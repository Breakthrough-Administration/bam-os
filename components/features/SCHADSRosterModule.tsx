import React, { useState } from 'react';
import {
  CalendarCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  User,
  Plus,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { useManagementStore } from '../../stores';
import { RosterShift } from '../../types';
import { calculateShiftWages, SCHADS_BASE_RATES } from '../../lib/schadsAwardService';

export const SCHADSRosterModule: React.FC = () => {
  const { shifts, participants, addShift, removeShift } = useManagementStore();

  const [workerName, setWorkerName] = useState('Jarrod Murphy');
  const [selectedParticipantId, setSelectedParticipantId] = useState(participants[0]?.id || '');
  const [schadsLevel, setSchadsLevel] = useState<number>(3);
  const [schadsPayPoint, setSchadsPayPoint] = useState<number>(1);
  const [startTime, setStartTime] = useState('2026-09-10T08:00');
  const [endTime, setEndTime] = useState('2026-09-10T12:00');
  const [isBrokenShift, setIsBrokenShift] = useState(false);
  const [notes, setNotes] = useState('Community inclusion & positive behaviour support session.');

  const handleAddShift = (e: React.FormEvent) => {
    e.preventDefault();
    const participant = participants.find((p) => p.id === selectedParticipantId);
    if (!participant) return;

    const newShiftData = {
      id: `shf-${Date.now()}`,
      tenantId: participant.tenantId,
      workerId: workerName.toLowerCase().replace(/\s+/g, '-'),
      workerName,
      participantId: participant.id,
      participantName: participant.fullName,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      schadsLevel,
      schadsPayPoint,
      isBrokenShift,
      travelAllowanceEligible: true,
      notes,
    };

    addShift(newShiftData);
  };

  const totalViolationsCount = shifts.reduce(
    (acc, s) => acc + (s.complianceAudit?.violations.length || 0),
    0
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">
              Fair Work SCHADS Award Roster & Shift Optimizer
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enforcing Social, Community, Home Care and Disability Services Industry Award 2020. Minimum engagements, broken shifts, 10h rest breaks, and overtime penalties.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalViolationsCount > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>{totalViolationsCount} Roster Breaches Detected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>100% SCHADS Award Compliant</span>
            </div>
          )}
        </div>
      </div>

      {/* Legislative Guidelines Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            Clause 10.5: 2h Minimum
          </span>
          <p className="text-slate-400">
            Part-time and casual support workers must be rostered for at least 2 consecutive hours per engagement.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Clause 25.5: 10h Rest Gap
          </span>
          <p className="text-slate-400">
            Workers must have 10 consecutive hours break between the end of one shift and start of the next (or double-time penalty applies).
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-teal-400" />
            Clause 25.4: Broken Shifts
          </span>
          <p className="text-slate-400">
            Max 2 parts within 12-hour span. Entitled to daily broken shift allowance ($19.46) plus overtime if span exceeded.
          </p>
        </div>
      </div>

      {/* Shift Scheduler & Active Roster Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scheduler Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2">
            Schedule Compliant Shift
          </h2>

          <form onSubmit={handleAddShift} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Support Worker Name</label>
              <input
                type="text"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Participant</label>
              <select
                aria-label="Participant"
                value={selectedParticipantId}
                onChange={(e) => setSelectedParticipantId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                required
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} (MMM {p.mmmZone})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">SCHADS Level</label>
                <select
                  aria-label="SCHADS Level"
                  value={schadsLevel}
                  onChange={(e) => setSchadsLevel(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  <option value={1}>Level 1 (Entry)</option>
                  <option value={2}>Level 2 (Support Worker)</option>
                  <option value={3}>Level 3 (Experienced)</option>
                  <option value={4}>Level 4 (Key Worker)</option>
                  <option value={5}>Level 5 (Team Leader)</option>
                  <option value={6}>Level 6 (Clinician/Coordinator)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Pay Point</label>
                <select
                  aria-label="Pay Point"
                  value={schadsPayPoint}
                  onChange={(e) => setSchadsPayPoint(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  <option value={1}>Pay Point 1</option>
                  <option value={2}>Pay Point 2</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Shift Start</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Shift End</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                  required
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700 space-y-2">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBrokenShift}
                  onChange={(e) => setIsBrokenShift(e.target.checked)}
                  className="accent-blue-500"
                />
                <span className="font-semibold text-slate-200">
                  Broken Shift (Clause 25.4 - Broken Shift Allowance Applicable)
                </span>
              </label>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Shift Operational Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition active:scale-98"
            >
              Verify & Add To Roster
            </button>
          </form>
        </div>

        {/* Current Roster Shifts with Live Audit Feedback (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center justify-between">
            <span>Rostered Shifts & Live Award Audits</span>
            <span className="text-xs text-slate-400 font-normal">{shifts.length} Active Shifts</span>
          </h2>

          <div className="space-y-3">
            {shifts.map((shift) => {
              const audit = shift.complianceAudit;
              const hasViolations = audit && audit.violations.length > 0;
              const wages = audit ? calculateShiftWages(shift, audit) : null;

              return (
                <div
                  key={shift.id}
                  className={`p-4 rounded-xl border flex flex-col space-y-3 shadow-sm transition ${
                    hasViolations
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm">{shift.workerName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                          SCHADS L{shift.schadsLevel}.{shift.schadsPayPoint}
                        </span>
                        {shift.isBrokenShift && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                            Broken Shift
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Participant: <strong className="text-slate-200">{shift.participantName}</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => removeShift(shift.id)}
                      className="text-xs text-slate-500 hover:text-rose-400 transition"
                      title="Remove shift"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Timing & Hours */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-2 border-y border-slate-800/80">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Start Time</span>
                      <span className="font-mono text-slate-200">
                        {new Date(shift.startTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">End Time</span>
                      <span className="font-mono text-slate-200">
                        {new Date(shift.endTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Duration</span>
                      <span className="font-mono font-bold text-slate-200">
                        {audit?.engagementHours.toFixed(1)} hrs
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Rest Break Prior</span>
                      <span className={`font-mono font-bold ${audit?.restBreakCompliant ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {audit ? `${audit.restBreakBetweenShiftsHours}h` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Wage Estimation Breakdown */}
                  {wages && (
                    <div className="flex items-center justify-between text-xs bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/60 font-mono">
                      <span className="text-slate-400">Estimated Gross Wages:</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-300 text-[11px]">
                          Base: ${wages.basePay.toFixed(2)}
                          {wages.overtimePay > 0 && ` | OT: $${wages.overtimePay.toFixed(2)}`}
                          {wages.penaltyPay > 0 && ` | Pen: $${wages.penaltyPay.toFixed(2)}`}
                          {wages.brokenShiftAllowance > 0 && ` | Allowance: $${wages.brokenShiftAllowance.toFixed(2)}`}
                        </span>
                        <span className="text-emerald-400 font-bold">${wages.totalGrossPay.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Violations Feedback Banner */}
                  {hasViolations ? (
                    <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Fair Work Award Non-Compliance Detected:</span>
                      </div>
                      <ul className="list-disc list-inside text-xs text-amber-200/90 space-y-0.5">
                        {audit.violations.map((v, idx) => (
                          <li key={idx}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Compliant with minimum engagement & 10-hour rest pause.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
