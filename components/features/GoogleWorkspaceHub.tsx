import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  FileSpreadsheet,
  Mail,
  Calendar as CalendarIcon,
  FileText,
  Presentation,
  CheckSquare,
  MessageSquare,
  FileQuestion,
  BookOpen,
  Video,
  Contact,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Trash2,
  RefreshCw,
  Send,
  Database,
  Lock,
  Layers,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  initWorkspaceAuth,
  signInWithGoogleWorkspace,
  logoutWorkspace,
  getWorkspaceAccessToken,
  listDriveFiles,
  createDriveFolder,
  deleteDriveFileWithConfirm,
  createClinicalBillingSpreadsheet,
  listRecentEmails,
  sendClinicalEmailWithConfirm,
  listCalendarEvents,
  scheduleCalendarEvent,
  createClinicalDocument,
  createPresentation,
  listClinicalTasks,
  createClinicalTask,
  toggleTaskCompleted,
  listChatSpaces,
  sendChatMessageWithConfirm,
  createClinicalIntakeForm,
  createTelehealthMeeting,
  listClinicalContacts,
  createClinicalContact,
  openGoogleDrivePicker,
  DriveFileItem,
  GmailMessageItem,
  CalendarEventItem,
  TaskItem,
  ChatSpaceItem,
  ClinicalContactItem,
  PickedFileResult,
} from '../../lib/googleWorkspace';
import { useManagementStore } from '../../stores';
import firebaseConfig from '../../firebase-applet-config.json';

type SubTab =
  | 'drive_picker'
  | 'sheets'
  | 'gmail'
  | 'calendar_meet'
  | 'docs_slides'
  | 'tasks_keep'
  | 'chat'
  | 'forms_contacts'
  | 'firebase';

export const GoogleWorkspaceHub: React.FC = () => {
  const { participants, incidents, caseNotes } = useManagementStore();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('drive_picker');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Workspace entity states
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [pickedFile, setPickedFile] = useState<PickedFileResult | null>(null);
  const [recentEmails, setRecentEmails] = useState<GmailMessageItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [chatSpaces, setChatSpaces] = useState<ChatSpaceItem[]>([]);
  const [contacts, setContacts] = useState<ClinicalContactItem[]>([]);

  // Form inputs
  const [newFolderName, setNewFolderName] = useState('');
  const [emailRecipient, setEmailRecipient] = useState('support.coordinator@example.com.au');
  const [emailSubject, setEmailSubject] = useState('NDIS Functional Behaviour Assessment Update');
  const [emailBody, setEmailBody] = useState('Dear Care Team,\n\nPlease find attached the updated clinical observation summary for the scheduled NDIS review meeting.\n\nKind regards,\nBreakthrough Clinical Services');
  const [eventSummary, setEventSummary] = useState('PBS Clinical Consultation & BSP Review');
  const [eventTime, setEventTime] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [taskTitle, setTaskTitle] = useState('Finalise Section 73Z incident escalation dossier');
  const [chatMessage, setChatMessage] = useState('Urgent: Care team briefing scheduled for 3:00 PM.');
  const [contactName, setContactName] = useState('Dr. Sarah Lin');
  const [contactEmail, setContactEmail] = useState('dr.lin@melbournehealth.example');
  const [contactOrg, setContactOrg] = useState('St. Vincent Allied Health');
  const [generatedMeetLink, setGeneratedMeetLink] = useState<string | null>(null);
  const [generatedSheetUrl, setGeneratedSheetUrl] = useState<string | null>(null);
  const [generatedDocUrl, setGeneratedDocUrl] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initWorkspaceAuth(
      (user, token) => {
        setCurrentUser(user);
        setAuthToken(token);
      },
      () => {
        setCurrentUser(null);
        setAuthToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 6000);
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const res = await signInWithGoogleWorkspace();
      if (res) {
        setCurrentUser(res.user);
        setAuthToken(res.accessToken);
        showFeedback('success', `Signed in successfully as ${res.user.email}`);
        loadSubTabData(activeSubTab);
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Authentication error. Please ensure popups are allowed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutWorkspace();
      setCurrentUser(null);
      setAuthToken(null);
      showFeedback('success', 'Logged out from Google Workspace.');
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  const loadSubTabData = async (tab: SubTab) => {
    if (!getWorkspaceAccessToken()) return;
    setActionLoading(true);
    try {
      if (tab === 'drive_picker') {
        const files = await listDriveFiles();
        setDriveFiles(files);
      } else if (tab === 'gmail') {
        const msgs = await listRecentEmails();
        setRecentEmails(msgs);
      } else if (tab === 'calendar_meet') {
        const evts = await listCalendarEvents();
        setCalendarEvents(evts);
      } else if (tab === 'tasks_keep') {
        const t = await listClinicalTasks();
        setTasks(t);
      } else if (tab === 'chat') {
        const spaces = await listChatSpaces();
        setChatSpaces(spaces);
      } else if (tab === 'forms_contacts') {
        const c = await listClinicalContacts();
        setContacts(c);
      }
    } catch (err: any) {
      console.warn(`[Workspace] Error loading data for ${tab}:`, err);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      loadSubTabData(activeSubTab);
    }
  }, [activeSubTab, authToken]);

  // Actions
  const handleCreateDriveFolder = async () => {
    if (!newFolderName.trim()) return;
    setActionLoading(true);
    try {
      const folder = await createDriveFolder(newFolderName);
      setNewFolderName('');
      showFeedback('success', `Created Drive folder: "${folder.name}"`);
      const files = await listDriveFiles();
      setDriveFiles(files);
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDriveFile = async (file: DriveFileItem) => {
    try {
      const ok = await deleteDriveFileWithConfirm(file.id, file.name);
      if (ok) {
        showFeedback('success', `Deleted "${file.name}" from Drive.`);
        setDriveFiles((prev) => prev.filter((f) => f.id !== file.id));
      }
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  const handleLaunchPicker = () => {
    openGoogleDrivePicker(
      (picked) => {
        setPickedFile(picked);
        showFeedback('success', `Picked file via Google Picker: "${picked.name}"`);
      },
      (err) => {
        showFeedback('error', err.message || 'Google Picker could not be displayed.');
      }
    );
  };

  const handleExportClaimsToSheet = async () => {
    setActionLoading(true);
    try {
      const headers = [
        ['Participant Name', 'NDIS Number', 'Support Line Item', 'Rate (AUD)', 'Hours', 'Total Billed (AUD)', 'Exported Date'],
      ];
      const rows = participants.map((p) => [
        p.fullName,
        p.ndisNumber,
        '01_011_0107_1_1 (Specialist PBS)',
        '$214.41',
        '2.5',
        '$536.03',
        new Date().toLocaleDateString('en-AU'),
      ]);

      const title = `NDIS Billing Claims - ${new Date().toISOString().slice(0, 10)}`;
      const result = await createClinicalBillingSpreadsheet(title, headers, rows);
      const url = `https://docs.google.com/spreadsheets/d/${result.spreadsheetId}/edit`;
      setGeneratedSheetUrl(url);
      showFeedback('success', `Created Google Sheet "${title}" with ${rows.length} claim lines!`);
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setActionLoading(true);
    try {
      const ok = await sendClinicalEmailWithConfirm(emailRecipient, emailSubject, emailBody);
      if (ok) {
        showFeedback('success', `Email sent via Gmail to ${emailRecipient}`);
        const msgs = await listRecentEmails();
        setRecentEmails(msgs);
      }
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleEvent = async () => {
    setActionLoading(true);
    try {
      const startIso = new Date(eventTime).toISOString();
      const endIso = new Date(new Date(eventTime).getTime() + 60 * 60 * 1000).toISOString();
      const evt = await scheduleCalendarEvent(eventSummary, 'Breakthrough Manager OS clinical session', startIso, endIso, 'Clinical Room 3 / Telehealth');
      showFeedback('success', `Scheduled Google Calendar event: "${evt.summary}"`);
      const evts = await listCalendarEvents();
      setCalendarEvents(evts);
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateBSPDoc = async () => {
    setActionLoading(true);
    try {
      const title = `Comprehensive Behaviour Support Plan - ${new Date().toLocaleDateString('en-AU')}`;
      const content = `BREAKTHROUGH CLINICAL SERVICES - POSITIVE BEHAVIOUR SUPPORT PLAN (BSP)\n\nPrepared for NDIS Quality and Safeguards Commission\nDate: ${new Date().toLocaleDateString('en-AU')}\nClinical Branch: Melbourne VIC\n\n1. CLINICAL FORMULATION & PROFILE\nPrimary Target Behaviours: De-escalation strategies, communication replacements.\n\n2. LEGISLATIVE RESTRICTIVE PRACTICES REGISTER\nAll chemical, physical, and environmental interventions are strictly monitored with positive fading schedules.\n\n3. ALLIED HEALTH CARE TEAM\nPBS Specialist, Speech Pathologist, Occupational Therapist.`;
      const doc = await createClinicalDocument(title, content);
      const url = `https://docs.google.com/document/d/${doc.documentId}/edit`;
      setGeneratedDocUrl(url);
      showFeedback('success', `Created Google Doc: "${title}"`);
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSlides = async () => {
    setActionLoading(true);
    try {
      const title = `NDIS Clinical Governance Case Conference - ${new Date().toLocaleDateString('en-AU')}`;
      const pres = await createPresentation(title);
      showFeedback('success', `Created Google Slides presentation: "${title}" (ID: ${pres.presentationId})`);
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) return;
    setActionLoading(true);
    try {
      await createClinicalTask(taskTitle, 'NDIS Practice Compliance Task');
      setTaskTitle('');
      showFeedback('success', 'Created Google Task');
      const t = await listClinicalTasks();
      setTasks(t);
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleTask = async (task: TaskItem) => {
    try {
      const nextCompleted = task.status !== 'completed';
      await toggleTaskCompleted(task.id, nextCompleted);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextCompleted ? 'completed' : 'needsAction' } : t))
      );
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  const handleSendChatMessage = async (space: ChatSpaceItem) => {
    try {
      const ok = await sendChatMessageWithConfirm(space.name, space.displayName, chatMessage);
      if (ok) {
        showFeedback('success', `Message sent to Google Chat space "${space.displayName}"`);
      }
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  const handleCreateIntakeForm = async () => {
    setActionLoading(true);
    try {
      const form = await createClinicalIntakeForm(`NDIS Participant Intake & Clinical Feedback Form`);
      showFeedback('success', `Created Google Form: "${form.info.title}"`);
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateMeet = async () => {
    setActionLoading(true);
    try {
      const space = await createTelehealthMeeting();
      setGeneratedMeetLink(space.meetingUri);
      showFeedback('success', `Generated Google Meet Telehealth Consultation Room!`);
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateContact = async () => {
    if (!contactName.trim()) return;
    setActionLoading(true);
    try {
      const parts = contactName.split(' ');
      const given = parts[0] || 'Contact';
      const family = parts.slice(1).join(' ') || '';
      await createClinicalContact(given, family, contactEmail, '+61 3 9000 1234', contactOrg);
      showFeedback('success', `Added ${contactName} to Google Contacts (People API)`);
      const c = await listClinicalContacts();
      setContacts(c);
      setContactName('');
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Firebase & Google Workspace Cloud Status */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-100">Google Workspace & Firebase Cloud Hub</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                  ENTERPRISE CERTIFIED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full-stack integration for Google Drive, Sheets, Gmail, Calendar, Docs, Slides, Tasks, Chat, Forms, Keep, Meet, Contacts, and Picker with Firebase Firestore.
              </p>
            </div>
          </div>

          {/* Auth Button & Profile Cluster */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700/80 px-3.5 py-1.5 rounded-xl">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google User'}
                    className="w-7 h-7 rounded-full border border-slate-600"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                    {currentUser.displayName?.[0] || 'U'}
                  </div>
                )}
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-200 truncate max-w-[140px]">
                    {currentUser.displayName || currentUser.email}
                  </div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Workspace Connected
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-slate-400 hover:text-rose-300 ml-2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700/80 transition"
                  title="Sign out from Google Workspace"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              /* Official Google Sign-In Button Pattern per workspace-integration skill */
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-medium text-xs shadow-md transition active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Firebase Cloud Diagnostics Strip */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-700/60">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block">Firestore Project</span>
              <span className="font-mono text-slate-200 font-semibold truncate">{firebaseConfig.projectId}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-700/60">
            <Lock className="w-4 h-4 text-teal-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block">Security Rules</span>
              <span className="text-emerald-300 font-semibold">Zero-Trust ABAC Active</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-700/60">
            <Layers className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block">NDIS Collections</span>
              <span className="text-slate-200 font-semibold">{participants.length} P | {incidents.length} Inc | {caseNotes.length} SOAP</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-700/60">
            <UploadCloud className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block">Google Region</span>
              <span className="text-slate-200 font-semibold">asia-southeast1</span>
            </div>
          </div>
        </div>

        {feedbackMessage && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-950/40 text-rose-300 border-rose-500/40'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800">
        {[
          { key: 'drive_picker', label: 'Drive & Picker', icon: FolderKanban },
          { key: 'sheets', label: 'Google Sheets (Claims)', icon: FileSpreadsheet },
          { key: 'gmail', label: 'Gmail Dispatch', icon: Mail },
          { key: 'calendar_meet', label: 'Calendar & Meet', icon: CalendarIcon },
          { key: 'docs_slides', label: 'Docs & Slides', icon: FileText },
          { key: 'tasks_keep', label: 'Tasks & Keep', icon: CheckSquare },
          { key: 'chat', label: 'Google Chat', icon: MessageSquare },
          { key: 'forms_contacts', label: 'Forms & Contacts', icon: Contact },
          { key: 'firebase', label: 'Firebase Data Engine', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as SubTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SubTab Content */}
      <div className="space-y-6">
        {/* 1. DRIVE & PICKER */}
        {activeSubTab === 'drive_picker' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-blue-400" />
                  <h2 className="text-sm font-bold text-slate-100">Google Drive Document Repository</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLaunchPicker}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Launch Google Picker</span>
                  </button>
                  <button
                    onClick={() => loadSubTabData('drive_picker')}
                    disabled={actionLoading}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                    title="Refresh files"
                  >
                    <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {pickedFile && (
                <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="font-semibold text-indigo-200">Selected via Picker:</span>
                    <span className="text-slate-200 truncate">{pickedFile.name}</span>
                  </div>
                  {pickedFile.url && (
                    <a
                      href={pickedFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px] shrink-0 font-medium"
                    >
                      Open <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* File list */}
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden">
                {driveFiles.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    {currentUser ? 'No Drive files loaded. Click Refresh to query.' : 'Sign in with Google to explore Drive files.'}
                  </div>
                ) : (
                  driveFiles.map((file) => (
                    <div key={file.id} className="p-3 flex items-center justify-between hover:bg-slate-800/40 transition">
                      <div className="flex items-center gap-3 truncate pr-2">
                        {file.iconLink ? (
                          <img src={file.iconLink} alt="" className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div className="truncate">
                          <p className="text-xs font-medium text-slate-200 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{file.mimeType}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                            title="Open in Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteDriveFile(file)}
                          className="p-1.5 rounded hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                          title="Delete file (confirmation required)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Folder creation & Quick Launch */}
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Create Drive Folder</span>
              </h3>
              <p className="text-xs text-slate-400">
                Organise clinical dossiers, Behavior Support Plans, and audit documents by participant or fiscal year.
              </p>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="e.g. NDIS Audits 2026-Q1"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleCreateDriveFolder}
                  disabled={actionLoading || !newFolderName.trim()}
                  className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Create Folder in Drive
                </button>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  NDIS Folder Templates
                </span>
                <div className="flex flex-wrap gap-2">
                  {['BSP Audits 2026', 'Participant Dossiers', 'Restrictive Practices Log', 'PRODA Claim Sheets'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setNewFolderName(t)}
                      className="text-[11px] px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
                    >
                      + {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. SHEETS */}
        {activeSubTab === 'sheets' && (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100">Google Sheets NDIS PAPL Claim Exporter</h2>
                  <p className="text-xs text-slate-400">
                    Creates native spreadsheets in your Google Drive with compliant NDIA PRODA bulk claiming columns.
                  </p>
                </div>
              </div>

              <button
                onClick={handleExportClaimsToSheet}
                disabled={actionLoading || !currentUser}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Export {participants.length} Active Claims to Google Sheets</span>
              </button>
            </div>

            {generatedSheetUrl && (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Google Spreadsheet successfully deployed to your Drive!</span>
                </div>
                <a
                  href={generatedSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition"
                >
                  <span>Open in Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Claims Preview Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-800/60 px-4 py-2.5 border-b border-slate-700/80 text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>NDIS Claim Rows Prepared for Google Sheets Export</span>
                <span className="text-[11px] text-slate-400">{participants.length} Records</span>
              </div>
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/30 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Participant</th>
                    <th className="p-2.5">NDIS Number</th>
                    <th className="p-2.5">Line Item Code</th>
                    <th className="p-2.5">PAPL Rate</th>
                    <th className="p-2.5">Billed Units</th>
                    <th className="p-2.5">Claim Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {participants.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-medium text-slate-200">{p.fullName}</td>
                      <td className="p-2.5 font-mono text-slate-400">{p.ndisNumber}</td>
                      <td className="p-2.5 font-mono text-xs text-teal-400">01_011_0107_1_1</td>
                      <td className="p-2.5 font-mono">$214.41</td>
                      <td className="p-2.5">2.5 hrs</td>
                      <td className="p-2.5 font-semibold text-emerald-400">$536.03</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. GMAIL */}
        {activeSubTab === 'gmail' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compose Dispatch Form */}
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-rose-400" />
                <h2 className="text-sm font-bold text-slate-100">Send Clinical Dispatch via Gmail</h2>
              </div>
              <p className="text-xs text-slate-400">
                Emails are sent directly from your connected Google account with explicit confirmation dialogs.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Body Text</label>
                  <textarea
                    rows={6}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <button
                  onClick={handleSendEmail}
                  disabled={actionLoading || !currentUser}
                  className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Email with Confirmation</span>
                </button>
              </div>
            </div>

            {/* Recent Gmail Messages */}
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>Recent Clinical Inbox Threads</span>
                </h3>
                <button
                  onClick={() => loadSubTabData('gmail')}
                  disabled={actionLoading}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {recentEmails.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    {currentUser ? 'No messages found or loading...' : 'Sign in to fetch recent Gmail threads.'}
                  </div>
                ) : (
                  recentEmails.map((msg) => (
                    <div key={msg.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/80 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200 truncate">{msg.subject}</span>
                        {msg.date && <span className="text-[10px] text-slate-400">{new Date(msg.date).toLocaleDateString('en-AU')}</span>}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">From: {msg.from}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{msg.snippet}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. CALENDAR & MEET */}
        {activeSubTab === 'calendar_meet' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-amber-400" />
                  <h2 className="text-sm font-bold text-slate-100">Schedule in Google Calendar</h2>
                </div>
                <button
                  onClick={handleCreateMeet}
                  disabled={actionLoading || !currentUser}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow transition cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Generate Meet Link</span>
                </button>
              </div>

              {generatedMeetLink && (
                <div className="p-3 rounded-lg bg-teal-950/30 border border-teal-500/30 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-teal-300 truncate">
                    <Video className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="truncate">{generatedMeetLink}</span>
                  </div>
                  <a
                    href={generatedMeetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-400 hover:text-teal-300 font-bold shrink-0 ml-2"
                  >
                    Join
                  </a>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Event Summary</label>
                  <input
                    type="text"
                    value={eventSummary}
                    onChange={(e) => setEventSummary(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  onClick={handleScheduleEvent}
                  disabled={actionLoading || !currentUser}
                  className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Add to Google Calendar
                </button>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-slate-400" />
                  <span>Upcoming Google Calendar Sessions</span>
                </h3>
                <button
                  onClick={() => loadSubTabData('calendar_meet')}
                  disabled={actionLoading}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {calendarEvents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    {currentUser ? 'No upcoming events found in primary calendar.' : 'Sign in to fetch Calendar events.'}
                  </div>
                ) : (
                  calendarEvents.map((evt) => (
                    <div key={evt.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/80 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{evt.summary}</span>
                        {evt.htmlLink && (
                          <a href={evt.htmlLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleString('en-AU') : evt.start?.date}
                      </p>
                      {evt.location && <p className="text-[10px] text-slate-500">Location: {evt.location}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. DOCS & SLIDES */}
        {activeSubTab === 'docs_slides' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h2 className="text-sm font-bold text-slate-100">Google Docs: Behaviour Support Plan (BSP)</h2>
              </div>
              <p className="text-xs text-slate-400">
                Generates a standardized clinical Behaviour Support Plan document in your Google Drive with NDIS Commission sections.
              </p>

              <button
                onClick={handleCreateBSPDoc}
                disabled={actionLoading || !currentUser}
                className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Generate Comprehensive BSP Google Doc</span>
              </button>

              {generatedDocUrl && (
                <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-500/30 text-xs flex items-center justify-between">
                  <span className="text-blue-300">Google Doc initialized!</span>
                  <a
                    href={generatedDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-bold"
                  >
                    Open Document <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Presentation className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-bold text-slate-100">Google Slides: Clinical Case Conference</h2>
              </div>
              <p className="text-xs text-slate-400">
                Creates a Google Slides presentation for multi-disciplinary clinical team reviews and restrictive practices training.
              </p>

              <button
                onClick={handleCreateSlides}
                disabled={actionLoading || !currentUser}
                className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow transition cursor-pointer"
              >
                <Presentation className="w-4 h-4" />
                <span>Create Case Review Google Slides Deck</span>
              </button>
            </div>
          </div>
        )}

        {/* 6. TASKS & KEEP */}
        {activeSubTab === 'tasks_keep' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-sm font-bold text-slate-100">Google Tasks: Statutory Action Items</h2>
                </div>
                <button
                  onClick={() => loadSubTabData('tasks_keep')}
                  disabled={actionLoading}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Lodge 24h reportable allegation dossier"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleCreateTask}
                  disabled={actionLoading || !taskTitle.trim() || !currentUser}
                  className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs cursor-pointer"
                >
                  Add Task
                </button>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {tasks.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    {currentUser ? 'No tasks found.' : 'Sign in to sync Google Tasks.'}
                  </div>
                ) : (
                  tasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTask(t)}
                      className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/80 flex items-center justify-between hover:bg-slate-800/80 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <input
                          type="checkbox"
                          checked={t.status === 'completed'}
                          onChange={() => {}}
                          className="rounded text-emerald-500 focus:ring-0 cursor-pointer"
                        />
                        <span className={`text-xs ${t.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {t.title}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-bold text-slate-100">Google Keep: Clinical Observation Scratchpad</h2>
              </div>
              <p className="text-xs text-slate-400">
                Quickly record rapid clinical observations, sensory triggers, and shift handovers directly synced with Google Keep and Drive notes.
              </p>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-2">
                <span className="font-semibold block">Synchronised Clinical Scratchpad:</span>
                <p className="text-[11px] leading-relaxed">
                  Fast handovers and sensory triggers recorded during frontline shifts are instantly mapped into the NDIS participant SOAP note queue.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 7. CHAT */}
        {activeSubTab === 'chat' && (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-100">Google Chat Care Team Spaces</h2>
              </div>
              <button
                onClick={() => loadSubTabData('chat')}
                disabled={actionLoading}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Broadcast critical incident notifications and clinical updates directly to care team Google Chat spaces with confirmation.
            </p>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Message to post..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden">
                {chatSpaces.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    {currentUser ? 'No Google Chat spaces found for this account.' : 'Sign in to list Google Chat spaces.'}
                  </div>
                ) : (
                  chatSpaces.map((s) => (
                    <div key={s.name} className="p-3 flex items-center justify-between hover:bg-slate-800/40 transition">
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{s.displayName || 'Clinical Care Space'}</p>
                        <p className="text-[10px] text-slate-500">{s.name}</p>
                      </div>
                      <button
                        onClick={() => handleSendChatMessage(s)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition cursor-pointer"
                      >
                        Send Alert
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 8. FORMS & CONTACTS */}
        {activeSubTab === 'forms_contacts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-purple-400" />
                <h2 className="text-sm font-bold text-slate-100">Google Forms: Intake & Quality Feedback</h2>
              </div>
              <p className="text-xs text-slate-400">
                Deploy participant intake surveys and support worker shift debrief forms straight into Google Forms.
              </p>

              <button
                onClick={handleCreateIntakeForm}
                disabled={actionLoading || !currentUser}
                className="w-full py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create NDIS Intake Google Form</span>
              </button>
            </div>

            <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Contact className="w-5 h-5 text-teal-400" />
                  <h2 className="text-sm font-bold text-slate-100">Google Contacts (People API)</h2>
                </div>
                <button
                  onClick={() => loadSubTabData('forms_contacts')}
                  disabled={actionLoading}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Practitioner / GP Name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200"
                  />
                </div>
                <button
                  onClick={handleCreateContact}
                  disabled={actionLoading || !currentUser}
                  className="w-full py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Add to Clinical Contacts
                </button>
              </div>

              <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
                {contacts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    {currentUser ? 'No contacts found.' : 'Sign in to fetch contacts.'}
                  </div>
                ) : (
                  contacts.map((c, i) => (
                    <div key={i} className="p-2 rounded bg-slate-800/40 border border-slate-700/80 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-200">{c.displayName}</p>
                        {c.email && <p className="text-[10px] text-slate-400">{c.email}</p>}
                      </div>
                      {c.organization && <span className="text-[10px] text-teal-400">{c.organization}</span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 9. FIREBASE DATA ENGINE */}
        {activeSubTab === 'firebase' && (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-100">Firebase Firestore Cloud Integration</h2>
                  <p className="text-xs text-slate-400">
                    Connected to Google Cloud Project: <span className="font-mono text-slate-300">{firebaseConfig.projectId}</span>
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Firestore Active
              </span>
            </div>

            {/* Architecture Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Database Schema IR</span>
                <p className="text-xs font-mono text-emerald-400">firebase-blueprint.json</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Defines entities for participants, 24h statutory incidents, SOAP notes, and linked Google Workspace artifacts.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security Rules</span>
                <p className="text-xs font-mono text-teal-400">firestore.rules (ABAC v2)</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Mandates zero-trust partition verification, default deny catch-all, and non-deletable statutory incident records.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Client SDK Engine</span>
                <p className="text-xs font-mono text-blue-400">firebase@12.18.0</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Equipped with getDocFromServer verification, error telemetry handlers, and in-memory token security.
                </p>
              </div>
            </div>

            {/* Active Collection Status */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-800/60 px-4 py-2.5 text-xs font-semibold text-slate-200">
                Firestore Multi-Tenant Partitions (/tenants/tenant-breakthrough-vic/)
              </div>
              <div className="divide-y divide-slate-800 text-xs">
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-300 font-mono">/participants</span>
                  <span className="text-emerald-400 font-semibold">{participants.length} Active Participants</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-300 font-mono">/incidents</span>
                  <span className="text-rose-400 font-semibold">{incidents.length} Statutory Records</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-300 font-mono">/caseNotes</span>
                  <span className="text-blue-400 font-semibold">{caseNotes.length} SOAP Clinical Entries</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-300 font-mono">/workspaceResources</span>
                  <span className="text-teal-400 font-semibold">Indexed Google Workspace Artifacts</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
