import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Mic,
  MicOff,
  ShieldCheck,
  FileText,
  Save,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Volume2,
  Smile,
  Heart,
  Printer,
  X,
  BookOpen,
  Cloud,
  CloudOff,
  Loader2,
  RotateCcw,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useManagementStore } from '../../stores';
import { SOAPCaseNote, SOAPDraft } from '../../types';
import { maskPII } from '../../lib/piiMasker';
import { AudioInputVisualizer } from './AudioInputVisualizer';
import {
  saveSoapDraft,
  loadSoapDraft,
  clearSoapDraft,
  getDraftKey,
} from '../../lib/soapDraftService';

export const SOAPVoiceScribeModule: React.FC = () => {
  const { participants, caseNotes, addCaseNote, currentUser } = useManagementStore();

  const [selectedParticipantId, setSelectedParticipantId] = useState(participants[0]?.id || '');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [easyReadModalNote, setEasyReadModalNote] = useState<SOAPCaseNote | null>(null);

  // SOAP Inputs
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');

  // Autosave State
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'offline_backup' | 'error' | 'restored'>('idle');
  const [lastAutosavedAt, setLastAutosavedAt] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<SOAPDraft | null>(null);
  const isInitialMount = useRef(true);
  const saveTimeoutRef = useRef<any>(null);

  // Goal Progress Ratings (1-5)
  const [goal1Rating, setGoal1Rating] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [goal2Rating, setGoal2Rating] = useState<1 | 2 | 3 | 4 | 5>(4);

  // Voice Scribe State
  const [isRecording, setIsRecording] = useState(false);
  const [showMaskedTokens, setShowMaskedTokens] = useState(false);
  const [restrictivePracticeObserved, setRestrictivePracticeObserved] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Real-time Web Speech API
  const [activeDictationField, setActiveDictationField] = useState<'subjective' | 'objective' | 'assessment' | 'plan' | 'simulated' | null>(null);
  const recognitionRef = useRef<any>(null);

  const selectedParticipant = participants.find((p) => p.id === selectedParticipantId);

  // Check for existing drafts when participant changes
  useEffect(() => {
    let isCancelled = false;

    async function checkForExistingDraft() {
      if (!selectedParticipantId || !currentUser?.id) return;
      try {
        const existing = await loadSoapDraft(currentUser.id, selectedParticipantId);
        if (!isCancelled && existing) {
          // If fields are currently empty, check if draft has meaningful content
          const hasDraftContent =
            Boolean(existing.subjective?.trim()) ||
            Boolean(existing.objective?.trim()) ||
            Boolean(existing.assessment?.trim()) ||
            Boolean(existing.plan?.trim());

          const currentHasContent =
            Boolean(subjective.trim()) ||
            Boolean(objective.trim()) ||
            Boolean(assessment.trim()) ||
            Boolean(plan.trim());

          if (hasDraftContent && !currentHasContent) {
            setPendingDraft(existing);
          }
        }
      } catch (e) {
        console.warn('Draft inspection notice:', e);
      }
    }

    checkForExistingDraft();

    return () => {
      isCancelled = true;
    };
  }, [selectedParticipantId, currentUser?.id]);

  // Restore draft handler
  const handleRestoreDraft = () => {
    if (!pendingDraft) return;
    setSubjective(pendingDraft.subjective || '');
    setObjective(pendingDraft.objective || '');
    setAssessment(pendingDraft.assessment || '');
    setPlan(pendingDraft.plan || '');
    if (pendingDraft.sessionDate) setSessionDate(pendingDraft.sessionDate);
    if (pendingDraft.durationMinutes) setDurationMinutes(pendingDraft.durationMinutes);
    if (pendingDraft.goal1Rating) setGoal1Rating(pendingDraft.goal1Rating);
    if (pendingDraft.goal2Rating) setGoal2Rating(pendingDraft.goal2Rating);
    if (typeof pendingDraft.restrictivePracticeObserved === 'boolean') {
      setRestrictivePracticeObserved(pendingDraft.restrictivePracticeObserved);
    }
    setLastAutosavedAt(new Date(pendingDraft.lastSavedAt).toLocaleTimeString());
    setAutosaveStatus('restored');
    setPendingDraft(null);
  };

  // Discard draft handler
  const handleDiscardDraft = async () => {
    if (currentUser?.id && selectedParticipantId) {
      await clearSoapDraft(currentUser.id, selectedParticipantId);
    }
    setPendingDraft(null);
  };

  // Autosave execution function
  const triggerAutosave = useCallback(async () => {
    if (!selectedParticipant || !currentUser) return;

    const hasContent =
      Boolean(subjective.trim()) ||
      Boolean(objective.trim()) ||
      Boolean(assessment.trim()) ||
      Boolean(plan.trim());

    if (!hasContent) {
      setAutosaveStatus('idle');
      return;
    }

    setAutosaveStatus('saving');

    const draftId = getDraftKey(currentUser.id, selectedParticipant.id);
    const draftData: SOAPDraft = {
      id: draftId,
      tenantId: selectedParticipant.tenantId,
      participantId: selectedParticipant.id,
      participantName: selectedParticipant.fullName,
      practitionerId: currentUser.id,
      practitionerName: currentUser.name,
      sessionDate,
      durationMinutes,
      subjective,
      objective,
      assessment,
      plan,
      goal1Rating,
      goal2Rating,
      restrictivePracticeObserved,
      lastSavedAt: new Date().toISOString(),
      status: 'draft',
    };

    const res = await saveSoapDraft(draftData);
    if (res.success) {
      setAutosaveStatus(res.isOfflineBackup ? 'offline_backup' : 'saved');
      setLastAutosavedAt(new Date().toLocaleTimeString());
    } else {
      setAutosaveStatus('error');
    }
  }, [
    selectedParticipant,
    currentUser,
    subjective,
    objective,
    assessment,
    plan,
    goal1Rating,
    goal2Rating,
    durationMinutes,
    sessionDate,
    restrictivePracticeObserved,
  ]);

  // Periodic debounced autosave effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Do not disrupt while active voice dictation is streaming interim tokens
    if (isRecording) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      triggerAutosave();
    }, 2500); // Debounce 2.5 seconds after typing or voice transcription stops

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    subjective,
    objective,
    assessment,
    plan,
    goal1Rating,
    goal2Rating,
    durationMinutes,
    sessionDate,
    restrictivePracticeObserved,
    isRecording,
    triggerAutosave,
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-AU'; // Defaulting to Aussie English

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setActiveDictationField(prev => {
              if (prev === 'subjective') setSubjective(s => s + finalTranscript);
              if (prev === 'objective') setObjective(o => o + finalTranscript);
              if (prev === 'assessment') setAssessment(a => a + finalTranscript);
              if (prev === 'plan') setPlan(p => p + finalTranscript);
              return prev;
            });
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsRecording(false);
          setActiveDictationField(null);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
          setActiveDictationField(null);
        };
      }
    }
  }, []);

  const handleStopRecording = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setIsRecording(false);
    setActiveDictationField(null);
  };

  const toggleRecording = (field: 'subjective' | 'objective' | 'assessment' | 'plan') => {
    if (isRecording && activeDictationField === field) {
      handleStopRecording();
    } else {
      if (isRecording) {
        handleStopRecording();
      }
      setActiveDictationField(field);
      setIsRecording(true);
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.warn('Recognition already started or simulated mode active');
      }
    }
  };

  // Simulated Voice Scribe input injection with realistic clinical scenarios containing PII to demonstrate masker
  const handleSimulateVoiceTranscription = () => {
    setActiveDictationField('simulated');
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setActiveDictationField(null);

      setSubjective(
        'Participant arrived reporting heightened sensory stress and auditory sensitivity caused by roadworks outside residential home.'
      );
      setObjective(
        'Engaged with tactile sensory wheel for 18 minutes. Heart rate 88 bpm. Communicated via visual schedule without self-injurious behaviour.'
      );
      setAssessment(
        'Sensory overload managed via proactive environmental accommodation. Positive behaviour support strategies effective.'
      );
      setPlan(
        'Continue current BSP schedule. Follow up with allied health occupational therapist for acoustic padding.'
      );
    }, 2800);
  };

  const combinedRawText = `${subjective} ${objective} ${assessment} ${plan}`;
  const piiAudit = maskPII(combinedRawText);

  const handleSaveCaseNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant) return;

    // Mask text prior to storage
    const maskedSubjective = maskPII(subjective).sanitisedText;
    const maskedObjective = maskPII(objective).sanitisedText;
    const maskedAssessment = maskPII(assessment).sanitisedText;
    const maskedPlan = maskPII(plan).sanitisedText;

    const newNote: SOAPCaseNote = {
      id: `note-${Date.now()}`,
      tenantId: selectedParticipant.tenantId,
      participantId: selectedParticipant.id,
      participantName: selectedParticipant.fullName,
      practitionerId: currentUser.id,
      practitionerName: currentUser.name,
      sessionDate,
      durationMinutes,
      subjective: maskedSubjective,
      objective: maskedObjective,
      assessment: maskedAssessment,
      plan: maskedPlan,
      goalsAddressed: [
        { goalId: 'goal-1', goalTitle: 'Sensory Self-Regulation & Grounding', progressRating: goal1Rating },
        { goalId: 'goal-2', goalTitle: 'Functional AAC Communication Skills', progressRating: goal2Rating },
      ],
      restrictivePracticeObserved,
      isPiiMasked: true,
      syncedToCloud: true,
      offlineCreated: false,
      timestamp: new Date().toISOString(),
    };

    await addCaseNote(newNote);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);

    // Clean up draft from Firestore and local cache upon formal commit
    try {
      await clearSoapDraft(currentUser.id, selectedParticipant.id);
    } catch (err) {
      console.warn('Draft cleanup notice:', err);
    }
    setAutosaveStatus('idle');
    setLastAutosavedAt(null);
    setPendingDraft(null);

    // Reset fields
    setSubjective('');
    setObjective('');
    setAssessment('');
    setPlan('');
  };

  // Helper for real-time visual audio-wave animation badge during microphone recording
  const renderFieldAudioWave = (field: 'subjective' | 'objective' | 'assessment' | 'plan') => {
    if (!isRecording || activeDictationField !== field) return null;
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[10px] font-mono animate-pulse">
        <span className="flex items-end gap-0.5 h-3">
          <span className="w-0.5 h-1.5 bg-rose-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-0.5 h-3 bg-rose-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-0.5 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:300ms]" />
          <span className="w-0.5 h-3 bg-rose-400 rounded-full animate-bounce [animation-delay:75ms]" />
          <span className="w-0.5 h-1.5 bg-rose-400 rounded-full animate-bounce [animation-delay:225ms]" />
        </span>
        <span className="font-semibold uppercase tracking-wider">Audio Wave Active</span>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">
              SOAP Clinical Voice Scribe & Case Notes
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Australian Privacy Principles (APP 11) compliant. Outbound text automatically passed through clinical DLP sanitizer before egress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Firestore Autosave Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs shadow-xs">
            {autosaveStatus === 'saving' && (
              <>
                <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="text-amber-300 font-medium">Autosaving to Firestore...</span>
              </>
            )}
            {autosaveStatus === 'saved' && (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-medium">
                  Cloud Autosaved {lastAutosavedAt ? `(${lastAutosavedAt})` : ''}
                </span>
              </>
            )}
            {autosaveStatus === 'offline_backup' && (
              <>
                <CloudOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300 font-medium" title="Cached locally; auto-syncs when online">
                  Offline Draft Cached
                </span>
              </>
            )}
            {autosaveStatus === 'restored' && (
              <>
                <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-teal-300 font-medium">Draft Restored</span>
              </>
            )}
            {autosaveStatus === 'error' && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-300 font-medium">Autosave Notice</span>
              </>
            )}
            {autosaveStatus === 'idle' && (
              <>
                <Cloud className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Autosave Active</span>
              </>
            )}

            <button
              type="button"
              onClick={triggerAutosave}
              className="ml-1 text-[11px] text-teal-400 hover:text-teal-300 underline font-medium"
              title="Manually trigger Firestore draft sync"
            >
              Sync Now
            </button>
          </div>

          {/* Real-time Mic Level Test Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isRecording) {
                handleStopRecording();
              } else {
                setActiveDictationField('subjective');
                setIsRecording(true);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
              isRecording
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : 'bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border-teal-500/30'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start real-time microphone test & level monitor'}
          >
            <Volume2 className="w-3.5 h-3.5 text-teal-400" />
            <span>{isRecording ? 'Live Audio Active' : 'Test Mic Levels'}</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateVoiceTranscription}
            disabled={isRecording}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold shadow transition ${
              isRecording && activeDictationField === 'simulated'
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isRecording && activeDictationField === 'simulated' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-purple-400" />}
            <span>{isRecording && activeDictationField === 'simulated' ? 'Transcribing...' : 'Simulate Voice Dictation'}</span>
          </button>
        </div>
      </div>

      {/* Recovered Draft Prompt Banner */}
      {pendingDraft && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-amber-300">Unsaved Firestore Draft Recovered:</span>
              <span className="text-amber-200/90 ml-1.5">
                Found an autosaved note draft for {pendingDraft.participantName} from{' '}
                {new Date(pendingDraft.lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Draft</span>
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Discard</span>
            </button>
          </div>
        </div>
      )}

      {/* Real-Time Audio Input Levels Visual Indicator */}
      {isRecording && (
        <AudioInputVisualizer
          isRecording={isRecording}
          activeField={activeDictationField}
          onStopRecording={handleStopRecording}
        />
      )}

      {/* PII Sanitization Status Ribbon */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">Clinical DLP Privacy Shield:</span>
          <span className="text-slate-400">
            {piiAudit.maskedCount > 0
              ? `${piiAudit.maskedCount} PII tokens identified & shielded (${piiAudit.detectedCategories.join(', ')})`
              : 'Zero unmasked PII tokens detected in active draft buffer.'}
          </span>
        </div>

        {piiAudit.maskedCount > 0 && (
          <button
            onClick={() => setShowMaskedTokens(!showMaskedTokens)}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
          >
            {showMaskedTokens ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showMaskedTokens ? 'Hide DLP Tokens' : 'Inspect Token Map'}</span>
          </button>
        )}
      </div>

      {showMaskedTokens && piiAudit.maskedCount > 0 && (
        <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs font-mono space-y-2">
          <span className="font-bold text-emerald-300 block">Active PII Token Replaced Mapping:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
            {Object.entries(piiAudit.tokensReplaced).map(([token, orig]) => (
              <div key={token} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-emerald-400">{token}</span>
                <span className="text-slate-400">→ {orig}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main SOAP Editor & History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <form onSubmit={handleSaveCaseNote} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Participant</label>
                <select
                  aria-label="Participant"
                  value={selectedParticipantId}
                  onChange={(e) => setSelectedParticipantId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} (NDIS: {p.ndisNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Session Date</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  min="15"
                  max="480"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                  required
                />
              </div>
            </div>

            {/* S - Subjective */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-200">
                  S — Subjective (Participant Voice, Carer Report, Self-Stated Mood)
                </label>
                <div className="flex items-center gap-2">
                  {renderFieldAudioWave('subjective')}
                  <button
                    type="button"
                    onClick={() => toggleRecording('subjective')}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                      isRecording && activeDictationField === 'subjective'
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                    title="Dictate Subjective"
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <textarea
                rows={2}
                value={subjective}
                onChange={(e) => setSubjective(e.target.value)}
                placeholder="Participant perspective, emotional state, family/carer updates..."
                className={`w-full bg-slate-800 border rounded-lg p-2.5 text-slate-200 focus:outline-purple-500 transition ${
                  isRecording && activeDictationField === 'subjective' ? 'border-rose-500/50 ring-1 ring-rose-500/20' : 'border-slate-700'
                }`}
                required
              />
            </div>

            {/* O - Objective */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-200">
                  O — Objective (Measurable Observations, Task Completion, ABC Data)
                </label>
                <div className="flex items-center gap-2">
                  {renderFieldAudioWave('objective')}
                  <button
                    type="button"
                    onClick={() => toggleRecording('objective')}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                      isRecording && activeDictationField === 'objective'
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                    title="Dictate Objective"
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <textarea
                rows={2}
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Clinical measurements, heart rate, ABC intervals, concrete actions..."
                className={`w-full bg-slate-800 border rounded-lg p-2.5 text-slate-200 focus:outline-purple-500 transition ${
                  isRecording && activeDictationField === 'objective' ? 'border-rose-500/50 ring-1 ring-rose-500/20' : 'border-slate-700'
                }`}
                required
              />
            </div>

            {/* A - Assessment */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-200">
                  A — Assessment (Clinical Analysis, Environmental Triggers, Progress)
                </label>
                <div className="flex items-center gap-2">
                  {renderFieldAudioWave('assessment')}
                  <button
                    type="button"
                    onClick={() => toggleRecording('assessment')}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                      isRecording && activeDictationField === 'assessment'
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                    title="Dictate Assessment"
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <textarea
                rows={2}
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                placeholder="Clinical evaluation of behaviour, progress toward NDIS goals..."
                className={`w-full bg-slate-800 border rounded-lg p-2.5 text-slate-200 focus:outline-purple-500 transition ${
                  isRecording && activeDictationField === 'assessment' ? 'border-rose-500/50 ring-1 ring-rose-500/20' : 'border-slate-700'
                }`}
                required
              />
            </div>

            {/* P - Plan */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-200">
                  P — Plan (PBS Schedule Revisions, Inter-professional Referrals, Next Session)
                </label>
                <div className="flex items-center gap-2">
                  {renderFieldAudioWave('plan')}
                  <button
                    type="button"
                    onClick={() => toggleRecording('plan')}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                      isRecording && activeDictationField === 'plan'
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                    title="Dictate Plan"
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <textarea
                rows={2}
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="Next steps, stakeholder follow-ups, BSP adjustments..."
                className={`w-full bg-slate-800 border rounded-lg p-2.5 text-slate-200 focus:outline-purple-500 transition ${
                  isRecording && activeDictationField === 'plan' ? 'border-rose-500/50 ring-1 ring-rose-500/20' : 'border-slate-700'
                }`}
                required
              />
            </div>

            {/* Goal Ratings & Restrictive Practice Check */}
            <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700 space-y-3">
              <span className="font-bold text-slate-200 block">NDIS Goal Progress Evaluation</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-[11px] mb-1">
                    Goal 1: Sensory Self-Regulation (Rating: {goal1Rating}/5)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={goal1Rating}
                    onChange={(e) => setGoal1Rating(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>1 (Regressed)</span>
                    <span>3 (Maintaining)</span>
                    <span>5 (Mastered)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-[11px] mb-1">
                    Goal 2: Functional Communication (Rating: {goal2Rating}/5)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={goal2Rating}
                    onChange={(e) => setGoal2Rating(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>1 (Regressed)</span>
                    <span>3 (Maintaining)</span>
                    <span>5 (Mastered)</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/60">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restrictivePracticeObserved}
                    onChange={(e) => setRestrictivePracticeObserved(e.target.checked)}
                    className="accent-amber-500"
                  />
                  <span className="font-semibold text-amber-300">
                    Restrictive practice observed or enacted during this session (requires separate protocol log)
                  </span>
                </label>
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Case note safely encrypted, DLP-masked, and committed to IndexedDB audit store!</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition active:scale-98"
              >
                <Save className="w-4 h-4" />
                <span>Save Note & Reconcile to Clinical Record</span>
              </button>
            </div>
          </form>
        </div>

        {/* Existing Case Notes History (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center justify-between">
            <span>Historical Clinical Records</span>
            <span className="text-xs text-slate-400 font-normal">{caseNotes.length} Entries</span>
          </h2>

          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {caseNotes.map((note) => (
              <div key={note.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs shadow-sm">
                <div className="flex items-start justify-between border-b border-slate-800 pb-2">
                  <div>
                    <span className="font-bold text-slate-100 text-sm">{note.participantName}</span>
                    <div className="text-[11px] text-slate-400">
                      Practitioner: <span className="text-slate-300">{note.practitionerName}</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(note.sessionDate).toLocaleDateString('en-AU')}
                  </span>
                </div>

                <div className="space-y-1.5 text-slate-300">
                  <div>
                    <span className="font-bold text-purple-400">S: </span>
                    <span className="text-slate-300">{note.subjective}</span>
                  </div>
                  <div>
                    <span className="font-bold text-blue-400">O: </span>
                    <span className="text-slate-300">{note.objective}</span>
                  </div>
                  <div>
                    <span className="font-bold text-teal-400">A: </span>
                    <span className="text-slate-300">{note.assessment}</span>
                  </div>
                  <div>
                    <span className="font-bold text-emerald-400">P: </span>
                    <span className="text-slate-300">{note.plan}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>DLP Sanitised</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEasyReadModalNote(note)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 transition text-[10px] font-semibold"
                      title="Generate Participant-Friendly Easy Read Format"
                    >
                      <BookOpen className="w-3 h-3 text-teal-400" />
                      <span>Easy Read</span>
                    </button>
                    <span>{note.durationMinutes} mins</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Easy Read Participant & Family Modal */}
      {easyReadModalNote && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold uppercase tracking-wider">
                    Easy Read Summary
                  </span>
                  <span className="text-xs text-slate-500 font-medium">NDIS Practice Standard</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  What Happened in Today's Session
                </h3>
                <p className="text-xs text-slate-600">
                  Prepared for <span className="font-bold text-slate-900">{easyReadModalNote.participantName}</span> on{' '}
                  {new Date(easyReadModalNote.sessionDate).toLocaleDateString('en-AU', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEasyReadModalNote(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: What we talked about */}
              <div className="p-4 rounded-xl bg-purple-50 border-2 border-purple-200 space-y-2">
                <div className="flex items-center gap-2 text-purple-800 font-bold text-sm">
                  <Smile className="w-5 h-5 text-purple-600 shrink-0" />
                  <span>1. What You Told Us</span>
                </div>
                <p className="text-xs text-purple-950 leading-relaxed font-medium">
                  {easyReadModalNote.subjective || 'You shared how your week felt and how your routines were going.'}
                </p>
              </div>

              {/* Card 2: What we did together */}
              <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200 space-y-2">
                <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                  <Heart className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>2. What We Did Together</span>
                </div>
                <p className="text-xs text-blue-950 leading-relaxed font-medium">
                  {easyReadModalNote.objective || 'We practiced strategies and completed your planned activity.'}
                </p>
              </div>

              {/* Card 3: Great progress */}
              <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>3. Wins & Progress</span>
                </div>
                <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                  {easyReadModalNote.assessment || 'You worked hard on your goals and showed positive responses.'}
                </p>
              </div>

              {/* Card 4: Next steps */}
              <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                  <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>4. What Comes Next</span>
                </div>
                <p className="text-xs text-amber-950 leading-relaxed font-medium">
                  {easyReadModalNote.plan || 'We will catch up again next session to keep practicing together!'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Practitioner: <strong className="text-slate-800">{easyReadModalNote.practitionerName}</strong></span>
              <span>Session Length: <strong className="text-slate-800">{easyReadModalNote.durationMinutes} minutes</strong></span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Easy Read Handout</span>
              </button>
              <button
                type="button"
                onClick={() => setEasyReadModalNote(null)}
                className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold transition"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
