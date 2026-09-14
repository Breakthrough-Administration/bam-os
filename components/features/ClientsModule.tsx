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
  Upload,
  Printer,
  FileSpreadsheet,
  Target,
  Archive,
  ArchiveRestore,
  CheckSquare,
  Square,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { useManagementStore } from '../../stores';
import { Participant } from '../../types';
import { evaluateAndSanitiseForAI } from '../../lib/dlpSanitizer';
import { ParticipantImportModal } from './clients/ParticipantImportModal';
import { ParticipantAuditPdfModal } from './clients/ParticipantAuditPdfModal';
import { downloadParticipantPdf, printParticipantCarePlan } from '../../lib/participantPdfService';

/**
 * Calculates current age of an NDIS participant based on date of birth (YYYY-MM-DD)
 */
export function calculateAge(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export const ClientsModule: React.FC = () => {
  const {
    participants,
    selectedParticipantId,
    selectParticipant,
    protocols,
    archiveParticipants,
    restoreParticipants,
  } = useManagementStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAuditPdfModalOpen, setIsAuditPdfModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'archived' | 'all'>('active');
  const [selectedForArchive, setSelectedForArchive] = useState<string[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Helper to determine participant current status
  const getParticipantStatus = (p: Participant): 'active' | 'inactive' | 'archived' => {
    if (p.isArchived || p.status === 'legacy_archived') return 'archived';
    if (p.status === 'inactive') return 'inactive';
    return 'active';
  };

  // Status counts
  const activeCount = participants.filter((p) => getParticipantStatus(p) === 'active').length;
  const inactiveCount = participants.filter((p) => getParticipantStatus(p) === 'inactive').length;
  const archivedCount = participants.filter((p) => getParticipantStatus(p) === 'archived').length;

  // Filtered Participants based on search term & status filter
  const filtered = participants
    .filter((p) => {
      const status = getParticipantStatus(p);
      if (statusFilter === 'active') return status === 'active';
      if (statusFilter === 'inactive') return status === 'inactive';
      if (statusFilter === 'archived') return status === 'archived';
      return true; // 'all'
    })
    .filter(
      (p) =>
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ndisNumber.includes(searchTerm) ||
        p.suburb.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const activeParticipant =
    participants.find((p) => p.id === selectedParticipantId) || filtered[0] || participants[0];

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForArchive((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedForArchive.length === filtered.length) {
      setSelectedForArchive([]);
    } else {
      setSelectedForArchive(filtered.map((p) => p.id));
    }
  };

  const handleExecuteBulkArchive = () => {
    if (selectedForArchive.length === 0) return;
    archiveParticipants(selectedForArchive);
    setFeedbackMessage(`Successfully moved ${selectedForArchive.length} participant profile(s) to legacy archive status.`);
    setSelectedForArchive([]);
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const handleExecuteBulkRestore = () => {
    if (selectedForArchive.length === 0) return;
    restoreParticipants(selectedForArchive);
    setFeedbackMessage(`Restored ${selectedForArchive.length} participant profile(s) back to active caseload.`);
    setSelectedForArchive([]);
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

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
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Dropdown Filter */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200">
            <Filter className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <label htmlFor="participant-status-filter" className="text-slate-400 text-xs font-medium whitespace-nowrap">
              Status:
            </label>
            <select
              id="participant-status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'active' | 'inactive' | 'archived' | 'all');
                setSelectedForArchive([]);
              }}
              className="bg-transparent text-slate-200 font-bold text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="active" className="bg-slate-900 text-slate-200">Active ({activeCount})</option>
              <option value="inactive" className="bg-slate-900 text-slate-200">Inactive ({inactiveCount})</option>
              <option value="archived" className="bg-slate-900 text-slate-200">Archived ({archivedCount})</option>
              <option value="all" className="bg-slate-900 text-slate-200">All ({participants.length})</option>
            </select>
          </div>

          <div className="relative w-56 sm:w-64">
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
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-semibold transition shadow-sm"
            title="Import Participant Profiles & Care Plans from CSV"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => setIsAuditPdfModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 text-teal-300 rounded-lg text-xs font-semibold transition shadow-sm"
            title="Open NDIS Audit Record & PDF Print Center"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Audit PDF / Print</span>
          </button>

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

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-white font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Caseload Grid & Detail Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Participants List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Filter Tabs & Bulk Actions Toolbar */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {/* Dropdown Filter for Caseload Status */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <label htmlFor="caseload-status-dropdown" className="text-slate-400 font-medium text-[11px] whitespace-nowrap">
                  Filter:
                </label>
                <select
                  id="caseload-status-dropdown"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as 'active' | 'inactive' | 'archived' | 'all');
                    setSelectedForArchive([]);
                  }}
                  className="bg-slate-800 text-slate-100 font-semibold text-xs py-0.5 px-2 rounded border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="active">Active ({activeCount})</option>
                  <option value="inactive">Inactive ({inactiveCount})</option>
                  <option value="archived">Archived ({archivedCount})</option>
                  <option value="all">All ({participants.length})</option>
                </select>
              </div>

              {filtered.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-[11px] font-semibold text-slate-400 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                >
                  {selectedForArchive.length === filtered.length && filtered.length > 0 ? (
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>{selectedForArchive.length === filtered.length ? 'Deselect All' : 'Select All'}</span>
                </button>
              )}
            </div>

            {/* Bulk Action Controls Bar */}
            {selectedForArchive.length > 0 && (
              <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700 flex items-center justify-between text-xs shadow-md">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  {selectedForArchive.length} selected
                </span>

                <div className="flex items-center gap-2">
                  {statusFilter === 'archived' ? (
                    <button
                      onClick={handleExecuteBulkRestore}
                      className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1.5 transition shadow"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5" />
                      <span>Restore to Active ({selectedForArchive.length})</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleExecuteBulkArchive}
                      className="px-2.5 py-1 rounded bg-rose-600/90 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 transition shadow"
                      title="Move selected profiles to legacy archive to streamline active dashboard"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Bulk Archive ({selectedForArchive.length})</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedForArchive([])}
                    className="px-2 py-1 rounded text-slate-400 hover:text-slate-200 font-medium"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-400">
                  {statusFilter === 'archived'
                    ? 'No legacy archived participants found.'
                    : statusFilter === 'inactive'
                    ? 'No inactive participants found.'
                    : 'No matching participants found.'}
                </p>
              </div>
            ) : (
              filtered.map((p) => {
                const isSelected = activeParticipant?.id === p.id;
                const isChecked = selectedForArchive.includes(p.id);
                const burnPercent = Math.round((p.consumedBudget / p.totalAllocatedBudget) * 100);
                const age = calculateAge(p.dateOfBirth);
                const pStatus = getParticipantStatus(p);

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
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={(e) => handleToggleSelect(p.id, e)}
                          className="mt-0.5 text-slate-400 hover:text-white transition cursor-pointer"
                          title={isChecked ? 'Deselect' : 'Select for bulk archive'}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500" />
                          )}
                        </button>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-100 text-sm">{p.fullName}</span>
                            {age !== null && (
                              <span className="px-2 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold font-mono">
                                {age} years old
                              </span>
                            )}
                            {pStatus === 'active' && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                                Active
                              </span>
                            )}
                            {pStatus === 'inactive' && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                                Inactive
                              </span>
                            )}
                            {pStatus === 'archived' && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-semibold">
                                Archived
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            NDIS: {p.ndisNumber} {p.dateOfBirth && `• DOB: ${p.dateOfBirth}`}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${
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
              })
            )}
          </div>
        </div>

        {/* Selected Participant Detailed Card (7 cols) */}
        {activeParticipant && (
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">{activeParticipant.fullName}</h2>
                  {getParticipantStatus(activeParticipant) === 'inactive' ? (
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                      Inactive / On Hold
                    </span>
                  ) : getParticipantStatus(activeParticipant) === 'archived' ? (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold">
                      Legacy Archived
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      Active Plan
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                  <span>NDIS: {activeParticipant.ndisNumber}</span>
                  <span>DOB: {activeParticipant.dateOfBirth}</span>
                  <span>Gender: {activeParticipant.gender}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
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

                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => printParticipantCarePlan(activeParticipant, protocols)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition"
                    title="Print Official Care Plan"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={() => downloadParticipantPdf(activeParticipant, { protocols })}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition shadow-sm"
                    title="Download Official NDIS Audit PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => setIsAuditPdfModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 text-xs font-semibold transition shadow-sm"
                    title="Open Full Audit Document & Compliance Declaration"
                  >
                    <span>Audit View</span>
                  </button>
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

            {/* NDIS Participant Goals */}
            {activeParticipant.goals && activeParticipant.goals.length > 0 && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    NDIS Participant Goals ({activeParticipant.goals.length})
                  </span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeParticipant.goals.map((g) => (
                    <div
                      key={g.id}
                      className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{g.title}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            g.status === 'achieved'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {g.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{g.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                        <span className="uppercase">Category: {g.category.replace('_', ' ')}</span>
                        <span>Target: {new Date(g.targetDate).toLocaleDateString('en-AU')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Authorised Restrictive Practices (if any) */}
            {protocols.filter((p) => p.participantId === activeParticipant.id).length > 0 && (
              <div className="space-y-2 text-xs">
                <span className="font-bold text-rose-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Authorised Restrictive Practice Protocols
                </span>
                <div className="space-y-2">
                  {protocols
                    .filter((p) => p.participantId === activeParticipant.id)
                    .map((proto) => (
                      <div
                        key={proto.id}
                        className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-300 uppercase">{proto.type} Restraint</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Expires: {proto.expiryDate}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{proto.description}</p>
                        <div className="text-[10px] text-slate-400">
                          Panel: {proto.authorisingBody}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

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

      {/* CSV Import Modal */}
      <ParticipantImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* NDIS Audit PDF & Print Modal */}
      <ParticipantAuditPdfModal
        isOpen={isAuditPdfModalOpen}
        onClose={() => setIsAuditPdfModalOpen(false)}
        participant={activeParticipant}
      />
    </div>
  );
};
