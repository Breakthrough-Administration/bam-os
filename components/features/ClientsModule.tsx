import React, { useState } from 'react';
import {
  Users,
  Search,
  MapPin,
  Calendar,
  Lock,
  Phone,
  DollarSign,
  FileCheck,
  UserCheck,
  Plus,
  Download,
} from 'lucide-react';
import { useManagementStore } from '../../stores';
import { Participant } from '../../types';
import { evaluateAndSanitiseForAI } from '../../lib/dlpSanitizer';

export const ClientsModule: React.FC = () => {
  const { participants, selectedParticipantId, selectParticipant, addParticipant } = useManagementStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filtered Participants
  const filtered = participants.filter(
    (p) =>
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ndisNumber.includes(searchTerm) ||
      p.suburb.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeParticipant =
    participants.find((p) => p.id === selectedParticipantId) || participants[0];

  const handleExportCSV = () => {
    // CSV Header
    const headers = ['ID', 'Name', 'NDIS Number', 'DOB', 'Suburb', 'State', 'MMM Zone', 'Primary Diagnosis', 'Budget Consumed', 'Restraints'];
    
    // Format rows and sanitize string fields containing PII
    const rows = filtered.map(p => {
      // Evaluate PII to redact things like name or full addresses if required
      // The instruction specifies "secure, masked CSV files for offline auditing, ensuring PII compliance via the existing dlpSanitizer"
      const safeName = evaluateAndSanitiseForAI(p.fullName).sanitisedPayload;
      const safeNdis = evaluateAndSanitiseForAI(p.ndisNumber).sanitisedPayload;
      const safeDob = evaluateAndSanitiseForAI(p.dateOfBirth).sanitisedPayload;
      const safeSuburb = evaluateAndSanitiseForAI(p.suburb).sanitisedPayload;
      
      return [
        p.id,
        `"${safeName}"`,
        `"${safeNdis}"`,
        `"${safeDob}"`,
        `"${safeSuburb}"`,
        `"${p.state}"`,
        p.mmmZone,
        `"${evaluateAndSanitiseForAI(p.primaryDiagnosis).sanitisedPayload}"`,
        `${Math.round((p.consumedBudget / p.totalAllocatedBudget) * 100)}%`,
        p.activeRestrictivePracticesCount
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `participant_audit_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">
              Participant Caseload & Behaviour Support Plans (BSP)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Australian NDIS participant management with Modified Monash Model geographical classification and PBS practitioner alignment.
          </p>
        </div>

        {/* Search Bar & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, NDIS no, suburb..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-emerald-500"
            />
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
            title="Export Masked CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Caseload Grid & Detail Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Participants List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Registered Caseload ({filtered.length})
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filtered.map((p) => {
              const isSelected = activeParticipant?.id === p.id;
              const burnPercent = Math.round((p.consumedBudget / p.totalAllocatedBudget) * 100);

              return (
                <div
                  key={p.id}
                  onClick={() => selectParticipant(p.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition text-xs space-y-2.5 ${
                    isSelected
                      ? 'bg-emerald-950/20 border-emerald-500/50 shadow-sm'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-100 text-sm">{p.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">NDIS: {p.ndisNumber}</div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        p.mmmZone <= 3
                          ? 'bg-slate-800 text-slate-300 border-slate-700'
                          : p.mmmZone <= 5
                          ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                          : 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30'
                      }`}
                    >
                      MMM {p.mmmZone}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 line-clamp-1">{p.primaryDiagnosis}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {p.suburb}, {p.state}
                    </span>

                    {p.activeRestrictivePracticesCount > 0 ? (
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {p.activeRestrictivePracticesCount} RP
                      </span>
                    ) : (
                      <span className="text-emerald-400">0 Restraints</span>
                    )}

                    <span className="font-mono font-bold text-slate-300">{burnPercent}% Budget</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Participant Detailed Card (7 cols) */}
        {activeParticipant && (
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">{activeParticipant.fullName}</h2>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    Active Plan
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                  <span>NDIS: {activeParticipant.ndisNumber}</span>
                  <span>DOB: {activeParticipant.dateOfBirth}</span>
                  <span>Gender: {activeParticipant.gender}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400">Geographic Classification</span>
                <div className="text-sm font-bold text-teal-300">
                  MMM {activeParticipant.mmmZone}{' '}
                  {activeParticipant.mmmZone === 6
                    ? '(Remote +40%)'
                    : activeParticipant.mmmZone === 7
                    ? '(Very Remote +50%)'
                    : '(National Base)'}
                </div>
              </div>
            </div>

            {/* Diagnoses & Clinical Presentation */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-300 block">Clinical Presentation & Diagnoses</span>
              <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/70 text-slate-200 leading-relaxed">
                <strong className="text-emerald-400">Primary: </strong>
                {activeParticipant.primaryDiagnosis}
                {activeParticipant.secondaryDiagnoses && (
                  <div className="mt-1 text-slate-300">
                    <strong className="text-teal-400">Secondary: </strong>
                    {activeParticipant.secondaryDiagnoses.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Budget & Plan Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-400 block">NDIS Plan Budget Status</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-white font-mono">
                    ${activeParticipant.consumedBudget.toLocaleString('en-AU')}
                  </span>
                  <span className="text-slate-400">
                    of ${activeParticipant.totalAllocatedBudget.toLocaleString('en-AU')}
                  </span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((activeParticipant.consumedBudget / activeParticipant.totalAllocatedBudget) * 100)
                      )}%`,
                    }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>Start: {new Date(activeParticipant.planStartDate).toLocaleDateString('en-AU')}</span>
                  <span>End: {new Date(activeParticipant.planEndDate).toLocaleDateString('en-AU')}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-400 block">Behaviour Support Plan (BSP)</span>
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-slate-200">Lodged & Active Plan</span>
                </div>
                <div className="text-xs text-slate-300">
                  Review Due:{' '}
                  <strong className="text-amber-300">
                    {activeParticipant.bspReviewDueDate
                      ? new Date(activeParticipant.bspReviewDueDate).toLocaleDateString('en-AU')
                      : 'Pending'}
                  </strong>
                </div>
                <div className="text-[11px] text-slate-400">
                  Practitioner: {activeParticipant.behaviourSupportPractitioner}
                </div>
              </div>
            </div>

            {/* Key Clinical & Nominee Contacts */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-300 block">Care Circle & Nominee Contacts</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
                  <div className="text-[11px] text-slate-400">Emergency Contact / Nominee</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{activeParticipant.contactEmergencyName}</div>
                  <div className="flex items-center gap-1 text-slate-300 font-mono text-[11px] mt-1">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>{activeParticipant.contactEmergencyPhone}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
                  <div className="text-[11px] text-slate-400">Allied Health Key Worker</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{activeParticipant.alliedHealthKeyWorker}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Breakthrough Specialist Clinical Team</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
