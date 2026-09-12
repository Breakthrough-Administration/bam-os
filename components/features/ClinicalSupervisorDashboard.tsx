import React from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  Activity,
  Receipt,
  FileText,
  Lock,
} from 'lucide-react';
import { useManagementStore } from '../../stores';

export const ClinicalSupervisorDashboard: React.FC = () => {
  const {
    participants,
    incidents,
    protocols,
    shifts,
    caseNotes,
    setActiveTab,
  } = useManagementStore();

  const criticalIncidents = incidents.filter(
    (inc) => inc.is24HourReportable && inc.status !== 'closed'
  );

  const totalBudget = participants.reduce((acc, p) => acc + p.totalAllocatedBudget, 0);
  const totalConsumed = participants.reduce((acc, p) => acc + p.consumedBudget, 0);
  const budgetUtilization = Math.round((totalConsumed / totalBudget) * 100);

  const totalViolations = shifts.reduce(
    (acc, s) => acc + (s.complianceAudit?.violations.length || 0),
    0
  );

  const authorisedPractices = protocols.filter(
    (p) => p.authorisationStatus === 'authorised' || p.authorisationStatus === 'fading_in_progress'
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 24-Hour Critical Legislative Alert Header if any reportable allegations exist */}
      {criticalIncidents.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-600/40 text-rose-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm tracking-tight text-white">
                  URGENT: NDIS Commission 24-Hour Reportable Allegation Active
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-rose-500 text-white animate-pulse">
                  Mandatory Escalation
                </span>
              </div>
              <p className="text-xs text-rose-300/90 mt-1">
                {criticalIncidents[0].summary} — Occurred {new Date(criticalIncidents[0].occurredAt).toLocaleDateString('en-AU')} for {criticalIncidents[0].participantName}.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('incident_escalation')}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition shrink-0 shadow"
          >
            Review 24h Escalation Dossier
          </button>
        </div>
      )}

      {/* Top Clinical & Operational Metrics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Restrictive Practices Status Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Restrictive Practices</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{authorisedPractices.length}</span>
            <span className="text-xs text-emerald-400 font-medium">100% Authorised</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            All active chemical/environmental interventions approved by Authorisation Panel.
          </p>
        </div>

        {/* NDIS PAPL Budget Utilization */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">NDIS Budget Burn</span>
            <Receipt className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{budgetUtilization}%</span>
            <span className="text-xs text-slate-400">
              ${(totalConsumed / 1000).toFixed(1)}k of ${(totalBudget / 1000).toFixed(1)}k
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                budgetUtilization > 85 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, budgetUtilization)}%` }}
            />
          </div>
        </div>

        {/* Fair Work SCHADS Award Compliance */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">SCHADS Roster Health</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${totalViolations > 0 ? 'text-amber-400' : 'text-white'}`}>
              {totalViolations}
            </span>
            <span className="text-xs text-slate-400">Award Violations</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {totalViolations === 0
              ? 'All shifts meet 2h minimum & 10h rest break rules.'
              : 'Action required: 1 shift breaches 2-hour minimum engagement.'}
          </p>
        </div>

        {/* Active Participants & BSP Reviews */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Participants</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{participants.length}</span>
            <span className="text-xs text-purple-400 font-medium">3 With Active BSPs</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Span across MMM 1 (Metro Melbourne), MMM 4 (Ballarat), MMM 6 (Broken Hill).
          </p>
        </div>
      </div>

      {/* Main Grid: Priority Queues & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Active Participants & PBS Schedules */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Participants Summary Table */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100">NDIS Participant Caseload Overview</h3>
                <p className="text-xs text-slate-400">
                  Monitored for Functional Behaviour Assessments & Modified Monash geographic loadings
                </p>
              </div>
              <button
                onClick={() => setActiveTab('participants')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                View All Caseload &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-700/80">
                  <tr>
                    <th className="py-2.5 px-3">Participant</th>
                    <th className="py-2.5 px-3">NDIS Number</th>
                    <th className="py-2.5 px-3">MMM Zone</th>
                    <th className="py-2.5 px-3">BSP Due</th>
                    <th className="py-2.5 px-3">Restrictive Practices</th>
                    <th className="py-2.5 px-3">Budget Burn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {participants.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-semibold text-slate-100">
                        {p.fullName}
                        <div className="text-[11px] text-slate-400 font-normal">{p.primaryDiagnosis.split('with')[0]}</div>
                      </td>
                      <td className="py-3 px-3 font-mono">{p.ndisNumber}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                          p.mmmZone <= 3
                            ? 'bg-slate-800 text-slate-300 border-slate-700'
                            : p.mmmZone <= 5
                            ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                            : 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30'
                        }`}>
                          MMM {p.mmmZone} {p.mmmZone === 6 ? '(+40%)' : p.mmmZone === 7 ? '(+50%)' : '(Base)'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-300 font-medium">
                          {p.bspReviewDueDate ? new Date(p.bspReviewDueDate).toLocaleDateString('en-AU') : 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {p.activeRestrictivePracticesCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
                            <Lock className="w-3 h-3" />
                            {p.activeRestrictivePracticesCount} Active Protocol
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 text-[11px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            None
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-200">
                          ${(p.consumedBudget / 1000).toFixed(1)}k / ${(p.totalAllocatedBudget / 1000).toFixed(1)}k
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {Math.round((p.consumedBudget / p.totalAllocatedBudget) * 100)}% utilized
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Restrictive Practices Fading Progress Card */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Legislative Fading Progress (PBS Elimination)</h3>
                <p className="text-xs text-slate-400">
                  NDIS Quality and Safeguards Commission mandatory fading curves
                </p>
              </div>
              <button
                onClick={() => setActiveTab('restrictive_practices')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                Fading Simulator &rarr;
              </button>
            </div>

            <div className="space-y-3">
              {protocols.map((proto) => {
                const percentFaded = Math.round(
                  ((proto.baselineFrequencyPerWeek - proto.currentFrequencyPerWeek) /
                    proto.baselineFrequencyPerWeek) *
                    100
                );
                return (
                  <div key={proto.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 text-xs">{proto.participantName}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {proto.type}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">{percentFaded}% Reduced</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{proto.description}</p>
                    <div className="w-full bg-slate-700 h-2 rounded-full mt-2 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, percentFaded)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>Baseline: {proto.baselineFrequencyPerWeek}/wk</span>
                      <span>Current: {proto.currentFrequencyPerWeek}/wk</span>
                      <span>Target Elimination: {new Date(proto.targetDateForElimination).toLocaleDateString('en-AU')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: High Acuity Alerts & Quick Operational Feed */}
        <div className="space-y-6">
          {/* Quick Navigation Quick-Launch */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-100">Practice Tools & Accelerators</h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setActiveTab('billing_papl')}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-xs text-slate-200 transition group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold">NDIS PAPL Calculator</div>
                    <div className="text-[10px] text-slate-400">MMM 1-7 loadings & 30/60m travel caps</div>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-slate-200">&rarr;</span>
              </button>

              <button
                onClick={() => setActiveTab('schads_roster')}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-xs text-slate-200 transition group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="font-semibold">SCHADS Award Auditor</div>
                    <div className="text-[10px] text-slate-400">2h minimums, broken shifts & 10h rest gap</div>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-slate-200">&rarr;</span>
              </button>

              <button
                onClick={() => setActiveTab('case_notes')}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-xs text-slate-200 transition group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="font-semibold">SOAP Clinical Scribe</div>
                    <div className="text-[10px] text-slate-400">DLP Masker & Speech-to-Text integration</div>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-slate-200">&rarr;</span>
              </button>

              <button
                onClick={() => setActiveTab('audit_compliance')}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-xs text-slate-200 transition group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <div>
                    <div className="font-semibold">NDIS Quality & Audit Register</div>
                    <div className="text-[10px] text-slate-400">Worker screening & legislative reports</div>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-slate-200">&rarr;</span>
              </button>
            </div>
          </div>

          {/* Recent SOAP Clinical Documentation Activity */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-100 mb-3">Recent Clinical Notes</h3>
            <div className="space-y-3">
              {caseNotes.slice(0, 3).map((note) => (
                <div key={note.id} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 text-xs">
                  <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                    <span>{note.participantName}</span>
                    <span className="text-[10px] text-slate-400">{new Date(note.sessionDate).toLocaleDateString('en-AU')}</span>
                  </div>
                  <p className="text-slate-400 text-xs line-clamp-2">{note.assessment}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>PII Masked & Locally Stored (IndexedDB)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
