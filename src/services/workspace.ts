/**
 * Google Workspace APIs Integration Client
 * Gmail, Google Sheets, Google Docs, and Google Drive
 * Using Client-Side Bearer Tokens obtained via Firebase Google Auth
 */

async function safeParseJson<T = any>(res: Response, fallbackErrMsg = 'Request failed'): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    let message = `${fallbackErrMsg} (${res.status} ${res.statusText})`;
    if (contentType.includes('application/json')) {
      try {
        const errJson = await res.json();
        message = errJson.error?.message || errJson.message || message;
      } catch {
        // Fallback to status text
      }
    } else {
      try {
        const text = await res.text();
        if (text && !text.includes('<!doctype') && !text.includes('<html')) {
          message = text.slice(0, 200);
        }
      } catch {
        // Fallback to status text
      }
    }
    throw new Error(message);
  }

  if (!contentType.includes('application/json')) {
    throw new Error(`${fallbackErrMsg}: Expected JSON response but received ${contentType || 'non-JSON'}`);
  }

  try {
    return await res.json();
  } catch (err: any) {
    throw new Error(`${fallbackErrMsg}: Failed to parse JSON response (${err.message || 'SyntaxError'})`);
  }
}

// ==========================================
// 1. GOOGLE DRIVE API
// ==========================================

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
  size?: string;
}

export async function listDriveFiles(
  accessToken: string,
  searchQuery = ''
): Promise<DriveFileItem[]> {
  try {
    let q = "trashed = false";
    if (searchQuery.trim()) {
      q += ` and name contains '${searchQuery.replace(/'/g, "\\'")}'`;
    }

    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('pageSize', '20');
    url.searchParams.set('fields', 'files(id, name, mimeType, modifiedTime, webViewLink, size)');
    url.searchParams.set('q', q);
    url.searchParams.set('orderBy', 'modifiedTime desc');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await safeParseJson(res, 'Drive API error');
    return data.files || [];
  } catch (err: any) {
    console.error('Error listing Drive files:', err);
    throw err;
  }
}

export async function uploadTextFileToDrive(
  accessToken: string,
  fileName: string,
  content: string,
  mimeType = 'text/plain'
): Promise<DriveFileItem> {
  const metadata = {
    name: fileName,
    mimeType: mimeType,
  };

  const boundary = 'foo_bar_baz_maritime';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  return await safeParseJson(res, 'Failed to upload file to Google Drive');
}

// ==========================================
// 2. GOOGLE SHEETS API
// ==========================================

export interface CreateSpreadsheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

export async function createGoogleSpreadsheet(
  accessToken: string,
  title: string,
  rows: Array<Array<string | number>>
): Promise<CreateSpreadsheetResult> {
  // Step 1: Create Spreadsheet
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || 'Mariner Operations Spreadsheet',
      },
      sheets: [
        {
          properties: {
            title: 'Operations Sheet',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  const sheet = await safeParseJson(res, 'Failed to create Google Spreadsheet');
  const spreadsheetId = sheet.spreadsheetId;
  const spreadsheetUrl = sheet.spreadsheetUrl;

  // Step 2: Populate with rows if provided
  if (rows && rows.length > 0) {
    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Operations Sheet!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: rows,
        }),
      }
    );
    await safeParseJson(appendRes, 'Failed to append rows to Google Spreadsheet');
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
  };
}

// ==========================================
// 3. GOOGLE DOCS API
// ==========================================

export interface CreateDocResult {
  documentId: string;
  documentUrl: string;
  title: string;
}

export async function createGoogleDoc(
  accessToken: string,
  title: string,
  content: string
): Promise<CreateDocResult> {
  // Step 1: Create Document
  const res = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title || 'Maritime Operations Report',
    }),
  });

  const docData = await safeParseJson(res, 'Failed to create Google Doc');
  const documentId = docData.documentId;
  const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

  // Step 2: Insert text content
  if (content.trim()) {
    const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: `${content}\n\n[Generated via MarinerAI - Grounded on MAR-KB-001]\n`,
            },
          },
        ],
      }),
    });
    await safeParseJson(updateRes, 'Failed to update Google Doc content');
  }

  return {
    documentId,
    documentUrl,
    title,
  };
}

// ==========================================
// 4. GMAIL API
// ==========================================

export interface GmailMessageHeader {
  id: string;
  threadId: string;
  snippet: string;
  date?: string;
  from?: string;
  subject?: string;
}

export async function listGmailMessages(
  accessToken: string,
  query = 'label:INBOX',
  maxResults = 10
): Promise<GmailMessageHeader[]> {
  try {
    const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
    url.searchParams.set('maxResults', String(maxResults));
    if (query) url.searchParams.set('q', query);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await safeParseJson(res, 'Failed to list Gmail messages');
    const messageList = data.messages || [];

    // Fetch brief details for first 8 messages
    const detailed: GmailMessageHeader[] = [];
    for (const m of messageList.slice(0, 8)) {
      try {
        const itemRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (itemRes.ok) {
          const itemData = await safeParseJson(itemRes, 'Failed to get message details');
          const headers = itemData.payload?.headers || [];
          const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
          const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown';
          const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

          detailed.push({
            id: m.id,
            threadId: m.threadId,
            snippet: itemData.snippet || '',
            subject,
            from,
            date,
          });
        }
      } catch {
        // Skip individual unparseable message
      }
    }

    return detailed;
  } catch (err: any) {
    console.error('Error fetching Gmail messages:', err);
    throw err;
  }
}

/**
 * Base64url helper for RFC 2822
 */
function toBase64Url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function sendGmailEmail(
  accessToken: string,
  params: {
    to: string;
    subject: string;
    body: string;
  }
): Promise<{ id: string; threadId: string }> {
  const { to, subject, body } = params;

  const rawMessage = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    '',
    body,
  ].join('\r\n');

  const base64Encoded = toBase64Url(rawMessage);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64Encoded,
    }),
  });

  return await safeParseJson(res, 'Failed to send email via Gmail');
}

// ==========================================
// 5. GOOGLE CALENDAR API
// ==========================================

export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
  htmlLink?: string;
}

export async function listCalendarEvents(
  accessToken: string,
  maxResults = 10
): Promise<CalendarEventItem[]> {
  try {
    const nowIso = new Date().toISOString();
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.set('timeMin', nowIso);
    url.searchParams.set('maxResults', String(maxResults));
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await safeParseJson(res, 'Failed to list Google Calendar events');
    return data.items || [];
  } catch (err: any) {
    console.error('Error fetching calendar events:', err);
    throw err;
  }
}

export async function createCalendarEvent(
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    startDateTime: string;
    endDateTime: string;
  }
): Promise<CalendarEventItem> {
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description || '',
      location: event.location || '',
      start: {
        dateTime: event.startDateTime,
      },
      end: {
        dateTime: event.endDateTime,
      },
    }),
  });

  return await safeParseJson(res, 'Failed to create Google Calendar event');
}
