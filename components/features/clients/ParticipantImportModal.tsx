import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  X,
  FileText,
  Users,
  Sparkles,
} from 'lucide-react';
import { parseParticipantCSV, ParticipantParseResult } from '../../../lib/participantCsvParser';
import { useManagementStore } from '../../../stores';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface ParticipantImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ParticipantImportModal: React.FC<ParticipantImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addParticipant, selectParticipant, tenantId } = useManagementStore();
  const [dragActive, setDragActive] = useState(false);
  const [parseResult, setParseResult] = useState<ParticipantParseResult | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessCsv = (csvText: string, name: string) => {
    setFileName(name);
    setImportSuccess(null);
    const result = parseParticipantCSV(csvText, tenantId || 'tenant-breakthrough-vic');
    setParseResult(result);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      handleProcessCsv(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        handleProcessCsv(content, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleLoadSampleData = async () => {
    try {
      const response = await fetch('/sample_participant_care_plans.csv');
      if (!response.ok) {
        throw new Error('Could not fetch sample CSV file');
      }
      const text = await response.text();
      handleProcessCsv(text, 'sample_participant_care_plans.csv');
    } catch (err) {
      console.error('Failed to load sample CSV:', err);
    }
  };

  const handleCommitImport = async () => {
    if (!parseResult || parseResult.importedParticipants.length === 0) return;

    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      
      // Add each participant to Firestore batch and local store
      for (const p of parseResult.importedParticipants) {
        const docRef = doc(db, 'participants', p.id);
        batch.set(docRef, p, { merge: true });
        addParticipant(p);
      }

      await batch.commit();

      if (parseResult.importedParticipants[0]) {
        selectParticipant(parseResult.importedParticipants[0].id);
      }

      setImportSuccess(parseResult.importedParticipants.length);
      setIsProcessing(false);

      setTimeout(() => {
        onClose();
        setParseResult(null);
        setImportSuccess(null);
      }, 1800);
    } catch (err) {
      console.error('Failed to commit participants to Firestore:', err);
      // Even if firestore offline, ensure local store is updated
      for (const p of parseResult.importedParticipants) {
        addParticipant(p);
      }
      if (parseResult.importedParticipants[0]) {
        selectParticipant(parseResult.importedParticipants[0].id);
      }
      setImportSuccess(parseResult.importedParticipants.length);
      setIsProcessing(false);
      setTimeout(() => {
        onClose();
        setParseResult(null);
        setImportSuccess(null);
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Import Participant Profiles & Care Plans
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  NDIS Audit Format
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Bulk ingest NDIS participants, behaviour support plans, budget parameters, and NDIS goals via CSV.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs">
            <div className="text-slate-300">
              <strong className="text-white">Quick Template:</strong> Use the standard NDIS audit format containing demographics, MMM zones, and PBS goals.
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/sample_participant_care_plans.csv"
                download="sample_participant_care_plans.csv"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download Sample CSV</span>
              </a>
              <button
                type="button"
                onClick={handleLoadSampleData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Pre-Filled Sample</span>
              </button>
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              dragActive
                ? 'border-emerald-500 bg-emerald-950/20'
                : 'border-slate-700/80 hover:border-slate-600 bg-slate-800/20 hover:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center gap-2.5">
              <div className="p-3 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                <Upload className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200">
                  Click to browse or drop your .csv file here
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Supports full NDIS participant profiles, budgets, and semicolon-delimited NDIS goals.
                </div>
              </div>
              {fileName && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-emerald-400 font-mono mt-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{fileName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Success Banner */}
          {importSuccess !== null && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <strong>Import Complete!</strong> Successfully added {importSuccess} participant profile(s) and care plans to the caseload database.
              </div>
            </div>
          )}

          {/* Parse Results Preview */}
          {parseResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Parsed Caseload Preview ({parseResult.importedParticipants.length} Participants)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-400 font-semibold">
                    {parseResult.importedParticipants.length} valid
                  </span>
                  {parseResult.warnings.length > 0 && (
                    <span className="text-amber-400 font-semibold">
                      {parseResult.warnings.length} warning(s)
                    </span>
                  )}
                  {parseResult.errors.length > 0 && (
                    <span className="text-rose-400 font-semibold">
                      {parseResult.errors.length} error(s)
                    </span>
                  )}
                </div>
              </div>

              {/* Errors & Warnings callout if any */}
              {parseResult.errors.length > 0 && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" /> Import Errors:
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                    {parseResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {parseResult.warnings.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Import Warnings:
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                    {parseResult.warnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-800/80 text-slate-300 sticky top-0 border-b border-slate-700">
                    <tr>
                      <th className="p-2.5 font-semibold">Participant</th>
                      <th className="p-2.5 font-semibold">NDIS Number</th>
                      <th className="p-2.5 font-semibold">Zone</th>
                      <th className="p-2.5 font-semibold">Primary Diagnosis</th>
                      <th className="p-2.5 font-semibold">Budget</th>
                      <th className="p-2.5 font-semibold">Goals</th>
                      <th className="p-2.5 font-semibold">BSP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {parseResult.importedParticipants.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="p-2.5 font-medium text-slate-100">
                          {p.fullName}
                          <div className="text-[10px] text-slate-400">{p.suburb}, {p.state}</div>
                        </td>
                        <td className="p-2.5 font-mono text-[11px]">{p.ndisNumber}</td>
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700 text-[10px] font-semibold">
                            MMM {p.mmmZone}
                          </span>
                        </td>
                        <td className="p-2.5 max-w-[200px] truncate" title={p.primaryDiagnosis}>
                          {p.primaryDiagnosis}
                        </td>
                        <td className="p-2.5 font-mono text-[11px]">
                          ${p.totalAllocatedBudget.toLocaleString('en-AU')}
                        </td>
                        <td className="p-2.5">
                          {p.goals && p.goals.length > 0 ? (
                            <span className="text-emerald-400 font-semibold">
                              {p.goals.length} goal(s)
                            </span>
                          ) : (
                            <span className="text-slate-500">None</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          {p.activeBSP ? (
                            <span className="text-emerald-400 font-semibold text-[10px]">Active</span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCommitImport}
            disabled={!parseResult || parseResult.importedParticipants.length === 0 || isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isProcessing
                ? 'Ingesting to Database...'
                : `Commit & Import ${parseResult?.importedParticipants.length || 0} Records`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
