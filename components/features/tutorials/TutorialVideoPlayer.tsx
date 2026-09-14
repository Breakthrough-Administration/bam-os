import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Film,
  Sparkles,
  CheckCircle2,
  Clock,
  FastForward,
  Rewind,
  FileText,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export interface VideoChapter {
  timeSeconds: number;
  timeDisplay: string;
  title: string;
  actionText: string;
  caption: string;
}

export interface VideoDemoData {
  topicId: string;
  title: string;
  durationSeconds: number;
  durationDisplay: string;
  resolution: string;
  workflowStage: string;
  chapters: VideoChapter[];
  simulationData: {
    moduleName: string;
    screenTitle: string;
    inputSample: string;
    aiActionSample: string;
    auditBadge: string;
    keyMetricLabel: string;
    keyMetricValue: string;
  };
}

interface TutorialVideoPlayerProps {
  topicId: string;
  topicTitle: string;
  regulatoryStandard: string;
  moduleKey: string;
}

export const DEMO_DATA_MAP: Record<string, VideoDemoData> = {
  'tut-dashboard': {
    topicId: 'tut-dashboard',
    title: 'High-Risk Triage & Supervision Escalation Flow',
    durationSeconds: 155,
    durationDisplay: '02:35',
    resolution: '1080p 60fps AI-Gen',
    workflowStage: 'Clinical Governance Handover',
    chapters: [
      {
        timeSeconds: 0,
        timeDisplay: '00:00',
        title: 'Executive Handover Review',
        actionText: 'Loading live caseload status across all branch clinicians...',
        caption: 'Reviewing branch-wide caseload distribution, overdue BSP reviews, and active restrictive practices.',
      },
      {
        timeSeconds: 40,
        timeDisplay: '00:40',
        title: 'High-Risk Alert Triage',
        actionText: 'Filtering participants by critical risk level & expiring state authorisations...',
        caption: 'Identifying participants with recent escalating physical aggression or unverified authorisations.',
      },
      {
        timeSeconds: 95,
        timeDisplay: '01:35',
        title: 'Supervisor Directive Logging',
        actionText: 'Issuing cryptographic supervision note to provisional clinician...',
        caption: 'Logging formal directive to conduct functional behaviour re-assessment with 7-day milestone.',
      },
    ],
    simulationData: {
      moduleName: 'Clinical Supervisor Dashboard',
      screenTitle: 'Participant Triage & Caseload Risk Heatmap',
      inputSample: 'Caseload Review: 4 Practitioners, 18 Active Participants, 3 High-Risk Escalations Pending.',
      aiActionSample: 'AI Triage Engine: Identified BSP Expiring in 12 Days for Participant Liam W. Alerting Lead Clinician.',
      auditBadge: 'Module 2A Practice Standard Compliant',
      keyMetricLabel: 'Supervision Ledger',
      keyMetricValue: '100% Cryptographic Audit Trail',
    },
  },
  'tut-soap': {
    topicId: 'tut-soap',
    title: 'Voice Scribe, Client-Side DLP & SOAP Auto-Structuring',
    durationSeconds: 165,
    durationDisplay: '02:45',
    resolution: '1080p 60fps AI-Gen',
    workflowStage: 'Direct Clinical Documentation',
    chapters: [
      {
        timeSeconds: 0,
        timeDisplay: '00:00',
        title: 'Microphone Calibration & Audio Input',
        actionText: 'Streaming live 16-band audio spectrum with decibel metering...',
        caption: 'Clinician begins verbal dictation of community-based behavior support session in real time.',
      },
      {
        timeSeconds: 45,
        timeDisplay: '00:45',
        title: 'Zero-Leakage DLP Redaction',
        actionText: 'Client-side regex masking NDIS numbers, phone numbers & street addresses...',
        caption: 'Detecting and stripping sensitive PII on the local device before any AI processing or network requests.',
      },
      {
        timeSeconds: 110,
        timeDisplay: '01:50',
        title: 'SOAP Auto-Structuring & Easy Read',
        actionText: 'Structuring observations into Subjective, Objective, Assessment, and Plan quadrants...',
        caption: 'Generating standard clinical SOAP notes alongside participant-friendly 4-quadrant Easy Read summary.',
      },
    ],
    simulationData: {
      moduleName: 'SOAP Voice Scribe & Note Generator',
      screenTitle: 'Real-Time Audio Dictation & Privacy Safeguards',
      inputSample: '"Liam showed calm engagement during community travel. Minor vocal agitation observed at supermarket entrance."',
      aiActionSample: 'DLP Engine: 0 PII Leaks Detected. Categorized under Subjective (Calm Engagement) & Assessment (Sensory Trigger).',
      auditBadge: 'Privacy Act 1988 & APP 11 Certified',
      keyMetricLabel: 'Documentation Time Saved',
      keyMetricValue: '72% Faster Case Note Turnaround',
    },
  },
  'tut-incidents': {
    topicId: 'tut-incidents',
    title: '24-Hour Statutory NDIS Commission Escalation & Evidence Locker',
    durationSeconds: 180,
    durationDisplay: '03:00',
    resolution: '1080p 60fps AI-Gen',
    workflowStage: 'Safeguards & Commission Compliance',
    chapters: [
      {
        timeSeconds: 0,
        timeDisplay: '00:00',
        title: 'Incident Detection & Countdown Activation',
        actionText: 'Evaluating incident classification against NDIS 2018 Incident Management Rules...',
        caption: 'System detects unauthorized restrictive practice and triggers the 24-hour statutory countdown clock.',
      },
      {
        timeSeconds: 55,
        timeDisplay: '00:55',
        title: 'Evidence Gathering & Witness Statements',
        actionText: 'Attaching witness statements, incident diagrams, and practitioner debrief logs...',
        caption: 'Compiling contemporaneous clinical notes and safety debriefing records into the immutable evidence locker.',
      },
      {
        timeSeconds: 125,
        timeDisplay: '02:05',
        title: 'Commission Form Generation & Notification',
        actionText: 'Generating NDIS Quality & Safeguards Commission 24-Hour Notification Pack...',
        caption: 'Producing pre-formatted statutory notification document ready for upload to PRODA NDIS portal.',
      },
    ],
    simulationData: {
      moduleName: 'Incident Management & Safeguards',
      screenTitle: 'Statutory 24-Hour Notification Engine',
      inputSample: 'Emergency Physical Restraint utilized to prevent participant from running into oncoming highway traffic.',
      aiActionSample: 'Triggered Statutory Escalation: Notified Principal Practitioner & Generated Commission 24-Hour Dossier.',
      auditBadge: 'NDIS Incident Rules 2018 Compliant',
      keyMetricLabel: 'Commission Deadline Clock',
      keyMetricValue: 'T-Minus 21h 14m Remaining',
    },
  },
  'tut-roster': {
    topicId: 'tut-roster',
    title: 'SCHADS Award Split-Shift & Broken Shift Allowance Automation',
    durationSeconds: 140,
    durationDisplay: '02:20',
    resolution: '1080p 60fps AI-Gen',
    workflowStage: 'Workforce Operations',
    chapters: [
      {
        timeSeconds: 0,
        timeDisplay: '00:00',
        title: 'Shift Schedule Inspection',
        actionText: 'Analyzing community support shifts against SCHADS Award clause 25.4...',
        caption: 'Evaluating split-shift spans and minimum 2-hour engagement rules across frontline support workers.',
      },
      {
        timeSeconds: 50,
        timeDisplay: '00:50',
        title: 'Allowance & Overtime Computation',
        actionText: 'Calculating broken shift allowances, sleepover allowances & travel time...',
        caption: 'Applying automated Fair Work SCHADS allowances directly into the payroll preview ledger.',
      },
      {
        timeSeconds: 100,
        timeDisplay: '01:40',
        title: 'Roster Publishing & SMS Notification',
        actionText: 'Locking compliant roster and synchronizing shifts to worker mobile schedules...',
        caption: 'Publishing fatigue-checked rosters with zero SCHADS breaches and instant practitioner confirmation.',
      },
    ],
    simulationData: {
      moduleName: 'SCHADS Award Roster Manager',
      screenTitle: 'Split-Shift Compliance & Pay Engine',
      inputSample: 'Shift: 07:00-10:00 (Morning Support) + 16:00-19:00 (Evening Community Access). Total Span: 12 Hours.',
      aiActionSample: 'Fair Work Validator: 1 Broken Shift Allowance ($18.94) + 10-hour rest period validated before next shift.',
      auditBadge: 'SCHADS Modern Award 2010 Aligned',
      keyMetricLabel: 'Roster Compliance Score',
      keyMetricValue: '100% Zero Underpayment Risk',
    },
  },
  'tut-billing': {
    topicId: 'tut-billing',
    title: 'NDIS PAPL Travel Matrix & MM2-MM7 Travel Claims Processing',
    durationSeconds: 150,
    durationDisplay: '02:30',
    resolution: '1080p 60fps AI-Gen',
    workflowStage: 'Finance & Claims Governance',
    chapters: [
      {
        timeSeconds: 0,
        timeDisplay: '00:00',
        title: 'MMM Geographical Zone Verification',
        actionText: 'Resolving destination address against Modified Monash Model zoning...',
        caption: 'Determining statutory travel caps (MM1-MM3 up to 30 mins, MM4-MM5 up to 60 mins) per NDIS Pricing Guide.',
      },
      {
        timeSeconds: 55,
        timeDisplay: '00:55',
        title: 'Travel Apportionment & Non-Labor Costs',
        actionText: 'Splitting return travel across sequential participant appointments...',
        caption: 'Apportioning travel time and mileage per kilometre in strict compliance with NDIS travel rules.',
      },
      {
        timeSeconds: 110,
        timeDisplay: '01:50',
        title: 'PRODA Bulk Claim Export',
        actionText: 'Formatting line items into PRODA Payment Request CSV specification...',
        caption: 'Validating support item codes (01_799_0128_1_1) and exporting zero-error claims files.',
      },
    ],
    simulationData: {
      moduleName: 'NDIS Billing & Travel Calculator',
      screenTitle: 'Modified Monash Model Claim Engine',
      inputSample: 'Travel: Ballarat (MMM 2) to Daylesford (MMM 4). Clinician travel time: 42 minutes.',
      aiActionSample: 'PAPL Engine: Travel Cap 60 min (MM4). Apportioned 42 mins ($135.31) under 01_799_0128_1_1.',
      auditBadge: 'NDIS Pricing Arrangements 2024-25',
      keyMetricLabel: 'Claim Approval Rate',
      keyMetricValue: '99.4% PRODA First-Pass Rate',
    },
  },
};

export const TutorialVideoPlayer: React.FC<TutorialVideoPlayerProps> = ({
  topicId,
  topicTitle,
  regulatoryStandard,
  moduleKey,
}) => {
  const demoData = DEMO_DATA_MAP[topicId] || {
    topicId,
    title: `${topicTitle} - Clinical Procedure Walkthrough`,
    durationSeconds: 145,
    durationDisplay: '02:25',
    resolution: '1080p 60fps AI-Gen',
    workflowStage: 'Core Clinical Workflow',
    chapters: [
      {
        timeSeconds: 0,
        timeDisplay: '00:00',
        title: 'Workflow Orientation & Setup',
        actionText: 'Initializing clinical records and regulatory boundary checks...',
        caption: `Overview of ${topicTitle} adhering strictly to ${regulatoryStandard}.`,
      },
      {
        timeSeconds: 50,
        timeDisplay: '00:50',
        title: 'Executing Clinical Procedure',
        actionText: 'Applying evidence-based positive behaviour intervention steps...',
        caption: 'Practitioner executes procedural steps with live validation and prompt cues.',
      },
      {
        timeSeconds: 105,
        timeDisplay: '01:45',
        title: 'Quality Audit Verification',
        actionText: 'Signing off in immutable audit ledger with practitioner credential...',
        caption: 'Finalizing documentation with NDIS Practice Standards verification.',
      },
    ],
    simulationData: {
      moduleName: topicTitle,
      screenTitle: 'AI-Generated Practice Simulation',
      inputSample: `Clinical Case Note: Routine session completed in compliance with ${regulatoryStandard}.`,
      aiActionSample: 'System Validation: Verified all statutory requirements and practitioner credentials.',
      auditBadge: 'Practice Standards Compliant',
      keyMetricLabel: 'Verification Status',
      keyMetricValue: 'Verified Complete',
    },
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Playback timer loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 1 * playbackSpeed;
          if (next >= demoData.durationSeconds) {
            setIsPlaying(false);
            return demoData.durationSeconds;
          }
          return next;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, demoData.durationSeconds]);

  // Update active chapter based on current time
  useEffect(() => {
    let currentIdx = 0;
    demoData.chapters.forEach((ch, idx) => {
      if (currentTime >= ch.timeSeconds) {
        currentIdx = idx;
      }
    });
    setActiveChapterIndex(currentIdx);
  }, [currentTime, demoData.chapters]);

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  const togglePlay = () => {
    if (currentTime >= demoData.durationSeconds) {
      setCurrentTime(0);
    }
    setIsPlaying((prev) => !prev);
  };

  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleSkip = (seconds: number) => {
    setCurrentTime((prev) => {
      const next = Math.max(0, Math.min(demoData.durationSeconds, prev + seconds));
      return next;
    });
  };

  const handleChapterSelect = (chapter: VideoChapter) => {
    setCurrentTime(chapter.timeSeconds);
    setIsPlaying(true);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const currentChapter = demoData.chapters[activeChapterIndex] || demoData.chapters[0];
  const progressPercent = Math.min(100, (currentTime / demoData.durationSeconds) * 100);

  return (
    <div
      ref={containerRef}
      className="p-5 rounded-2xl bg-slate-950 border border-teal-500/30 shadow-2xl space-y-4 relative overflow-hidden"
    >
      {/* Top Video Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center shrink-0">
            <Film className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase font-bold tracking-wider">
                AI Clinical Demonstration
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{demoData.resolution}</span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">
              {demoData.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate max-w-[280px]">Simulated in Breakthrough Sandbox</span>
        </div>
      </div>

      {/* Main Video Simulation Viewport */}
      <div className="relative w-full aspect-video rounded-xl bg-slate-900 border-2 border-slate-800 overflow-hidden shadow-inner flex flex-col justify-between p-4 group">
        {/* Subtle Scanline / Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        {/* Top Overlay Banner inside Video */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur border border-slate-800 text-[11px] font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-bold text-white uppercase">{demoData.workflowStage}</span>
            <span className="text-slate-500">|</span>
            <span className="text-teal-400">{currentChapter.title}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur border border-teal-500/30 text-[10px] font-medium text-teal-300">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>{demoData.simulationData.auditBadge}</span>
          </div>
        </div>

        {/* Central Simulated Clinical Screen Action Canvas */}
        <div className="relative z-10 my-auto max-w-xl mx-auto w-full p-4 rounded-xl bg-slate-950/90 border border-slate-800 shadow-2xl backdrop-blur space-y-3">
          <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-800 text-slate-400">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{demoData.simulationData.screenTitle}</span>
            </span>
            <span className="font-mono text-teal-300 text-[10px]">
              {formatTime(currentTime)} / {demoData.durationDisplay}
            </span>
          </div>

          {/* Dynamic Simulated Action Line */}
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-slate-400">Live Simulation Event:</div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-xs text-teal-300 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              <span className="truncate">{currentChapter.actionText}</span>
            </div>
          </div>

          {/* Workflow Data Snippet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400">Clinician Action / Voice Input:</div>
              <p className="text-slate-300 line-clamp-2 italic">{demoData.simulationData.inputSample}</p>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-teal-500/20 space-y-1">
              <div className="text-[10px] text-teal-400">System AI Safeguard Response:</div>
              <p className="text-teal-200 line-clamp-2">{demoData.simulationData.aiActionSample}</p>
            </div>
          </div>
        </div>

        {/* Live Subtitle / Caption Bar */}
        <div className="relative z-10 px-4 py-2 rounded-xl bg-slate-950/90 backdrop-blur border border-slate-800 text-center">
          <p className="text-xs text-white font-medium drop-shadow leading-relaxed">
            "{currentChapter.caption}"
          </p>
        </div>

        {/* Big Center Play Overlay Button when paused */}
        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-teal-600/90 hover:bg-teal-500 text-white flex items-center justify-center shadow-2xl transition transform hover:scale-110 active:scale-95 z-20"
            title="Start AI Clinical Demonstration"
          >
            <Play className="w-7 h-7 fill-current ml-1" />
          </button>
        )}
      </div>

      {/* Scrub Bar & Timeline Slider */}
      <div className="space-y-1.5 pt-1">
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={demoData.durationSeconds}
            step={1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-teal-400 font-bold">{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{demoData.durationDisplay}</span>
          </div>
          <span>Chapter: {currentChapter.title} ({Math.round(progressPercent)}%)</span>
        </div>
      </div>

      {/* Control Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {/* Left Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow transition"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Demo</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSkip(-5)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            title="Rewind 5 seconds"
          >
            <Rewind className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleSkip(5)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            title="Fast forward 5 seconds"
          >
            <FastForward className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            title="Restart demonstration from beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Right Aux Controls: Speed, Audio, Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            {[1.0, 1.25, 1.5, 2.0].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                  playbackSpeed === spd
                    ? 'bg-teal-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Audio toggle */}
          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            title={isMuted ? 'Unmute Audio Narration' : 'Mute Audio Narration'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-teal-400" />}
          </button>

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Synchronized Chapter Jump Bar */}
      <div className="pt-2 border-t border-slate-800/80 space-y-2">
        <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
          <span>Key Clinical Workflow Chapters</span>
          <span className="text-[10px] text-slate-400">Click chapter to jump</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {demoData.chapters.map((ch, idx) => {
            const isChapterActive = activeChapterIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleChapterSelect(ch)}
                className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2 ${
                  isChapterActive
                    ? 'bg-teal-950/40 border-teal-500 text-teal-300'
                    : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isChapterActive ? 'text-teal-400' : 'text-slate-500'}`} />
                <div className="space-y-0.5 truncate">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-teal-400">{ch.timeDisplay}</span>
                    {isChapterActive && <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />}
                  </div>
                  <div className="text-xs font-semibold truncate text-white">{ch.title}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
