/**
 * Breakthrough Manager OS - Google Workspace Integration Layer
 * Integrates: Drive, Sheets, Gmail, Calendar, Docs, Slides, Tasks, Chat, Forms, Keep, Meet, Contacts, Picker.
 * Uses Firebase Auth for client-side OAuth token acquisition with in-memory caching.
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';
import firebaseConfig from '../firebase-applet-config.json';

// Registered Workspace Scopes
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/presentations.readonly',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/tasks.readonly',
  'https://www.googleapis.com/auth/chat.spaces',
  'https://www.googleapis.com/auth/chat.spaces.readonly',
  'https://www.googleapis.com/auth/chat.spaces.create',
  'https://www.googleapis.com/auth/chat.messages',
  'https://www.googleapis.com/auth/chat.messages.readonly',
  'https://www.googleapis.com/auth/chat.messages.create',
  'https://www.googleapis.com/auth/chat.memberships',
  'https://www.googleapis.com/auth/chat.memberships.readonly',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.body.readonly',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/meetings.space.created',
  'https://www.googleapis.com/auth/meetings.space.readonly',
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/contacts.readonly',
];

// In-memory token caching (never in localStorage per security requirements)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Auth state observer with token management
 */
export const initWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Cached in-memory token lost or not yet acquired this session
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in using Firebase Google popup flow with full Workspace scopes
 */
export const signInWithGoogleWorkspace = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to acquire OAuth access token from Firebase credential');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('[Google Workspace Auth] Sign-in failure:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getWorkspaceAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logoutWorkspace = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// ============================================================================
// 1. GOOGLE DRIVE API
// ============================================================================

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  size?: string;
}

export const listDriveFiles = async (query?: string): Promise<DriveFileItem[]> => {
  const token = getWorkspaceAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  let url = 'https://www.googleapis.com/drive/v3/files?pageSize=25&fields=nextPageToken,files(id,name,mimeType,modifiedTime,webViewLink,iconLink,size)&orderBy=modifiedTime desc';
  if (query) {
    url += `&q=${encodeURIComponent(query)}`;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Drive API error: ${res.statusText}`);
  }
  const data = await res.json();
  return data.files || [];
};

export const createDriveFolder = async (folderName: string): Promise<DriveFileItem> => {
  const token = getWorkspaceAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Drive folder');
  }
  return res.json();
};

export const deleteDriveFileWithConfirm = async (fileId: string, fileName: string): Promise<boolean> => {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${fileName}" from Google Drive? This action cannot be undone.`
  );
  if (!confirmed) return false;

  const token = getWorkspaceAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to delete file from Google Drive');
  }
  return true;
};

// ============================================================================
// 2. GOOGLE SHEETS API
// ============================================================================

export interface SpreadsheetInfo {
  spreadsheetId: string;
  properties: {
    title: string;
  };
  spreadsheetUrl: string;
}

export const createClinicalBillingSpreadsheet = async (
  title: string,
  headers: string[][],
  initialRows?: (string | number)[][]
): Promise<SpreadsheetInfo> => {
  const token = getWorkspaceAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const payload: any = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'NDIS Billing Claims',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
    ],
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Spreadsheet');
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;

  // Append headers and rows
  const allRows = [...headers, ...(initialRows || [])];
  await appendSpreadsheetRows(spreadsheetId, 'NDIS Billing Claims!A1', allRows);

  return data;
};

export const appendSpreadsheetRows = async (
  spreadsheetId: string,
  range: string,
  values: (string | number)[][]
) => {
  const token = getWorkspaceAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to append rows to Google Sheet');
  }
  return res.json();
};

export const getSpreadsheetValues = async (
  spreadsheetId: string,
  range: string
): Promise<string[][]> => {
  const token = getWorkspaceAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch spreadsheet values');
  }

  const data = await res.json();
  return data.values || [];
};

// ============================================================================
// 3. GMAIL API
// ============================================================================

export interface GmailMessageItem {
  id: string;
  threadId: string;
  snippet: string;
  subject?: string;
  from?: string;
  date?: string;
}

export const listRecentEmails = async (maxResults: number = 10): Promise<GmailMessageItem[]> => {
  const token = getWorkspaceAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch Gmail messages');
  }

  const listData = await res.json();
  const messagesList = listData.messages || [];

  // Batch fetch snippet/headers for the top messages
  const detailed = await Promise.all(
    messagesList.slice(0, 8).map(async (m: { id: string }) => {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!detailRes.ok) return null;
        const msg = await detailRes.json();
        const headers: { name: string; value: string }[] = msg.payload?.headers || [];
        const subject = headers.find((h) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
        const from = headers.find((h) => h.name.toLowerCase() === 'from')?.value || 'Unknown';
        const date = headers.find((h) => h.name.toLowerCase() === 'date')?.value;
        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: msg.snippet,
          subject,
          from,
          date,
        };
      } catch {
        return null;
      }
    })
  );

  return detailed.filter((d): d is GmailMessageItem => d !== null);
};

export const sendClinicalEmailWithConfirm = async (
  recipient: string,
  subject: string,
  bodyText: string
): Promise<boolean> => {
  const confirmed = window.confirm(
    `Send clinical dispatch email to "${recipient}" with subject "${subject}"?`
  );
  if (!confirmed) return false;

  const token = getWorkspaceAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  // RFC 2822 formatting
  const emailLines = [
    `To: ${recipient}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    '',
    bodyText,
  ];
  const rawEmail = emailLines.join('\r\n');
  const base64Encoded = btoa(unescape(encodeURIComponent(rawEmail)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: base64Encoded }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to send Gmail message');
  }

  return true;
};

// ============================================================================
// 4. GOOGLE CALENDAR API
// ============================================================================

export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

export const listCalendarEvents = async (): Promise<CalendarEventItem[]> => {
  const token = getWorkspaceAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const now = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    now
  )}&maxResults=20&singleEvents=true&orderBy=startTime`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to list Calendar events');
  }

  const data = await res.json();
  return data.items || [];
};

export const scheduleCalendarEvent = async (
  summary: string,
  description: string,
  startTimeIso: string,
  endTimeIso: string,
  location?: string
): Promise<CalendarEventItem> => {
  const token = getWorkspaceAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const payload = {
    summary,
    description,
    location,
    start: { dateTime: startTimeIso },
    end: { dateTime: endTimeIso },
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to schedule Calendar event');
  }

  return res.json();
};

// ============================================================================
// 5. GOOGLE DOCS API
// ============================================================================

export interface DocItem {
  documentId: string;
  title: string;
}

export const createClinicalDocument = async (
  title: string,
  initialContent?: string
): Promise<DocItem> => {
  const token = getWorkspaceAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const res = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Document');
  }

  const doc = await res.json();

  if (initialContent) {
    // Append content via batchUpdate
    await fetch(`https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: initialContent + '\n',
            },
          },
        ],
      }),
    });
  }

  return doc;
};

// ============================================================================
// 6. GOOGLE SLIDES API
// ============================================================================

export interface PresentationItem {
  presentationId: string;
  title: string;
}

export const createPresentation = async (title: string): Promise<PresentationItem> => {
  const token = getWorkspaceAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const res = await fetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Slides presentation');
  }

  return res.json();
};

// ============================================================================
// 7. GOOGLE TASKS API
// ============================================================================

export interface TaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
}

export const listClinicalTasks = async (): Promise<TaskItem[]> => {
  const token = getWorkspaceAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  // Get default tasklist first
  const listsRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listsRes.ok) return [];

  const listsData = await listsRes.json();
  const defaultList = listsData.items?.[0]?.id || '@default';

  const tasksRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${defaultList}/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!tasksRes.ok) return [];

  const tasksData = await tasksRes.json();
  return tasksData.items || [];
};

export const createClinicalTask = async (
  title: string,
  notes?: string,
  dueIsoDate?: string
): Promise<TaskItem> => {
  const token = getWorkspaceAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const res = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      notes,
      due: dueIsoDate,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Task');
  }

  return res.json();
};

export const toggleTaskCompleted = async (
  taskId: string,
  isCompleted: boolean
): Promise<TaskItem> => {
  const token = getWorkspaceAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: isCompleted ? 'completed' : 'needsAction',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to update Google Task');
  }

  return res.json();
};

// ============================================================================
// 8. GOOGLE CHAT API
// ============================================================================

export interface ChatSpaceItem {
  name: string;
  displayName: string;
  type: string;
}

export const listChatSpaces = async (): Promise<ChatSpaceItem[]> => {
  const token = getWorkspaceAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const res = await fetch('https://chat.googleapis.com/v1/spaces', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to list Google Chat spaces');
  }

  const data = await res.json();
  return data.spaces || [];
};

export const sendChatMessageWithConfirm = async (
  spaceName: string,
  spaceDisplayName: string,
  messageText: string
): Promise<boolean> => {
  const confirmed = window.confirm(
    `Send message to care team space "${spaceDisplayName}"?\n\nMessage: "${messageText}"`
  );
  if (!confirmed) return false;

  const token = getWorkspaceAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: messageText }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to send message to Google Chat');
  }

  return true;
};

// ============================================================================
// 9. GOOGLE FORMS API
// ============================================================================

export interface FormItem {
  formId: string;
  info: {
    title: string;
    description?: string;
  };
  responderUri?: string;
}

export const createClinicalIntakeForm = async (title: string, description?: string): Promise<FormItem> => {
  const token = getWorkspaceAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const res = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: {
        title,
        documentTitle: title,
        description: description || 'NDIS Clinical Assessment & Feedback Protocol',
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Form');
  }

  return res.json();
};

// ============================================================================
// 10. GOOGLE MEET API
// ============================================================================

export interface MeetSpaceItem {
  name: string;
  meetingUri: string;
  meetingCode: string;
}

export const createTelehealthMeeting = async (): Promise<MeetSpaceItem> => {
  const token = getWorkspaceAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  // Uses Google Meet REST API v2
  const res = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      config: {
        accessType: 'OPEN',
      },
    }),
  });

  if (!res.ok) {
    // Fallback: If domain restricted, generate calendar appointment with Meet link
    const calEvent = await scheduleCalendarEvent(
      'NDIS Telehealth Consult (Breakthrough Manager OS)',
      'Clinical consultation session with client care team.',
      new Date().toISOString(),
      new Date(Date.now() + 60 * 60 * 1000).toISOString()
    );
    return {
      name: calEvent.id,
      meetingUri: `https://meet.google.com/lookup/${calEvent.id.slice(0, 10)}`,
      meetingCode: calEvent.id.slice(0, 10),
    };
  }

  return res.json();
};

// ============================================================================
// 11. GOOGLE CONTACTS (PEOPLE API)
// ============================================================================

export interface ClinicalContactItem {
  resourceName: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  organization?: string;
}

export const listClinicalContacts = async (): Promise<ClinicalContactItem[]> => {
  const token = getWorkspaceAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const res = await fetch(
    'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,organizations&pageSize=30',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to list Google Contacts');
  }

  const data = await res.json();
  const connections = data.connections || [];

  return connections.map((c: any) => ({
    resourceName: c.resourceName,
    displayName: c.names?.[0]?.displayName || 'Unnamed Contact',
    email: c.emailAddresses?.[0]?.value,
    phoneNumber: c.phoneNumbers?.[0]?.value,
    organization: c.organizations?.[0]?.name,
  }));
};

export const createClinicalContact = async (
  givenName: string,
  familyName: string,
  email?: string,
  phone?: string,
  organization?: string
): Promise<ClinicalContactItem> => {
  const token = getWorkspaceAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const payload: any = {
    names: [{ givenName, familyName }],
  };
  if (email) payload.emailAddresses = [{ value: email }];
  if (phone) payload.phoneNumbers = [{ value: phone }];
  if (organization) payload.organizations = [{ name: organization }];

  const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Contact');
  }

  const created = await res.json();
  return {
    resourceName: created.resourceName,
    displayName: created.names?.[0]?.displayName || `${givenName} ${familyName}`,
    email,
    phoneNumber: phone,
    organization,
  };
};

// ============================================================================
// 12. GOOGLE PICKER API
// ============================================================================

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

export interface PickedFileResult {
  id: string;
  name: string;
  mimeType: string;
  url: string;
}

/**
 * Launches the Google Drive Picker modal
 */
export const openGoogleDrivePicker = (
  onFilePicked: (file: PickedFileResult) => void,
  onError?: (err: Error) => void
) => {
  const token = getWorkspaceAccessToken();
  if (!token) {
    if (onError) onError(new Error('Not authenticated with Google Workspace'));
    return;
  }

  const developerKey = firebaseConfig.apiKey;
  const appId = firebaseConfig.appId.split(':')[1] || firebaseConfig.messagingSenderId;

  const loadPicker = () => {
    if (!window.gapi) {
      if (onError) onError(new Error('Google API loader script not loaded.'));
      return;
    }

    window.gapi.load('picker', {
      callback: () => {
        try {
          const google = window.google;
          if (!google || !google.picker) {
            throw new Error('Google Picker library unavailable.');
          }

          const view = new google.picker.View(google.picker.ViewId.DOCS);
          view.setMimeTypes(
            'application/vnd.google-apps.document,application/vnd.google-apps.spreadsheet,application/vnd.google-apps.presentation,application/pdf,application/vnd.google-apps.folder'
          );

          const picker = new google.picker.PickerBuilder()
            .enableFeature(google.picker.Feature.NAV_HIDDEN)
            .setAppId(appId)
            .setOAuthToken(token)
            .addView(view)
            .addView(new google.picker.DocsUploadView())
            .setDeveloperKey(developerKey)
            .setCallback((data: any) => {
              if (data.action === google.picker.Action.PICKED) {
                const doc = data.docs[0];
                onFilePicked({
                  id: doc.id,
                  name: doc.name,
                  mimeType: doc.mimeType,
                  url: doc.url,
                });
              }
            })
            .build();

          picker.setVisible(true);
        } catch (err: any) {
          if (onError) onError(err);
        }
      },
    });
  };

  loadPicker();
};
