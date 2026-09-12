import React, { useState } from 'react';
import {
  Lock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Plus,
  TrendingDown,
  Info,
  Clock,
} from 'lucide-react';
import { useManagementStore } from '../../stores';
import { RestrictivePracticeType, RestrictivePracticeLog, RestrictivePracticeProtocol } from '../../types';

export const RestrictivePracticesModule: React.FC = () => {
  const { protocols, logs, participants, logRestrictivePractice, updateProtocolFading } = useManagementStore();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedPracticeType, setSelectedPracticeType] = useState<RestrictivePracticeType>('environmental');
  const [selectedParticipantId, setSelectedParticipantId] = useState(participants[0]?.id || '');
  const [wasAuthorised, setWasAuthorised] = useState(true);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [precursors, setPrecursors] = useState('');
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [administrator, setAdministrator] = useState('Dr. Sarah Jenkins');
  const [witness, setWitness] = useState('Elena Rossi');
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');

  const alternativeOptions = [
    'Offered quiet sensory withdrawal room',
    'Provided noise-cancelling headphones',
    'Utilized weighted lap blanket & tactile grounding items',
    'Engaged low-arousal de-escalation vocal tone',
    'Redirected to preferred visual communication schedule (PECS)',
    'Allowed independent pacing in safe outdoor garden courtyard',
  ];

  const handleToggleAlternative = (alt: string) => {
    setAlternatives((prev) =>
      prev.includes(alt) ? prev.filter((a) => a !== alt) : [...prev, alt]
    );
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const participant = participants.find((p) => p.id === selectedParticipantId);
    if (!participant) return;

    const newLog: RestrictivePracticeLog = {
      id: `rp-log-${Date.now()}`,
      tenantId: participant.tenantId,
      participantId: participant.id,
      participantName: participant.fullName,
      practiceType: selectedPracticeType,
      wasAuthorised,
      isReportableToCommission: true,
      escalationRequired24h: !wasAuthorised,
      timestampStart: new Date(Date.now() - durationMinutes * 60000).toISOString(),
      timestampEnd: new Date().toISOString(),
      durationMinutes,
      administeredBy: administrator,
      witnessedBy: witness,
      immediatePrecursors: precursors,
      lessRestrictiveAlternativesAttempted: alternatives,
      participantOutcome: outcome,
      postIncidentDebriefCompleted: true,
      notes,
    };

    await logRestrictivePractice(newLog);
    setIsLogModalOpen(false);

    // Reset form
    setPrecursors('');
    setOutcome('');
    setNotes('');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">Restrictive Practices & Positive Behaviour Support</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compliant with NDIS (Restrictive Practices and Behaviour Support) Rules 2018. Chemical, mechanical, physical, environmental, and seclusion governance.
          </p>
        </div>

        <button
          onClick={() => setIsLogModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Log Restrictive Intervention</span>
        </button>
      </div>

      {/* Legislative Safeguard Warning Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 text-slate-300 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-300">NDIS Commission Strict Legislative Notice</p>
          <p className="text-slate-400 leading-relaxed">
            All restrictive practices must be authorised under relevant State/Territory authorisation mechanisms, contained within an active Behaviour Support Plan lodged with the NDIS Commission, and subjected to active reduction and elimination strategies. Unauthorised use constitutes a 24-hour reportable incident.
          </p>
        </div>
      </div>

      {/* Authorised Protocols Register */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100">Authorised Restrictive Protocols Register</h2>
          <span className="text-xs text-slate-400">{protocols.length} Active Protocols Lodged</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {protocols.map((protocol) => {
            const percentFaded = Math.round(
              ((protocol.baselineFrequencyPerWeek - protocol.currentFrequencyPerWeek) /
                protocol.baselineFrequencyPerWeek) *
                100
            );

            return (
              <div
                key={protocol.id}
                className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {protocol.type}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Authorised
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-sm">{protocol.participantName}</h3>
                  <p className="text-xs text-slate-300 mt-1 font-medium">{protocol.description}</p>
                  <p className="text-[11px] text-slate-400 mt-1 italic leading-relaxed">
                    Rationale: {protocol.rationale}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-700/60">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Authorising Authority:</span>
                    <span className="text-slate-200 font-semibold">{protocol.authorisingBody}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Authorisation Expiry:</span>
                    <span className="text-slate-200 font-medium">
                      {new Date(protocol.expiryDate).toLocaleDateString('en-AU')}
                    </span>
                  </div>

                  {/* Fading Track */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-300 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-emerald-400" />
                        Fading Schedule:
                      </span>
                      <span className="text-emerald-400 font-bold">{percentFaded}% Reduction</span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.max(5, percentFaded)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>Baseline: {protocol.baselineFrequencyPerWeek}/wk</span>
                      <span>Target: 0/wk by {new Date(protocol.targetDateForElimination).toLocaleDateString('en-AU')}</span>
                    </div>
                  </div>

                  {/* Quick Fading Update Button */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() =>
                        updateProtocolFading(
                          protocol.id,
                          Math.max(0, protocol.currentFrequencyPerWeek - 1)
                        )
                      }
                      className="flex-1 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-medium transition"
                    >
                      Step Down Fading (-1/wk)
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Interventions Log Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-100">Live Restrictive Intervention Audit Register</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-700/80">
              <tr>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Participant</th>
                <th className="py-2.5 px-3">Practice Type</th>
                <th className="py-2.5 px-3">Authorised</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Administered By</th>
                <th className="py-2.5 px-3">Less Restrictive Alternatives</th>
                <th className="py-2.5 px-3">Commission Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 text-slate-400 font-mono">
                    {new Date(l.timestampStart).toLocaleString('en-AU', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-200">{l.participantName}</td>
                  <td className="py-3 px-3">
                    <span className="capitalize px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                      {l.practiceType}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {l.wasAuthorised ? (
                      <span className="text-emerald-400 font-semibold">Authorised</span>
                    ) : (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Unauthorised (24h Alert)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-semibold">{l.durationMinutes} mins</td>
                  <td className="py-3 px-3">{l.administeredBy}</td>
                  <td className="py-3 px-3 text-slate-400">
                    {l.lessRestrictiveAlternativesAttempted.length} strategies attempted
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                      Lodged To Commission
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Restrictive Intervention Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Log Restrictive Practice Intervention</h3>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Select Participant</label>
                  <select
                    aria-label="Select Participant"
                    value={selectedParticipantId}
                    onChange={(e) => setSelectedParticipantId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-emerald-500"
                    required
                  >
                    {participants.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} (NDIS: {p.ndisNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Legislative Practice Type</label>
                  <select
                    aria-label="Legislative Practice Type"
                    value={selectedPracticeType}
                    onChange={(e) => setSelectedPracticeType(e.target.value as RestrictivePracticeType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-emerald-500"
                  >
                    <option value="chemical">Chemical Restraint (PRN Medication)</option>
                    <option value="mechanical">Mechanical Restraint (Harness/Straps)</option>
                    <option value="physical">Physical Restraint</option>
                    <option value="environmental">Environmental Restraint (Locks/Barriers)</option>
                    <option value="seclusion">Seclusion (Solitary Isolation)</option>
                  </select>
                </div>
              </div>

              {/* Authorisation Validation Radio */}
              <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 space-y-2">
                <label className="block font-bold text-slate-200">Authorisation Status in Approved BSP:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="authorisation"
                      checked={wasAuthorised}
                      onChange={() => setWasAuthorised(true)}
                      className="accent-emerald-500"
                    />
                    <span>Approved in current NDIS Behaviour Support Plan</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-rose-400 font-semibold">
                    <input
                      type="radio"
                      name="authorisation"
                      checked={!wasAuthorised}
                      onChange={() => setWasAuthorised(false)}
                      className="accent-rose-500"
                    />
                    <span>Unauthorised Emergency Action (Flags 24h Escalation)</span>
                  </label>
                </div>
              </div>

              {/* Duration & Precursors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="480"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Administered By</label>
                  <input
                    type="text"
                    value={administrator}
                    onChange={(e) => setAdministrator(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Witnessed By</label>
                  <input
                    type="text"
                    value={witness}
                    onChange={(e) => setWitness(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                  />
                </div>
              </div>

              {/* Mandatory Less-Restrictive Alternatives Checklist */}
              <div>
                <label className="block font-bold text-slate-200 mb-1.5">
                  Mandatory Less-Restrictive Alternatives Attempted Prior to Intervention:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-800/40 rounded-lg border border-slate-700/60">
                  {alternativeOptions.map((alt) => (
                    <label key={alt} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alternatives.includes(alt)}
                        onChange={() => handleToggleAlternative(alt)}
                        className="accent-emerald-500"
                      />
                      <span className="text-[11px]">{alt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Immediate Precursors & Outcome */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Immediate Precursors & Triggers</label>
                  <textarea
                    rows={2}
                    value={precursors}
                    onChange={(e) => setPrecursors(e.target.value)}
                    placeholder="Document environmental, sensory, or communicative triggers..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Participant Outcome & Debrief</label>
                  <textarea
                    rows={2}
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    placeholder="Participant state post-intervention, de-escalation time..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition"
                >
                  Record & Commit To Audit Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
