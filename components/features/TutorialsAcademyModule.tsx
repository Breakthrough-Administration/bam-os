import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  FileText,
  ShieldCheck,
  Receipt,
  CalendarCheck,
  Lock,
  Activity,
  Cloud,
  Search,
  Sparkles,
  HelpCircle,
  Award,
  ExternalLink,
  ChevronRight,
  Laptop,
  Users,
  LayoutDashboard,
  Mic,
  Copy,
  Printer,
  Compass,
  Check,
  Lightbulb,
  CheckSquare,
  Square,
  X,
  RotateCcw,
} from 'lucide-react';
import { useManagementStore } from '../../stores';
import { MainNavTab } from '../../stores/slices/uiSlice';
import { TutorialVideoPlayer } from './tutorials/TutorialVideoPlayer';

interface TutorialTopic {
  id: string;
  moduleKey: MainNavTab;
  title: string;
  category: 'clinical' | 'safeguards' | 'finance_workforce' | 'governance_security';
  subtitle: string;
  estimatedReadTime: string;
  regulatoryStandard: string;
  summary: string;
  steps: Array<{
    stepNumber: number;
    title: string;
    description: string;
    proTip: string;
    keyPoints: string[];
  }>;
  commonPitfalls: string[];
  auditorTip: string;
}

const TUTORIAL_TOPICS: TutorialTopic[] = [
  {
    id: 'tut-dashboard',
    moduleKey: 'dashboard',
    title: 'Clinical Governance & Supervisor Triage',
    category: 'clinical',
    subtitle: 'High-risk caseload triaging, BSP review expiries, and practitioner oversight',
    estimatedReadTime: '4 min',
    regulatoryStandard: 'NDIS Practice Standards (Module 2A: Behaviour Support)',
    summary: 'The Clinical Governance Dashboard is your primary command center for monitoring practitioner caseload distributions, high-risk participant escalations, overdue Behaviour Support Plans, and real-time incident queues.',
    steps: [
      {
        stepNumber: 1,
        title: 'Review Executive KPI Summary Cards',
        description: 'Examine active participants, BSP review due dates within 30 days, total restrictive practices under fading, and unresolved 24-hour reportable incidents.',
        proTip: 'Look for red counter badges indicating statutory deadlines requiring immediate intervention.',
        keyPoints: [
          'Monitor active vs fading restrictive practice ratios.',
          'Verify that all high-risk participants have allocated lead clinicians.',
          'Check the 24-hour statutory incident count before beginning morning handover.',
        ],
      },
      {
        stepNumber: 2,
        title: 'Triage High-Risk Participant Alerts',
        description: 'Review the high-risk participant cards showing behavioral risk categories (e.g. self-injurious behavior, physical aggression, elopement) and restrictive practices in place.',
        proTip: 'Clicking any participant name opens their full profile, NDIS funding envelope, and emergency contacts.',
        keyPoints: [
          'Filter by risk severity (High, Medium, Routine).',
          'Inspect participants with unverified or expiring state authorisations.',
          'Review recent incident trajectories over the last 14 days.',
        ],
      },
      {
        stepNumber: 3,
        title: 'Action Clinical Supervisor Directives',
        description: 'Issue supervision notes and assign audit follow-ups to provisional or proficient behaviour support practitioners across your branch.',
        proTip: 'Every supervisory action is recorded in the immutable audit ledger with cryptographic timestamps.',
        keyPoints: [
          'Document fortnightly clinical supervision sessions.',
          'Track practitioner competency levels (Provisional, Proficient, Advanced, Specialist).',
        ],
      },
    ],
    commonPitfalls: [
      'Failing to notice BSPs expiring within 30 days, which invalidates active restrictive practice authorisations.',
      'Allowing unauthorized restrictive practice entries to remain open without lodging a formal Commission notification.',
    ],
    auditorTip: 'NDIS Quality and Safeguards Commission auditors examine whether clinical supervisors actively review incident escalations within 24 hours of occurrence.',
  },
  {
    id: 'tut-soap-scribe',
    moduleKey: 'case_notes',
    title: 'SOAP Clinical Voice Scribe & PII DLP Protection',
    category: 'clinical',
    subtitle: 'Hands-free voice dictation, real-time VU meter, and automated privacy masking',
    estimatedReadTime: '5 min',
    regulatoryStandard: 'Australian Privacy Principle 11 (Security) & Health Records Act',
    summary: 'Dictate clinical consultation notes using real-time speech transcription with acoustic frequency visualization. The on-device DLP filter automatically detects and masks Medicare, NDIS numbers, client names, and phone numbers before storing.',
    steps: [
      {
        stepNumber: 1,
        title: 'Calibrate Microphone & Check Acoustic VU Levels',
        description: 'Click "Test Mic Levels" in the header to calibrate your microphone. The 24-segment LED meter and 16-band frequency spectrum ensure your speech registers between -18 dBFS and -10 dBFS for optimal transcription.',
        proTip: 'Use the Input Gain slider (0.5x to 2.0x) if dictating in quiet clinic rooms or through laptop built-in microphones.',
        keyPoints: [
          'Teal zones indicate clean speech capture.',
          'Amber zones warn of louder consultation dynamics.',
          'Red LED 0 dB indicates clipping distortion.',
        ],
      },
      {
        stepNumber: 2,
        title: 'Dictate SOAP Clinical Sections',
        description: 'Click the microphone icon beside Subjective, Objective, Assessment, or Plan. Speak clearly using standard clinical terminology.',
        proTip: 'You can dictate continuously or enter observations section-by-section. Australian medical vocabulary is natively recognized.',
        keyPoints: [
          'Subjective: Capture the participant voice and self-reported emotional state.',
          'Objective: Quantifiable observational data, vitals, and frequency counts.',
          'Assessment: Clinical evaluation of progress against BSP goals.',
          'Plan: Next intervention steps and family/allied health actions.',
        ],
      },
      {
        stepNumber: 3,
        title: 'Review Client-Side PII De-Identification',
        description: 'Verify that the PII DLP shield has successfully masked sensitive personal identifiers (e.g. [NDIS-REDACTED], [PHONE-REDACTED]). You can toggle preview mode to inspect unmasked text prior to saving.',
        proTip: 'Client-side redaction happens entirely in browser memory before any network transmission or local encrypted storage.',
        keyPoints: [
          'Medicare numbers, NDIS participant IDs, phone numbers, and addresses are auto-redacted.',
          'Tamper-evident SHA-256 digital signature generated upon submission.',
        ],
      },
      {
        stepNumber: 4,
        title: 'Generate Easy Read Summary for Participant',
        description: 'Use the Easy Read generator to produce an accessible, simplified 1-page summary for the participant and their support network.',
        proTip: 'Complies with NDIS participant communication charters and human rights dignity guidelines.',
        keyPoints: [
          'Translates clinical jargon into plain English with bullet points.',
          'Includes visual action reminders for the participant.',
        ],
      },
    ],
    commonPitfalls: [
      'Dictating in loud environments without adjusting microphone gain, resulting in speech misrecognition.',
      'Forgetting to link the clinical note to specific NDIS Goal IDs for claiming verification.',
    ],
    auditorTip: 'Auditors require evidence that clinical case notes are contemporaneous (recorded within 24 hours of session delivery).',
  },
  {
    id: 'tut-participants-bsp',
    moduleKey: 'participants',
    title: 'Participants & Behaviour Support Plan (BSP) Architecture',
    category: 'clinical',
    subtitle: 'Managing participant profiles, NDIS funding budgets, and fading milestone schedules',
    estimatedReadTime: '5 min',
    regulatoryStandard: 'NDIS (Restrictive Practices and Behaviour Support) Rules 2018',
    summary: 'Maintain comprehensive participant records, diagnosis profiles, Modified Monash Model (MMM 1-7) geographic zones, Emergency Decision Nominees, and formal Behaviour Support Plans with fading step-down schedules.',
    steps: [
      {
        stepNumber: 1,
        title: 'Register Participant & Geographic MMM Zone',
        description: 'Enter the participant NDIS number, date of birth, primary diagnosis, and residential postcode to calculate the correct Modified Monash Model zone (MMM 1 through 7).',
        proTip: 'The MMM zone automatically drives allowable provider travel caps (30 minutes in MMM 1-3, 60 minutes in MMM 4-5) and regional price loadings.',
        keyPoints: [
          'Verify NDIS number format (9-digit Australian standard).',
          'Document emergency nominee contacts and communication preferences.',
        ],
      },
      {
        stepNumber: 2,
        title: 'Link Active Behaviour Support Plan (BSP)',
        description: 'Upload or generate the comprehensive BSP including proactive antecedent strategies, environmental modifications, and reactive de-escalation protocols.',
        proTip: 'Set a review reminder 60 days before the annual expiry date to allow sufficient time for functional behavior assessment (FBA) updates.',
        keyPoints: [
          'Distinguish between Interim BSP (6 months max) and Comprehensive BSP (12 months max).',
          'Verify inclusion of positive replacement behavior teaching strategies.',
        ],
      },
      {
        stepNumber: 3,
        title: 'Configure Fading Step-Down Milestones',
        description: 'For any regulated restrictive practice in the plan, configure numeric reduction targets (e.g. from 5 administrations/week to zero).',
        proTip: 'Plans without measurable reduction/elimination fading schedules are automatically flagged as non-compliant.',
        keyPoints: [
          'Establish baseline frequency and severity.',
          'Define quarterly review checkpoints.',
        ],
      },
    ],
    commonPitfalls: [
      'Allowing an Interim BSP to lapse past 6 months without lodging a Comprehensive BSP with the NDIS Commission.',
      'Assigning the wrong MMM zone, causing travel billing rejections during NDIA PACE claim processing.',
    ],
    auditorTip: 'Auditors check whether the participant, their family, and decision-maker were meaningfully consulted during BSP formulation.',
  },
  {
    id: 'tut-restrictive-practices',
    moduleKey: 'restrictive_practices',
    title: 'Restrictive Practices Hub & Commission Fading Register',
    category: 'safeguards',
    subtitle: 'Authorisations, emergency logging, fading curves, and monthly Commission report exports',
    estimatedReadTime: '6 min',
    regulatoryStandard: 'NDIS National Quality and Safeguards Commission Restrictive Practices Rules',
    summary: 'A complete clinical management system for all 5 regulated restrictive practice categories: Chemical, Mechanical, Physical, Environmental, and Seclusion. Track state authorizations, log administrations, and export monthly Commission bulk files.',
    steps: [
      {
        stepNumber: 1,
        title: 'Understand the 5 Regulated Restrictive Practice Categories',
        description: 'Categorize interventions accurately: Chemical (medication prescribed for primary purpose of controlling behavior), Mechanical (device restricting free movement), Physical (bodily force), Environmental (restricting free access to items/spaces), Seclusion (sole confinement in a room from which free exit is denied).',
        proTip: 'Therapeutic devices (e.g. postural harnesses prescribed by an OT) are not restrictive practices if used solely for therapeutic postural support.',
        keyPoints: [
          'Prn psychotropic medication administered for agitation is Chemical Restraint.',
          'Locked kitchen cupboards or refrigerators represent Environmental Restraint.',
        ],
      },
      {
        stepNumber: 2,
        title: 'Verify State/Territory Authorisation Mechanism',
        description: 'Before an authorized restrictive practice can be used, it must have obtained state or territory authorization (e.g. Victorian Senior Practitioner, NSW Authorisation Mechanism) and be lodged in an approved BSP.',
        proTip: 'An practice used without current state authorization is classified as an Emergency / Unauthorised Restrictive Practice and triggers mandatory 24-hour Commission reporting.',
        keyPoints: [
          'Record authorising body, date, and expiry.',
          'Upload approval letter reference numbers.',
        ],
      },
      {
        stepNumber: 3,
        title: 'Log Administrations & De-escalation Debrief',
        description: 'Log every instance of restrictive practice usage. Record duration, antecedent triggers, less restrictive alternatives attempted, and post-incident debriefing outcomes.',
        proTip: 'The system checks whether less restrictive strategies were tried first and prompts for clinical rationale.',
        keyPoints: [
          'Record exact start and end times.',
          'Mandatory post-incident debriefing with participant and support workers within 48 hours.',
        ],
      },
      {
        stepNumber: 4,
        title: 'Generate NDIS Commission Monthly Bulk CSV Export',
        description: 'Click "Export NDIS Commission Monthly CSV" to generate the official tabular format required by the Commission portal by the 5th day of each calendar month.',
        proTip: 'Pre-validates all entries for missing authorization numbers or blank debriefing fields.',
        keyPoints: [
          'Exports all authorized and emergency administrations.',
          'Includes participant NDIS number, duration, and alternative attempts.',
        ],
      },
    ],
    commonPitfalls: [
      'Failing to log PRN psychotropic administration because "the doctor prescribed it". If used for behavior, it MUST be reported.',
      'Treating unauthorized restraint as routine. It is a reportable incident under section 73Z of the NDIS Act.',
    ],
    auditorTip: 'Auditors look for clear evidence of fading step-down velocity. Stagnant protocols without fading plans require written clinical justification.',
  },
  {
    id: 'tut-incident-escalation',
    moduleKey: 'incident_escalation',
    title: '24-Hour Statutory Incident Escalation Workflow',
    category: 'safeguards',
    subtitle: 'Critical countdown timers, NDIS Commission notifications, and 5-day debriefing registers',
    estimatedReadTime: '5 min',
    regulatoryStandard: 'NDIS (Incident Management and Reportable Incidents) Rules 2018',
    summary: 'Manage critical incidents requiring statutory notification to the NDIS Quality and Safeguards Commission within strict 24-hour and 5-day legal timeframes. Live countdown timers ensure zero missed statutory deadlines.',
    steps: [
      {
        stepNumber: 1,
        title: 'Determine if an Incident is 24-Hour Reportable',
        description: 'Under NDIS rules, you must notify the Commission within 24 hours of becoming aware of: Death of a participant; Serious injury; Abuse or neglect; Unlawful sexual or physical contact; or Use of an unauthorised restrictive practice.',
        proTip: 'When in doubt, initiate notification immediately. Failure to notify within 24 hours carries severe civil penalties under the NDIS Act.',
        keyPoints: [
          'Countdown timer initiates the moment the incident is logged in the system.',
          'Red flashing priority badges warn when under 6 hours remain.',
        ],
      },
      {
        stepNumber: 2,
        title: 'Complete the Immediate Escalation Report',
        description: 'Document participant status, immediate medical treatment provided, police/ambulance notification details, and interim protective measures enacted.',
        proTip: 'The system generates a pre-formatted NDIS Commission Notification payload ready for portal submission.',
        keyPoints: [
          'Confirm immediate safety of all participants and staff.',
          'Record investigating officer and lead clinical contact.',
        ],
      },
      {
        stepNumber: 3,
        title: 'Conduct Comprehensive 5-Day Debrief & Root-Cause Analysis',
        description: 'A comprehensive report must be submitted to the Commission within 5 business days detailing root causes, systemic improvements, and post-incident debriefs.',
        proTip: 'Use the 5-day debrief wizard to record support provided to the participant and their family.',
        keyPoints: [
          'Root cause analysis (RCA) methodology.',
          'Preventative procedural updates implemented.',
        ],
      },
    ],
    commonPitfalls: [
      'Assuming the 24-hour clock begins on Monday morning for weekend incidents. The clock starts from the EXACT moment staff become aware.',
      'Failing to report unauthorized restrictive practices when staff restrain a participant during an unexpected behavioral crisis.',
    ],
    auditorTip: 'Auditors cross-reference incident timestamps with shift handover logs to verify the exact time of awareness vs. time of Commission lodgement.',
  },
  {
    id: 'tut-outcomes-trends',
    moduleKey: 'clinical_outcomes',
    title: 'Clinical Outcomes & Evidence-Based Progress Tracking',
    category: 'clinical',
    subtitle: 'Goal Attainment Scaling (GAS), PCOMS metrics, and restrictive practice fading velocity',
    estimatedReadTime: '4 min',
    regulatoryStandard: 'NDIS Practice Standards & Allied Health Outcome Measurement Guidelines',
    summary: 'Quantify clinical effectiveness across your participant cohort using validated measurement tools including Goal Attainment Scaling (GAS), Partners for Change Outcome Measurement System (PCOMS), and restrictive practice reduction velocity.',
    steps: [
      {
        stepNumber: 1,
        title: 'Track Goal Attainment Scaling (GAS)',
        description: 'Rate participant goal progress on the standardized 5-point GAS scale (-2 much less than expected, -1 less than expected, 0 expected outcome, +1 greater than expected, +2 much greater than expected).',
        proTip: 'Document concrete behavioral benchmarks for each point level to ensure inter-rater reliability among clinicians.',
        keyPoints: [
          'Standardized mathematical T-score generation.',
          'Tracks capacity building progress for NDIS plan reassessments.',
        ],
      },
      {
        stepNumber: 2,
        title: 'Inspect Restrictive Practice Reduction Velocity',
        description: 'Review the regression charts comparing baseline frequency against quarterly step-down milestones to verify elimination progress.',
        proTip: 'A downward curve demonstrates successful proactive environmental adaptation and positive behavior teaching.',
        keyPoints: [
          'Visual fading trajectory against plan targets.',
          'Automatic alerts when frequency plateaus or increases.',
        ],
      },
    ],
    commonPitfalls: [
      'Relying solely on anecdotal progress notes rather than standardized outcome measures during NDIS plan reviews.',
    ],
    auditorTip: 'NDIS planners and AAT tribunals heavily prioritize objective GAS and PCOMS evidence when approving ongoing therapy funding.',
  },
  {
    id: 'tut-papl-pricing',
    moduleKey: 'billing_papl',
    title: 'NDIS PAPL 2025/2026 Pricing & Provider Travel Engine',
    category: 'finance_workforce',
    subtitle: 'MMM 1-7 regional price caps, 30m/60m travel caps, and non-face-to-face claiming',
    estimatedReadTime: '5 min',
    regulatoryStandard: 'NDIS Pricing Arrangements and Price Limits (PAPL 2025/2026)',
    summary: 'Ensure 100% compliant NDIS claiming by applying official price caps across MMM 1-7 geographic zones, strict provider travel rules (30 min MMM 1-3, 60 min MMM 4-5), and allowable non-face-to-face report writing codes.',
    steps: [
      {
        stepNumber: 1,
        title: 'Select Support Item & Check Geographic Rate Caps',
        description: 'Choose the appropriate support line item (e.g. 15_048_0128_1_3 for Behaviour Support Practitioner, 15_056_0128_1_3 for Specialist Behaviour Support). The engine automatically adjusts rates based on regional MMM 1-7 zones.',
        proTip: 'MMM 6 (Remote) allows +40% price loading; MMM 7 (Very Remote) allows +50% price loading.',
        keyPoints: [
          'Therapy rate caps: Metro (MMM 1-5) $214.41/hr for Psychology, $193.99/hr for OT/Physio/PBS.',
          'Strict prohibition on charging above published NDIS price caps.',
        ],
      },
      {
        stepNumber: 2,
        title: 'Apply Capped Provider Travel Rules',
        description: 'Calculate allowable travel time based on participant location: Up to 30 minutes in metropolitan areas (MMM 1-3) and up to 60 minutes in regional areas (MMM 4-5). Travel must be agreed in advance in the Service Agreement.',
        proTip: 'Apportion travel time fairly when visiting multiple participants in the same geographic journey.',
        keyPoints: [
          'Travel claiming requires pre-consent in the signed Service Agreement.',
          'Non-labor vehicle travel allowed up to $0.99/km for standard vehicles.',
        ],
      },
      {
        stepNumber: 3,
        title: 'Claim Non-Face-to-Face & Report Writing Support',
        description: 'Log allowable non-face-to-face activities (e.g. writing functional behavior assessments, developing comprehensive BSPs, liaising with allied health teams).',
        proTip: 'General administrative tasks (e.g. sending standard invoice emails) CANNOT be claimed under NDIS rules.',
        keyPoints: [
          'Must be clinical activities directly contributing to participant goals.',
          'Record clear clinical justifications for every claim.',
        ],
      },
    ],
    commonPitfalls: [
      'Billing travel without having travel terms explicitly signed in the participant Service Agreement.',
      'Charging participant for internal staff supervision or administrative billing time.',
    ],
    auditorTip: 'The NDIA PACE compliance team regularly audits provider travel claims exceeding 30 minutes in metro zones without travel route justification.',
  },
  {
    id: 'tut-schads-roster',
    moduleKey: 'schads_roster',
    title: 'Fair Work SCHADS Award 2020 Rostering Engine',
    category: 'finance_workforce',
    subtitle: 'Clause 25.5 (2h minimums), broken shifts, 10h rest pauses, and worker screening checks',
    estimatedReadTime: '6 min',
    regulatoryStandard: 'Social, Community, Home Care and Disability Services Industry Award 2020',
    summary: 'Automate strict Fair Work Ombudsman compliance when scheduling support workers. The engine automatically validates the 2-hour minimum engagement rule, broken shift allowances, 10-hour rest breaks, and active NDIS Worker Screening Checks.',
    steps: [
      {
        stepNumber: 1,
        title: 'Enforce Clause 25.5 (2-Hour Minimum Engagement)',
        description: 'Under the amended SCHADS Award, all casual and part-time social and community services employees must be rostered for a minimum of 2 consecutive hours per shift.',
        proTip: 'Any scheduled shift under 120 minutes is flagged in red and cannot be published without wage makeup approval.',
        keyPoints: [
          'Applies to both face-to-face and remote client support.',
          'Short 1-hour sessions must be bundled or paid as a 2-hour engagement.',
        ],
      },
      {
        stepNumber: 2,
        title: 'Manage Broken Shifts & Clause 25.4 Allowances',
        description: 'A broken shift consists of 2 separate work periods within a 12-hour span. The broken shift allowance must be automatically credited to the worker.',
        proTip: 'Shifts spanning beyond a 12-hour span trigger double-time penalty rates for all subsequent hours worked.',
        keyPoints: [
          'Max 2 parts to a broken shift (or 3 by formal mutual agreement).',
          'Broken shift allowance applies to each day containing a split.',
        ],
      },
      {
        stepNumber: 3,
        title: 'Audit Clause 31.2 (10-Hour Rest Break Between Shifts)',
        description: 'Employees must receive a continuous rest break of at least 10 hours between finishing work on one day and commencing work on the next.',
        proTip: 'If an employee is instructed to resume work without a 10-hour pause, they must be paid double-time until released from duty.',
        keyPoints: [
          'Prevents worker fatigue and participant safety incidents.',
          'Flags evening sleepover shifts finishing at 8:00 AM followed by morning shifts.',
        ],
      },
      {
        stepNumber: 4,
        title: 'Verify Worker Screening & Credential Validity',
        description: 'Ensure rostered workers possess an active, unexpired NDIS Worker Screening Check (NDISWC), Working With Children Check (WWCC), and First Aid/CPR certification.',
        proTip: 'Workers with screening expiring within 30 days are badged with yellow warnings; expired credentials block shift allocation.',
        keyPoints: [
          'Strict regulatory compliance requirement for registered NDIS providers.',
          'Prevents unauthorized worker deployment.',
        ],
      },
    ],
    commonPitfalls: [
      'Scheduling a 1.5-hour community visit and only paying for 1.5 hours—a direct breach of Fair Work Clause 25.5.',
      'Allowing a worker to finish an evening shift at 11:00 PM and start a morning shift at 7:00 AM (only an 8-hour break).',
    ],
    auditorTip: 'Fair Work Ombudsman inspectors audit time-and-wages records against client billing invoices to identify underpayment of the 2-hour minimum.',
  },
  {
    id: 'tut-audit-compliance',
    moduleKey: 'audit_compliance',
    title: 'Cryptographic Audit Register & Commission Evidence',
    category: 'governance_security',
    subtitle: 'SHA-256 hash chaining, immutable evidence logs, and one-click Commission data exports',
    estimatedReadTime: '4 min',
    regulatoryStandard: 'NDIS Practice Standards Core Module 2 (Governance & Operational Management)',
    summary: 'A tamper-evident, cryptographically chained audit register ensuring absolute integrity of clinical notes, incident lodgements, and restrictive practice records for NDIS Quality and Safeguards Commission audits.',
    steps: [
      {
        stepNumber: 1,
        title: 'Understand the SHA-256 Hash Chaining Mechanism',
        description: 'Every clinical action (note creation, incident status change, protocol fading milestone) generates a cryptographic SHA-256 digital fingerprint linked to the previous transaction hash.',
        proTip: 'Any unauthorized database tampering breaks the hash chain, immediately raising visual integrity failure alerts.',
        keyPoints: [
          'Immutable proof of record creation timestamps.',
          'Protects against retrospective alteration of case notes following adverse incidents.',
        ],
      },
      {
        stepNumber: 2,
        title: 'Review the Activity History & Filter Events',
        description: 'Switch between Timeline and Table views to inspect audit events by entity type, performing officer, severity, or participant ID.',
        proTip: 'Filter by "24h Escalation" to review all statutory notifications lodged with the Commission.',
        keyPoints: [
          'Verifies who performed each action and when.',
          'Inspects change summaries and before/after values.',
        ],
      },
      {
        stepNumber: 3,
        title: 'Export Audit Log Evidence (CSV & JSON)',
        description: 'Click "Export Audit Log (CSV)" to deliver an unbroken audit trail directly to NDIS Commission auditors or independent certifying bodies.',
        proTip: 'The export includes full cryptographic verification signatures and timestamp hashes.',
        keyPoints: [
          'Satisfies NDIS certification auditor evidence requests.',
          'Provides complete transparency for clinical governance inquiries.',
        ],
      },
    ],
    commonPitfalls: [
      'Editing clinical records without recording a formal addendum or rationale.',
      'Deleting clinical case notes—the system strictly preserves all historical revisions.',
    ],
    auditorTip: 'Auditors look for automated audit trails that prevent clinical staff or administrators from modifying timestamps after an incident occurred.',
  },
  {
    id: 'tut-workspace-hub',
    moduleKey: 'workspace_hub',
    title: 'Google Workspace Hub & Gemini AI Clinical Reasoning',
    category: 'governance_security',
    subtitle: 'Drive care plan synchronization, Docs report exports, and AI-assisted clinical drafting',
    estimatedReadTime: '4 min',
    regulatoryStandard: 'Google Workspace Cloud Architecture & Australian Privacy Principles',
    summary: 'Integrate your clinical workflows with Google Workspace. Synchronize Behaviour Support Plans to Google Drive, export structured assessment reports to Google Docs, coordinate appointments via Google Calendar, and use Gemini AI for clinical reasoning.',
    steps: [
      {
        stepNumber: 1,
        title: 'Sync Plans to Google Drive Clinical Archive',
        description: 'Export participant BSPs, FBA summaries, and risk assessments into secure Google Drive folders organized by participant NDIS number.',
        proTip: 'Synchronized files retain version history and access permissions according to clinician role.',
        keyPoints: [
          'One-click cloud backup of clinical artifacts.',
          'Secure sharing with allied health team members.',
        ],
      },
      {
        stepNumber: 2,
        title: 'Export Formatted Clinical Reports to Google Docs',
        description: 'Generate standardized, professionally formatted allied health progress reports and clinical reviews in Google Docs with one click.',
        proTip: 'Automatically populates participant demographics, goal attainment scores, and fading statistics.',
        keyPoints: [
          'Reduces report writing time by over 60%.',
          'Standardizes organizational branding and clinical structure.',
        ],
      },
      {
        stepNumber: 3,
        title: 'Leverage Server-Side Gemini AI Clinical Assistant',
        description: 'Use the Gemini AI reasoning module to synthesize complex behavioral observations, suggest proactive antecedent strategies, and verify clinical phrasing.',
        proTip: 'All AI processing runs strictly server-side with zero exposure of API keys and client-side PII DLP redaction.',
        keyPoints: [
          'Translates sensory observations into environmental support plans.',
          'Assists in drafting easy-to-read de-escalation steps for support workers.',
        ],
      },
    ],
    commonPitfalls: [
      'Pasting unredacted participant PII into consumer AI tools. Always use the built-in server-side Gemini integration with client-side DLP shielding.',
    ],
    auditorTip: 'Auditors verify that cloud storage meets Australian data residency requirements and that clinical records are protected with multi-factor authentication.',
  },
  {
    id: 'tut-security-rollout',
    moduleKey: 'security_rollout',
    title: 'Security Posture, ISO 27001 & Phased Rollout Plan',
    category: 'governance_security',
    subtitle: 'Audit readiness score (91/100), offline-first encryption, and clinician field PIN mode',
    estimatedReadTime: '4 min',
    regulatoryStandard: 'ISO 27001, ASD Essential Eight & NDIS Core Module 2',
    summary: 'Inspect the organization security compliance score, view the 4-phase enterprise rollout roadmap, configure offline-first synchronization policies, and use quick PIN locks for mobile community visits.',
    steps: [
      {
        stepNumber: 1,
        title: 'Review NDIS Audit Readiness Score (91/100)',
        description: 'Examine the 5 security pillars: Data at Rest Encryption (AES-256), Data in Transit (TLS 1.3), Client-Side DLP Masking, Role-Based Access Control (RBAC), and Audit Trail Immutability.',
        proTip: 'Use the interactive readiness checklist to prepare for upcoming NDIS mid-term and recertification audits.',
        keyPoints: [
          'Aligns with ASD Essential Eight cyber security maturity level 2.',
          'Pre-mapped to NDIS Quality and Safeguards Commission registration requirements.',
        ],
      },
      {
        stepNumber: 2,
        title: 'Inspect Phased Rollout Roadmap',
        description: 'Review the 4-phase rollout strategy: Phase 1 (Clinical Pilot), Phase 2 (Billing & Roster Integration), Phase 3 (Multi-Branch Governance), Phase 4 (Full Enterprise Deployment).',
        proTip: 'Track branch readiness checklists before migrating additional clinician cohorts.',
        keyPoints: [
          'Includes data migration protocols from legacy care systems.',
          'Staff training schedules and competency verification milestones.',
        ],
      },
      {
        stepNumber: 3,
        title: 'Enable Clinician Field PIN Lock',
        description: 'When visiting participants in the home or community, use the quick PIN lock to protect sensitive health records when stepping away from tablets or laptops.',
        proTip: 'Maintains local offline session state while preventing unauthorized visual access.',
        keyPoints: [
          'Ideal for shared devices or high-stimulus clinic settings.',
          'Instantly re-locks without requiring full password re-entry.',
        ],
      },
    ],
    commonPitfalls: [
      'Leaving open clinical laptops unattended in communal group home environments.',
    ],
    auditorTip: 'Auditors inspect device security policies and test whether clinicians lock screens when stepping away during on-site observation visits.',
  },
];

const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    question: 'Under the amended Fair Work SCHADS Award 2020 (Clause 25.5), what is the minimum engagement length for a part-time or casual social and community services employee?',
    options: [
      '1 hour per shift',
      '2 hours per shift',
      '3 hours per shift',
      '4 hours per shift',
    ],
    correctAnswer: 1,
    explanation: 'Clause 25.5 of the SCHADS Award mandates a 2-hour minimum engagement for casual and part-time social and community services employees, regardless of whether the shift is face-to-face or remote.',
  },
  {
    id: 'q2',
    question: 'Within what timeframe must an unregistered or emergency restrictive practice be notified to the NDIS Quality and Safeguards Commission?',
    options: [
      'Within 2 hours of administration',
      'Within 24 hours of becoming aware of the use',
      'Within 5 business days',
      'At the end of the calendar month',
    ],
    correctAnswer: 1,
    explanation: 'Under section 73Z of the NDIS Act and the Reportable Incidents Rules, the use of an unauthorized or emergency restrictive practice is a reportable incident requiring notification within 24 hours of becoming aware.',
  },
  {
    id: 'q3',
    question: 'What is the maximum allowable provider travel time that can be claimed for a standard therapy session in a metropolitan area (MMM 1-3)?',
    options: [
      '15 minutes',
      '30 minutes',
      '60 minutes',
      'Unlimited, based on actual Google Maps driving time',
    ],
    correctAnswer: 1,
    explanation: 'Under the NDIS Pricing Arrangements and Price Limits (PAPL), providers can claim up to a maximum of 30 minutes of travel time in metropolitan areas (MMM 1-3) and up to 60 minutes in regional zones (MMM 4-5), provided travel is agreed in advance in the Service Agreement.',
  },
  {
    id: 'q4',
    question: 'Which of the following interventions constitutes a Regulated Restrictive Practice (Chemical Restraint) under NDIS rules?',
    options: [
      'Prescribed insulin for diabetes management',
      'Antibiotics prescribed for an ear infection',
      'PRN psychotropic medication administered primarily to suppress aggressive behavior',
      'Prescribed blood pressure medication',
    ],
    correctAnswer: 2,
    explanation: 'Chemical restraint is the use of medication prescribed for the primary purpose of influencing or controlling a person’s behavior, rather than treating a diagnosed medical condition or mental illness.',
  },
  {
    id: 'q5',
    question: 'How many hours of continuous rest break must an employee receive between finishing work on one day and commencing work on the next under SCHADS Clause 31.2?',
    options: [
      '6 hours',
      '8 hours',
      '10 hours',
      '12 hours',
    ],
    correctAnswer: 2,
    explanation: 'Under SCHADS Award Clause 31.2, employees must receive an unbroken rest break of at least 10 hours between finishing work on one shift and beginning work on the next.',
  },
  {
    id: 'q6',
    question: 'What is the purpose of SHA-256 cryptographic hash chaining in the Breakthrough Manager OS audit register?',
    options: [
      'To compress file sizes for faster cloud storage',
      'To provide tamper-evident proof that clinical records and timestamps have not been retroactively altered',
      'To translate English speech into Australian dialect',
      'To automatically calculate NDIS invoice GST',
    ],
    correctAnswer: 1,
    explanation: 'Cryptographic hash chaining connects each record to the previous one using SHA-256 hashing. If any record or timestamp is edited or deleted, the mathematical chain breaks, immediately exposing tampering to NDIS auditors.',
  },
  {
    id: 'q7',
    question: 'When is a Comprehensive Behaviour Support Plan required to replace an Interim BSP for an NDIS participant?',
    options: [
      'Within 3 months',
      'Within 6 months',
      'Within 12 months',
      'Only if an incident occurs',
    ],
    correctAnswer: 1,
    explanation: 'Under NDIS rules, an Interim Behaviour Support Plan can only remain active for a maximum of 6 months. A Comprehensive BSP based on a Functional Behavior Assessment (FBA) must be lodged prior to the 6-month expiry.',
  },
  {
    id: 'q8',
    question: 'Can general administrative overhead (such as filing paper notes or generating monthly invoices) be billed to a participant’s NDIS budget as non-face-to-face support?',
    options: [
      'Yes, at the standard hourly therapy rate',
      'No, general administrative costs are factored into the headline hourly price limit and cannot be billed separately',
      'Yes, if the participant has excess Core budget',
      'Only if billed under travel line items',
    ],
    correctAnswer: 1,
    explanation: 'The NDIA PAPL explicitly prohibits billing for general administrative activities, internal scheduling, and invoicing. Non-face-to-face claims are restricted to direct clinical activities (e.g. developing BSPs or writing assessment reports).',
  },
];

export const TutorialsAcademyModule: React.FC = () => {
  const { setActiveTab } = useManagementStore();

  const [activeSubTab, setActiveSubTab] = useState<'walkthroughs' | 'simulators' | 'cheat_sheets' | 'quiz'>('walkthroughs');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(TUTORIAL_TOPICS[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [trainingStatusFilter, setTrainingStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // Internal Staff Training Completion State (Persisted in localStorage)
  const [completedTopicIds, setCompletedTopicIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('breakthrough_staff_training_completed_ids');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return ['tut-dashboard', 'tut-soap']; // Initial default completed modules for onboarding demo
  });

  const toggleCompleteTopic = (topicId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setCompletedTopicIds((prev) => {
      const updated = prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId];
      try {
        localStorage.setItem('breakthrough_staff_training_completed_ids', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleResetProgress = () => {
    if (window.confirm('Reset all internal staff training completion progress to 0%?')) {
      setCompletedTopicIds([]);
      try {
        localStorage.removeItem('breakthrough_staff_training_completed_ids');
      } catch {
        // ignore
      }
    }
  };

  const handleMarkAllComplete = () => {
    const allIds = TUTORIAL_TOPICS.map((t) => t.id);
    setCompletedTopicIds(allIds);
    try {
      localStorage.setItem('breakthrough_staff_training_completed_ids', JSON.stringify(allIds));
    } catch {
      // ignore
    }
  };

  const completionPercentage = Math.round(
    (completedTopicIds.length / TUTORIAL_TOPICS.length) * 100
  );

  // Quiz State
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Practice Simulator State
  const [simText, setSimText] = useState(
    'Participant John Citizen (NDIS: 430198274, Ph: 0419 883 291, DOB: 12/03/1995) attended the clinic at 15 Collins Street Melbourne. Observed heightened agitation.'
  );
  const [simRedacted, setSimRedacted] = useState('');
  const [simMmmZone, setSimMmmZone] = useState<number>(2);
  const [simTravelMinutes, setSimTravelMinutes] = useState<number>(35);
  const [simShiftDurationHours, setSimShiftDurationHours] = useState<number>(1.5);
  const [simBaselineFreq, setSimBaselineFreq] = useState<number>(8);
  const [simCurrentFreq, setSimCurrentFreq] = useState<number>(3);

  // Filtered topics (deep multi-field search + category + completion status)
  const filteredTopics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return TUTORIAL_TOPICS.filter((t) => {
      const isCompleted = completedTopicIds.includes(t.id);
      if (trainingStatusFilter === 'completed' && !isCompleted) return false;
      if (trainingStatusFilter === 'pending' && isCompleted) return false;

      const matchesCategory =
        activeCategoryFilter === 'all' || t.category === activeCategoryFilter;
      if (!matchesCategory) return false;

      if (!q) return true;

      const inTitle = t.title.toLowerCase().includes(q);
      const inSubtitle = t.subtitle.toLowerCase().includes(q);
      const inSummary = t.summary.toLowerCase().includes(q);
      const inStandard = t.regulatoryStandard.toLowerCase().includes(q);
      const inSteps = t.steps.some(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.proTip.toLowerCase().includes(q)
      );
      const inPitfalls = t.commonPitfalls.some((p) => p.toLowerCase().includes(q));

      return inTitle || inSubtitle || inSummary || inStandard || inSteps || inPitfalls;
    });
  }, [searchQuery, activeCategoryFilter, trainingStatusFilter, completedTopicIds]);

  const activeTopic = useMemo(() => {
    return (
      TUTORIAL_TOPICS.find((t) => t.id === selectedTopicId) || TUTORIAL_TOPICS[0]
    );
  }, [selectedTopicId]);

  // Handle Simulator Redaction
  const runSimulatorDlp = () => {
    let scrubbed = simText;
    scrubbed = scrubbed.replace(/\b4\d{8}\b/g, '[NDIS-REDACTED]');
    scrubbed = scrubbed.replace(/(04\d{2}\s?\d{3}\s?\d{3})/g, '[PHONE-REDACTED]');
    scrubbed = scrubbed.replace(/\b\d{1,4}\s+[A-Za-z\s]+(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr)\b/gi, '[ADDRESS-REDACTED]');
    scrubbed = scrubbed.replace(/\b(?:DOB:\s*\d{2}\/\d{2}\/\d{4})/gi, 'DOB: [DATE-REDACTED]');
    scrubbed = scrubbed.replace(/John Citizen/gi, '[PARTICIPANT-REDACTED]');
    setSimRedacted(scrubbed);
  };

  // Handle Quiz Submission
  const handleQuizSubmit = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        score += 1;
      }
    });
    setQuizScore(score);
    setIsQuizSubmitted(true);
  };

  const resetQuiz = () => {
    setUserAnswers({});
    setIsQuizSubmitted(false);
    setQuizScore(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Academy Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-950 via-slate-900 to-slate-900 border border-teal-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <GraduationCap className="w-6 h-6 text-teal-400" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  <span>Breakthrough Clinician Academy & System Tutorials</span>
                  <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    v2.5 Full Curriculum
                  </span>
                </h1>
                <p className="text-xs text-teal-200/80">
                  Comprehensive interactive walkthroughs, regulatory cheat sheets, and compliance verification for every system module.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Launch & Certification Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Modules Covered</div>
              <div className="font-bold text-teal-300 flex items-center gap-1.5 mt-0.5">
                <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                <span>11 Core System Domains</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSubTab('quiz')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg transition transform active:scale-95"
            >
              <Award className="w-4 h-4" />
              <span>Competency Quiz</span>
            </button>
          </div>
        </div>

      {/* Top Global Search & Module Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-teal-500/30 shadow-xl space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-400" />
            <input
              type="text"
              placeholder="Search all 11 training guides by keywords, clinical modules, standards, or legislation (e.g., 'DLP', 'SCHADS', 'Restraint', 'Voice', 'Travel')..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeSubTab !== 'walkthroughs' && e.target.value.trim() !== '') {
                  setActiveSubTab('walkthroughs');
                }
              }}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 shadow-inner transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-white transition"
                title="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3">
            <span className="text-xs text-slate-400 font-mono">
              Showing <strong className="text-teal-300 font-bold">{filteredTopics.length}</strong> of {TUTORIAL_TOPICS.length} guides
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-teal-400 hover:text-teal-300 font-semibold underline"
              >
                Reset Search
              </button>
            )}
          </div>
        </div>

        {/* Quick Domain Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 mr-1">Filter Domain:</span>
          {[
            { key: 'all', label: 'All Modules (11)' },
            { key: 'clinical', label: 'Clinical PBS' },
            { key: 'safeguards', label: 'Safeguards & Incidents' },
            { key: 'finance_workforce', label: 'Finance & Workforce' },
            { key: 'governance_security', label: 'Governance & Security' },
          ].map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => {
                setActiveCategoryFilter(pill.key);
                if (activeSubTab !== 'walkthroughs') {
                  setActiveSubTab('walkthroughs');
                }
              }}
              className={`text-[11px] px-3 py-1 rounded-lg transition font-medium ${
                activeCategoryFilter === pill.key
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('walkthroughs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'walkthroughs'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Interactive Walkthroughs ({TUTORIAL_TOPICS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('simulators')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'simulators'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Interactive Practice Simulators</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('cheat_sheets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'cheat_sheets'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Regulatory Cheat Sheets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('quiz')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'quiz'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Clinician Knowledge Quiz</span>
            {quizScore !== null && (
              <span className="px-1.5 py-0.5 rounded bg-slate-900 text-teal-300 text-[10px] font-mono">
                {quizScore}/8
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: INTERACTIVE WALKTHROUGHS */}
      {activeSubTab === 'walkthroughs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Topics Sidebar, Progress & Search */}
          <div className="lg:col-span-4 space-y-4">
            {/* Internal Staff Training Completion Progress Card */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white tracking-tight">Staff Training Progress</span>
                </div>
                <span className="text-xs font-mono font-bold text-teal-300 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
                  {completedTopicIds.length} / {TUTORIAL_TOPICS.length} ({completionPercentage}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500 rounded-full"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>
                    {completionPercentage === 100
                      ? '🏆 100% Induction Certified'
                      : `${TUTORIAL_TOPICS.length - completedTopicIds.length} modules remaining`}
                  </span>
                  <div className="flex items-center gap-2">
                    {completedTopicIds.length < TUTORIAL_TOPICS.length && (
                      <button
                        type="button"
                        onClick={handleMarkAllComplete}
                        className="text-teal-400 hover:text-teal-300 hover:underline"
                      >
                        Complete All
                      </button>
                    )}
                    {completedTopicIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleResetProgress}
                        className="text-slate-500 hover:text-slate-300 hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Training Status Filter Pills */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                {[
                  { key: 'all', label: `All (${TUTORIAL_TOPICS.length})` },
                  { key: 'pending', label: `Pending (${TUTORIAL_TOPICS.length - completedTopicIds.length})` },
                  { key: 'completed', label: `Completed (${completedTopicIds.length})` },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setTrainingStatusFilter(st.key as any)}
                    className={`text-[10px] px-2.5 py-1 rounded-md transition font-medium ${
                      trainingStatusFilter === st.key
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search and Category Filter */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search tutorials, standards, legislation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'all', label: 'All Modules' },
                  { key: 'clinical', label: 'Clinical' },
                  { key: 'safeguards', label: 'Safeguards' },
                  { key: 'finance_workforce', label: 'Finance & HR' },
                  { key: 'governance_security', label: 'Security' },
                ].map((pill) => (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setActiveCategoryFilter(pill.key)}
                    className={`text-[11px] px-2.5 py-1 rounded-md transition font-medium ${
                      activeCategoryFilter === pill.key
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Topics List */}
            <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
              {filteredTopics.map((topic, index) => {
                const isSelected = topic.id === activeTopic.id;
                const isCompleted = completedTopicIds.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition group ${
                      isSelected
                        ? 'bg-slate-900 border-teal-500 shadow-md shadow-teal-500/10'
                        : isCompleted
                        ? 'bg-slate-900/40 hover:bg-slate-900 border-emerald-500/20 hover:border-emerald-500/40'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Mark as Complete Checkbox on List Item */}
                        <button
                          type="button"
                          onClick={(e) => toggleCompleteTopic(topic.id, e)}
                          className="p-0.5 rounded text-slate-400 hover:text-white transition focus:outline-none"
                          title={isCompleted ? 'Mark training as incomplete' : 'Mark training as complete'}
                        >
                          {isCompleted ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                          )}
                        </button>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                          Module #{index + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isCompleted && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Complete</span>
                          </span>
                        )}
                        <span className="text-[10px] font-medium text-slate-400">
                          {topic.estimatedReadTime} read
                        </span>
                      </div>
                    </div>

                    <h3
                      className={`text-xs font-bold mt-2 leading-snug transition ${
                        isSelected
                          ? 'text-teal-400'
                          : isCompleted
                          ? 'text-slate-200'
                          : 'text-slate-200 group-hover:text-white'
                      }`}
                    >
                      {topic.title}
                    </h3>

                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {topic.subtitle}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                      <span className="truncate max-w-[200px]">{topic.regulatoryStandard}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition ${isSelected ? 'text-teal-400 translate-x-1' : 'text-slate-600'}`} />
                    </div>
                  </button>
                );
              })}

              {filteredTopics.length === 0 && (
                <div className="p-8 text-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
                  <p className="text-xs">No tutorials matched your search criteria.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Active Tutorial Details */}
          <div className="lg:col-span-8 space-y-5">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {activeTopic.category.replace('_', ' & ')}
                    </span>
                    <span className="text-xs text-slate-400">Est. {activeTopic.estimatedReadTime}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {activeTopic.title}
                  </h2>
                  <p className="text-xs text-slate-300">{activeTopic.subtitle}</p>
                </div>

                {/* Training Complete & Direct Launch Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleCompleteTopic(activeTopic.id)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition shadow-sm ${
                      completedTopicIds.includes(activeTopic.id)
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    {completedTopicIds.includes(activeTopic.id) ? (
                      <>
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                        <span>Training Completed</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4 text-slate-400" />
                        <span>Mark as Complete</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab(activeTopic.moduleKey)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition transform active:scale-95 shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Launch Module</span>
                  </button>
                </div>
              </div>

              {/* Regulatory Standard Reference Banner */}
              <div className="p-3.5 rounded-xl bg-teal-950/40 border border-teal-500/30 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-teal-300">Governing Standard: </span>
                  <span className="text-slate-300">{activeTopic.regulatoryStandard}</span>
                  <p className="text-slate-400 mt-1 leading-relaxed">
                    {activeTopic.summary}
                  </p>
                </div>
              </div>

              {/* AI-Generated Workflow Demonstration Video Player */}
              <TutorialVideoPlayer
                topicId={activeTopic.id}
                topicTitle={activeTopic.title}
                regulatoryStandard={activeTopic.regulatoryStandard}
                moduleKey={activeTopic.moduleKey}
              />

              {/* Step-by-Step Interactive Workflow */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-teal-400" />
                  <span>Step-by-Step Clinician Workflow</span>
                </h3>

                <div className="space-y-3.5">
                  {activeTopic.steps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2.5 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold text-xs flex items-center justify-center shrink-0">
                          {step.stepNumber}
                        </span>
                        <h4 className="text-xs font-bold text-white">
                          {step.title}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed pl-9">
                        {step.description}
                      </p>

                      {/* Key Points Checklist */}
                      <div className="pl-9 space-y-1 pt-1">
                        {step.keyPoints.map((pt, pIdx) => (
                          <div key={pIdx} className="flex items-center gap-2 text-[11px] text-slate-400">
                            <CheckCircle2 className="w-3 h-3 text-teal-400 shrink-0" />
                            <span>{pt}</span>
                          </div>
                        ))}
                      </div>

                      {/* Pro-Tip Box */}
                      <div className="ml-9 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-amber-300/90 flex items-start gap-2">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span><strong>Clinician Tip:</strong> {step.proTip}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Pitfalls & Regulatory Traps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Common Compliance Pitfalls</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-rose-200/80 list-disc pl-4">
                    {activeTopic.commonPitfalls.map((pitfall, idx) => (
                      <li key={idx} className="leading-relaxed">{pitfall}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <Award className="w-4 h-4 text-indigo-400" />
                    <span>NDIS Auditor Perspective</span>
                  </div>
                  <p className="text-xs text-indigo-200/80 leading-relaxed">
                    {activeTopic.auditorTip}
                  </p>
                </div>
              </div>

              {/* Bottom Quick Launch Bar */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Ready to put this knowledge to work?</span>
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTopic.moduleKey)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow transition"
                >
                  <span>Open {activeTopic.title}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: INTERACTIVE PRACTICE SIMULATORS */}
      {activeSubTab === 'simulators' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <p className="font-semibold text-white">Interactive Sandbox & Compliance Simulators</p>
            <p className="text-slate-400 mt-1">
              Test real-world clinical and administrative scenarios safely in an isolated sandbox before executing in live participant files.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Simulator 1: PII DLP Scrubbing */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Simulator A: Client-Side PII DLP Redactor</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  APP 11 Privacy
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Type or modify clinical notes below to test regex-based client-side identification and redaction of Australian NDIS numbers, phone numbers, and street addresses.
              </p>

              <div>
                <label className="text-[11px] font-bold text-slate-300">Raw Clinical Dictation (Sample with PII):</label>
                <textarea
                  rows={3}
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500 transition font-mono"
                />
              </div>

              <button
                type="button"
                onClick={runSimulatorDlp}
                className="w-full py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Execute DLP Anonymization</span>
              </button>

              {simRedacted && (
                <div className="p-3 rounded-lg bg-slate-950 border border-emerald-500/40 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">Scrubbed Safe Output:</span>
                  <p className="text-xs font-mono text-emerald-300 leading-relaxed">
                    {simRedacted}
                  </p>
                </div>
              )}
            </div>

            {/* Simulator 2: NDIS PAPL Travel & MMM Loading */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-teal-400" />
                  <span>Simulator B: Provider Travel & MMM Zones</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  PAPL 2025/2026
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Check whether your proposed provider travel time complies with NDIS metro (30m) or regional (60m) statutory price limits.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300">Modified Monash Zone:</label>
                  <select
                    value={simMmmZone}
                    onChange={(e) => setSimMmmZone(parseInt(e.target.value))}
                    className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value={1}>MMM 1 (Capital City Metro)</option>
                    <option value={2}>MMM 2 (Regional Centre)</option>
                    <option value={3}>MMM 3 (Large Rural Town)</option>
                    <option value={4}>MMM 4 (Medium Rural Town)</option>
                    <option value={5}>MMM 5 (Small Rural Town)</option>
                    <option value={6}>MMM 6 (Remote - +40% Load)</option>
                    <option value={7}>MMM 7 (Very Remote - +50% Load)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300">Travel Time (Mins):</label>
                  <input
                    type="number"
                    value={simTravelMinutes}
                    onChange={(e) => setSimTravelMinutes(parseInt(e.target.value) || 0)}
                    className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Travel Compliance Result */}
              {(() => {
                const maxAllowedMins = simMmmZone <= 3 ? 30 : simMmmZone <= 5 ? 60 : 120;
                const isCompliant = simTravelMinutes <= maxAllowedMins;
                const allowableClaimMinutes = Math.min(simTravelMinutes, maxAllowedMins);
                const hourlyRate = 193.99;
                const claimValue = ((allowableClaimMinutes / 60) * hourlyRate).toFixed(2);

                return (
                  <div
                    className={`p-3.5 rounded-xl border ${
                      isCompliant
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                    } space-y-1.5`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{isCompliant ? 'Compliant NDIS Travel Claim' : 'Exceeds Published Metro/Regional Cap'}</span>
                      <span>Max Cap: {maxAllowedMins} mins</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      {isCompliant
                        ? `Full ${simTravelMinutes} minutes billable at $${claimValue} under agreed service agreement.`
                        : `You can only bill up to the statutory cap of ${maxAllowedMins} minutes ($${claimValue}). Remainder must be non-billable overhead.`}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Simulator 3: SCHADS 2-Hour Minimum Engagement */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-teal-400" />
                  <span>Simulator C: SCHADS Award Clause 25.5</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Fair Work 2020
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Verify whether a scheduled shift duration satisfies the 2-hour minimum engagement requirement under the Social, Community, Home Care and Disability Services Industry Award.
              </p>

              <div>
                <label className="text-[11px] font-bold text-slate-300">Scheduled Shift Duration (Hours):</label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="range"
                    min="0.5"
                    max="6.0"
                    step="0.5"
                    value={simShiftDurationHours}
                    onChange={(e) => setSimShiftDurationHours(parseFloat(e.target.value))}
                    className="flex-1 accent-teal-500"
                  />
                  <span className="font-mono font-bold text-xs text-white w-12 text-right">
                    {simShiftDurationHours.toFixed(1)} hrs
                  </span>
                </div>
              </div>

              {simShiftDurationHours < 2.0 ? (
                <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>BREACH OF SCHADS CLAUSE 25.5</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Shift is only {simShiftDurationHours * 60} minutes. Worker must be paid for a full 2.0 hours ($80.40 minimum makeup wage) or shift must be extended.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-emerald-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>FAIR WORK COMPLIANT</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Meets or exceeds the 2.0-hour minimum engagement threshold for social & community services employees.
                  </p>
                </div>
              )}
            </div>

            {/* Simulator 4: Fading Step-Down Rate Calculator */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-teal-400" />
                  <span>Simulator D: Restrictive Practice Fading Rate</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Commission Rules
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Calculate the percentage reduction in restrictive practice frequency from plan inception baseline to present review milestone.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300">Baseline (Freq/Wk):</label>
                  <input
                    type="number"
                    value={simBaselineFreq}
                    onChange={(e) => setSimBaselineFreq(parseInt(e.target.value) || 1)}
                    className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300">Current (Freq/Wk):</label>
                  <input
                    type="number"
                    value={simCurrentFreq}
                    onChange={(e) => setSimCurrentFreq(parseInt(e.target.value) || 0)}
                    className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {(() => {
                const reductionPct = Math.round(
                  ((simBaselineFreq - simCurrentFreq) / simBaselineFreq) * 100
                );
                const isFading = reductionPct > 0;

                return (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Fading Reduction Velocity:</span>
                      <span
                        className={`font-bold font-mono text-sm ${
                          isFading ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {reductionPct}% {isFading ? 'REDUCTION' : 'INCREASE'}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mt-1">
                      <div
                        className={`h-full ${isFading ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${Math.max(0, Math.min(100, reductionPct))}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: REGULATORY CHEAT SHEETS */}
      {activeSubTab === 'cheat_sheets' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div>
              <p className="font-semibold text-white">Australian Clinical & Regulatory Cheat Sheets</p>
              <p className="text-slate-400 mt-0.5">Quick-reference statutory criteria, deadlines, and legislative citations for daily clinical use.</p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print All</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sheet 1: Restrictive Practice 5 Categories */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Lock className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  NDIS 5 Regulated Restrictive Practice Categories
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="font-bold text-amber-300">1. Chemical Restraint: </span>
                  <span className="text-slate-300">Use of medication prescribed for the primary purpose of controlling behavior, not medical treatment.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="font-bold text-amber-300">2. Mechanical Restraint: </span>
                  <span className="text-slate-300">Use of a device to prevent, restrict, or subdue bodily movement (excluding postural support prescribed by OT).</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="font-bold text-amber-300">3. Physical Restraint: </span>
                  <span className="text-slate-300">Sustained application of physical force by staff to restrict movement of a person's body or limbs.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="font-bold text-amber-300">4. Environmental Restraint: </span>
                  <span className="text-slate-300">Restricting free access to parts of the person's environment, items, kitchen cupboards, or community.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="font-bold text-amber-300">5. Seclusion: </span>
                  <span className="text-slate-300">Sole confinement of a person with disability in a room or space at any hour of day or night where free exit is denied.</span>
                </div>
              </div>
            </div>

            {/* Sheet 2: Incident Reporting Statutory Timelines */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  NDIS Commission Incident Reporting Deadlines
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/30">
                  <div className="font-bold text-rose-300 flex items-center justify-between">
                    <span>24-Hour Mandatory Notification</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20">STRICT STATUTORY</span>
                  </div>
                  <ul className="mt-1 space-y-0.5 text-slate-300 text-[11px] list-disc pl-4">
                    <li>Death of a person with disability.</li>
                    <li>Serious injury (fractures, deep lacerations, hospital admission).</li>
                    <li>Abuse, neglect, or exploitation.</li>
                    <li>Unlawful sexual or physical contact.</li>
                    <li>Emergency or unauthorised restrictive practice use.</li>
                  </ul>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                  <div className="font-bold text-slate-300 flex items-center justify-between">
                    <span>5-Day Comprehensive Report</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800">DETAILED FOLLOW-UP</span>
                  </div>
                  <p className="mt-1 text-slate-400 text-[11px]">
                    Detailed investigation report including root-cause analysis, support provided to the participant, and preventive systemic safeguards enacted.
                  </p>
                </div>
              </div>
            </div>

            {/* Sheet 3: SCHADS Award 2020 Key Clauses */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <CalendarCheck className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Fair Work SCHADS Award 2020 Key Clauses
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="font-bold text-blue-300">Clause 25.5 (Minimum Engagement): </span>
                  <span className="text-slate-300">2 consecutive hours minimum per shift for all casual and part-time social and community services workers.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="font-bold text-blue-300">Clause 25.4 (Broken Shifts): </span>
                  <span className="text-slate-300">Maximum 2 work parts within a 12-hour span. Entitles employee to the prescribed daily broken shift allowance.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="font-bold text-blue-300">Clause 31.2 (10-Hour Rest Break): </span>
                  <span className="text-slate-300">Minimum continuous 10 hours rest pause between shifts. If resumed without 10 hours, paid at 2.0x double-time until released.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="font-bold text-blue-300">Clause 28 (Overtime Multipliers): </span>
                  <span className="text-slate-300">Mon–Sat: 1.5x for first 2 hours, 2.0x thereafter. Sunday: 2.0x double time. Public Holidays: 2.5x.</span>
                </div>
              </div>
            </div>

            {/* Sheet 4: PAPL Price Limits & MMM Rules */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Receipt className="w-4 h-4 text-teal-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  NDIS PAPL 2025/2026 Price Caps & Travel
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="font-bold text-teal-300">Therapy Price Caps (MMM 1-5): </span>
                  <span className="text-slate-300">Psychology ($214.41/hr), Physiotherapy ($193.99/hr), OT ($193.99/hr), Positive Behaviour Support ($193.99/hr).</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="font-bold text-teal-300">Provider Travel Time Limits: </span>
                  <span className="text-slate-300">Up to 30 mins (MMM 1-3 Metro), up to 60 mins (MMM 4-5 Regional). Cannot claim in MMM 1-5 if travel was not pre-agreed in writing.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="font-bold text-teal-300">Vehicle Travel Expenses: </span>
                  <span className="text-slate-300">Up to $0.99 per kilometer for standard motor vehicle when transporting or visiting participants with prior agreement.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: CLINICIAN KNOWLEDGE QUIZ */}
      {activeSubTab === 'quiz' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-teal-400" />
                <span>Clinician Onboarding & Competency Verification Quiz</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete this 8-question self-check assessment to verify operational understanding of NDIS Commission standards, SCHADS rules, and PAPL pricing.
              </p>
            </div>

            {isQuizSubmitted && quizScore !== null && (
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 font-mono text-sm font-bold">
                  Score: {quizScore} / {QUIZ_QUESTIONS.length} ({Math.round((quizScore / QUIZ_QUESTIONS.length) * 100)}%)
                </div>
                <button
                  type="button"
                  onClick={resetQuiz}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Retake Quiz
                </button>
              </div>
            )}
          </div>

          {/* Certificate of Competency if Passed */}
          {isQuizSubmitted && quizScore !== null && quizScore >= 6 && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border-2 border-emerald-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                    <span>Breakthrough Clinical Governance Competency Passed</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      VERIFIED
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Demonstrated proficient knowledge in NDIS Quality and Safeguards Commission rules, Fair Work SCHADS rostering, and PAPL travel arrangements.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition shrink-0"
              >
                Print Certificate
              </button>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-4">
            {QUIZ_QUESTIONS.map((q, idx) => {
              const selectedOpt = userAnswers[q.id];
              const isCorrect = isQuizSubmitted && selectedOpt === q.correctAnswer;
              const isWrong = isQuizSubmitted && selectedOpt !== undefined && selectedOpt !== q.correctAnswer;

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-xl border transition ${
                    isCorrect
                      ? 'bg-emerald-950/15 border-emerald-500/40'
                      : isWrong
                      ? 'bg-rose-950/15 border-rose-500/40'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-3">
                      <p className="text-xs font-bold text-white leading-relaxed">
                        {q.question}
                      </p>

                      {/* Options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {q.options.map((opt, oIdx) => {
                          const isOptionSelected = selectedOpt === oIdx;
                          const isOptionCorrect = isQuizSubmitted && oIdx === q.correctAnswer;

                          let btnClasses =
                            'p-2.5 rounded-lg text-xs text-left border transition ';
                          if (isQuizSubmitted) {
                            if (isOptionCorrect) {
                              btnClasses +=
                                'bg-emerald-500/20 text-emerald-300 border-emerald-500 font-semibold';
                            } else if (isOptionSelected && !isOptionCorrect) {
                              btnClasses +=
                                'bg-rose-500/20 text-rose-300 border-rose-500';
                            } else {
                              btnClasses +=
                                'bg-slate-950 text-slate-500 border-slate-800';
                            }
                          } else {
                            if (isOptionSelected) {
                              btnClasses +=
                                'bg-teal-500/20 text-teal-300 border-teal-500 font-semibold';
                            } else {
                              btnClasses +=
                                'bg-slate-950 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700';
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              type="button"
                              disabled={isQuizSubmitted}
                              onClick={() =>
                                setUserAnswers((prev) => ({ ...prev, [q.id]: oIdx }))
                              }
                              className={btnClasses}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-mono shrink-0">
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation after submit */}
                      {isQuizSubmitted && (
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                          <span className="font-bold text-teal-400">Statutory Citation: </span>
                          <span>{q.explanation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Action */}
          {!isQuizSubmitted && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Answer all 8 questions above to generate your score.
              </span>
              <button
                type="button"
                onClick={handleQuizSubmit}
                disabled={Object.keys(userAnswers).length < QUIZ_QUESTIONS.length}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg transition"
              >
                Submit Answers ({Object.keys(userAnswers).length}/{QUIZ_QUESTIONS.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
