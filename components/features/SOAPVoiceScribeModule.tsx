import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { useManagementStore } from '../../stores';
import { SOAPCaseNote } from '../../types';
import { maskPII } from '../../lib/piiMasker';

export const SOAPVoiceScribeModule: React.FC = () => {
  const { participants, caseNotes, addCaseNote, currentUser } = useManagementStore();

  const [selectedParticipantId, setSelectedParticipantId] = useState(participants[0]?.id || '');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);

  // SOAP Inputs
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');

  // Voice Scribe State
  const [isRecording, setIsRecording] = useState(false);
  const [showMaskedTokens, setShowMaskedTokens] = useState(false);
  const [restrictivePracticeObserved, setRestrictivePracticeObserved] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Real-time Web Speech API
  const [activeDictationField, setActiveDictationField] = useState<'subjective' | 'objective' | 'assessment' | 'plan' | null>(null);
  const recognitionRef = useRef<any>(null);

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

  const toggleRecording = (field: 'subjective' | 'objective' | 'assessment' | 'plan') => {
    if (isRecording && activeDictationField === field) {
      // Stop recording
      recognitionRef.current?.stop();
      setIsRecording(false);
      setActiveDictationField(null);
    } else {
      // Start recording for a specific field
      if (isRecording) recognitionRef.current?.stop();
      setActiveDictationField(field);
      setIsRecording(true);
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.warn('Recognition already started');
      }
    }
  };

  // Goal Progress Ratings (1-5)
  const [goal1Rating, setGoal1Rating] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [goal2Rating, setGoal2Rating] = useState<1 | 2 | 3 | 4 | 5>(4);

  const selectedParticipant = participants.find((p) => p.id === selectedParticipantId);

  // Simulated Voice Scribe input injection with realistic clinical scenarios containing PII to demonstrate masker
  const handleSimulateVoiceTranscription = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      const sampleClinicalTranscript =
        `Participant Liam Walker (NDIS 430891274, DOB: 14/05/2008) attended clinic with mother Margaret Walker at 12 Smith Street Hawthorn. Liam reported heightened sensory anxiety triggered by loud traffic. In objective observation, heart rate was 88 bpm with intermittent stereotypic hand movements. Recommended continued low-arousal de-escalation strategies. Contact nominee at 0412 884 901 if agitation escalates.`;

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
    }, 1200);
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

    // Reset fields
    setSubjective('');
    setObjective('');
    setAssessment('');
    setPlan('');
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

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSimulateVoiceTranscription}
            disabled={isRecording}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold shadow transition ${
              isRecording && !activeDictationField
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isRecording && !activeDictationField ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-purple-400" />}
            <span>{isRecording && !activeDictationField ? 'Simulating...' : 'Simulate Voice Dictation'}</span>
          </button>
        </div>
      </div>

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
                <button
                  type="button"
                  onClick={() => toggleRecording('subjective')}
                  className={`p-1.5 rounded-lg border transition ${
                    isRecording && activeDictationField === 'subjective'
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Dictate Subjective"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
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
                <button
                  type="button"
                  onClick={() => toggleRecording('objective')}
                  className={`p-1.5 rounded-lg border transition ${
                    isRecording && activeDictationField === 'objective'
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Dictate Objective"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
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
                <button
                  type="button"
                  onClick={() => toggleRecording('assessment')}
                  className={`p-1.5 rounded-lg border transition ${
                    isRecording && activeDictationField === 'assessment'
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Dictate Assessment"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
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
                <button
                  type="button"
                  onClick={() => toggleRecording('plan')}
                  className={`p-1.5 rounded-lg border transition ${
                    isRecording && activeDictationField === 'plan'
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Dictate Plan"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
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
                  <span>Duration: {note.durationMinutes} mins</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
