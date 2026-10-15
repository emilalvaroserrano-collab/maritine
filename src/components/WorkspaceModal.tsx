import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  FileSpreadsheet,
  FileText,
  FolderGit2,
  Calendar as CalendarIcon,
  ExternalLink,
  Send,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  LogOut,
  User as UserIcon,
  HardDrive,
  Clock,
  MapPin,
  Plus
} from 'lucide-react';
import {
  googleSignIn,
  googleSignOut,
  getAccessToken,
  initAuth
} from '../services/firebase.ts';
import {
  listDriveFiles,
  uploadTextFileToDrive,
  createGoogleSpreadsheet,
  createGoogleDoc,
  listGmailMessages,
  sendGmailEmail,
  listCalendarEvents,
  createCalendarEvent,
  DriveFileItem,
  GmailMessageHeader,
  CalendarEventItem
} from '../services/workspace.ts';
import { User } from 'firebase/auth';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentChatText?: string;
  onShowToast: (msg: string) => void;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  currentChatText = '',
  onShowToast
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<'gmail' | 'sheets' | 'docs' | 'drive' | 'calendar'>('gmail');

  // Confirmation dialog state (MANDATORY per Workspace Skill)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: async () => {}
  });
  const [isActionExecuting, setIsActionExecuting] = useState(false);

  // Gmail State
  const [gmailMessages, setGmailMessages] = useState<GmailMessageHeader[]>([]);
  const [isLoadingGmail, setIsLoadingGmail] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailTemplate, setEmailTemplate] = useState('custom');

  // Drive State
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveSearch, setDriveSearch] = useState('');

  // Calendar State
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [eventTitle, setEventTitle] = useState('Vessel ETA & Pilot Boarding');
  const [eventDate, setEventDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 16);
  });
  const [eventDurationHours, setEventDurationHours] = useState('2');
  const [eventLocation, setEventLocation] = useState('Singapore Pilot Boarding Ground (PBG)');
  const [eventDescription, setEventDescription] = useState('Inward pilot boarding, line handling, and port health clearance under MAR-KB-001 Section 04.');

  // Sheets & Docs Creation State
  const [newSheetTitle, setNewSheetTitle] = useState('Vessel Operations Log - 2026');
  const [newDocTitle, setNewDocTitle] = useState('Maritime Safety & Voyage Briefing - 2026');
  const [createdDocLink, setCreatedDocLink] = useState<{ title: string; url: string } | null>(null);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, cachedToken) => {
        setCurrentUser(user);
        setToken(cachedToken);
      },
      () => {
        setCurrentUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // When logged in and opening tabs, fetch data
  useEffect(() => {
    if (isOpen && token) {
      if (activeTab === 'gmail') loadGmail();
      if (activeTab === 'drive') loadDrive();
      if (activeTab === 'calendar') loadCalendar();
    }
  }, [isOpen, token, activeTab]);

  const handleSignIn = async () => {
    setIsLoadingAuth(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setToken(res.accessToken);
        onShowToast(`Signed in as ${res.user.email}`);
      }
    } catch (err: any) {
      console.error(err);
      onShowToast(`Google Sign-in failed: ${err.message || 'Cancelled'}`);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setCurrentUser(null);
      setToken(null);
      setGmailMessages([]);
      setDriveFiles([]);
      setCalendarEvents([]);
      onShowToast('Signed out of Google Workspace');
    } catch (err: any) {
      console.error(err);
    }
  };

  // Gmail actions
  const loadGmail = async () => {
    if (!token) return;
    setIsLoadingGmail(true);
    try {
      const msgs = await listGmailMessages(token, 'label:INBOX', 6);
      setGmailMessages(msgs);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingGmail(false);
    }
  };

  const handleSelectEmailTemplate = (type: string) => {
    setEmailTemplate(type);
    if (type === 'voyage') {
      setEmailSubject('Notice of Arrival & Voyage Readiness Notice - 2026');
      setEmailBody(
        `Dear Port Agent / Master,\n\nPlease be advised that our vessel is completing passage planning according to SOLAS Chapter V and MAR-KB-001 Section 04.\n\nEstimated Time of Arrival (ETA): [Date & Time UTC]\nDraft Fwd / Aft: 9.8m / 10.2m\nMax Air Draft: 38.5m\nTotal Crew on Board: 20\n\nPlease confirm pilot boarding station coordinates and line handling arrangements.\n\nBest regards,\nMaster / Chief Officer\nMarinerAI Operations`
      );
    } else if (type === 'provision') {
      setEmailSubject('MLC 3.2 Stores & Fresh Provisions Order Manifest (2026 Price Index)');
      setEmailBody(
        `Dear Ship Chandler,\n\nPlease provide quotation and delivery readiness for vessel provisions for 20 crew over a 14-day voyage under MLC 2006 Standard A3.2 guidelines.\n\nRequired Stores:\n1. Jasmine Long Grain Rice - 100 kg\n2. Fresh Meats & Chicken - 150 kg\n3. Fresh Vegetables & Fruits - 200 kg\n4. UHT Fresh Milk & Dairy - 90 Liters\n5. Drinking Water & Galley Seasonings\n\nPlease supply items adhering to 2026 chandler quality and port inspection standards.\n\nBest regards,\nChief Cook / Master`
      );
    } else if (type === 'safety') {
      setEmailSubject('MAR-KB-001 Enclosed Space Entry & Safety Briefing Log');
      setEmailBody(
        `Safety Officer & Master,\n\nAtmospheric testing limits before enclosed space entry (MAR-KB-001 §17):\n• Oxygen (O2): 20.8% - 21.0% by volume\n• Flammable Vapors / LEL: < 1% LEL\n• Carbon Monoxide (CO): < 25 ppm\n• Hydrogen Sulfide (H2S): < 5 ppm (STEL 10 ppm)\n• SCBA positive-pressure sets and EEBDs inspected.\n\nSafe work permit signed by Master / Chief Engineer.`
      );
    }
  };

  const triggerSendEmail = () => {
    if (!token) {
      onShowToast('Please sign in with Google first.');
      return;
    }
    if (!emailTo.trim()) {
      onShowToast('Please specify a recipient email.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Send Email via Gmail',
      description: `Are you sure you want to send this email to "${emailTo}" with subject "${emailSubject}" from your Google account?`,
      onConfirm: async () => {
        setIsActionExecuting(true);
        try {
          await sendGmailEmail(token, {
            to: emailTo.trim(),
            subject: emailSubject || 'MarinerAI Dispatch',
            body: emailBody || '(No message content)'
          });
          onShowToast(`Email sent successfully to ${emailTo}`);
          setEmailTo('');
          setEmailSubject('');
          setEmailBody('');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          loadGmail();
        } catch (err: any) {
          console.error(err);
          onShowToast(`Failed to send email: ${err.message}`);
        } finally {
          setIsActionExecuting(false);
        }
      }
    });
  };

  // Calendar actions
  const loadCalendar = async () => {
    if (!token) return;
    setIsLoadingCalendar(true);
    try {
      const events = await listCalendarEvents(token, 8);
      setCalendarEvents(events);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const handleSelectCalendarTemplate = (type: string) => {
    if (type === 'pilot') {
      setEventTitle('Vessel ETA & Pilot Boarding');
      setEventLocation('Pilot Boarding Station (PBG)');
      setEventDescription('Pilot boarding, tug fast, and harbor navigation clearance according to passage plan.');
      setEventDurationHours('2');
    } else if (type === 'drill') {
      setEventTitle('SOLAS Chapter III Abandon Ship & Fire Drill');
      setEventLocation('Main Deck & Muster Stations');
      setEventDescription('Mandatory monthly SOLAS drill: emergency alarm, muster check, lifeboat lowering, breathing apparatus and fire hose testing.');
      setEventDurationHours('1');
    } else if (type === 'psc') {
      setEventTitle('Port State Control (PSC) Inspection');
      setEventLocation('Ship Office & Bridge');
      setEventDescription('Tokyo / Paris MoU statutory PSC inspection: certificates, MARPOL Annex I/VI, ECDIS safety checks, and crew qualification records.');
      setEventDurationHours('4');
    } else if (type === 'provision') {
      setEventTitle('MLC 3.2 Fresh Provisions & Bunkering Delivery');
      setEventLocation('Quayside Berth / Barge Alongside');
      setEventDescription('Ship chandler provisioning delivery: inspection of fresh stores, temperature logging of meat/dairy, and deck crane lifting.');
      setEventDurationHours('3');
    }
  };

  const triggerCreateCalendarEvent = () => {
    if (!token) {
      onShowToast('Please sign in with Google first.');
      return;
    }
    if (!eventTitle.trim()) {
      onShowToast('Please provide an event title.');
      return;
    }

    const startDate = new Date(eventDate);
    const durationMs = (parseFloat(eventDurationHours) || 1) * 3600 * 1000;
    const endDate = new Date(startDate.getTime() + durationMs);

    setConfirmModal({
      isOpen: true,
      title: 'Schedule Event in Google Calendar',
      description: `Do you want to add "${eventTitle}" on ${startDate.toLocaleString()} at "${eventLocation}" to your primary Google Calendar?`,
      onConfirm: async () => {
        setIsActionExecuting(true);
        try {
          const created = await createCalendarEvent(token, {
            summary: eventTitle.trim(),
            description: eventDescription.trim(),
            location: eventLocation.trim(),
            startDateTime: startDate.toISOString(),
            endDateTime: endDate.toISOString()
          });
          onShowToast(`Event scheduled: ${created.summary}`);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          loadCalendar();
        } catch (err: any) {
          console.error(err);
          onShowToast(`Failed to create calendar event: ${err.message}`);
        } finally {
          setIsActionExecuting(false);
        }
      }
    });
  };

  // Drive actions
  const loadDrive = async () => {
    if (!token) return;
    setIsLoadingDrive(true);
    try {
      const files = await listDriveFiles(token, driveSearch);
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const triggerUploadChatToDrive = () => {
    if (!token) {
      onShowToast('Please sign in with Google first.');
      return;
    }
    const fileName = `MarinerAI_Voyage_Log_${new Date().toISOString().slice(0, 10)}.txt`;

    setConfirmModal({
      isOpen: true,
      title: 'Upload Chat Log to Google Drive',
      description: `Do you want to save the current conversation (${currentChatText ? currentChatText.length : 0} characters) as "${fileName}" to your Google Drive?`,
      onConfirm: async () => {
        setIsActionExecuting(true);
        try {
          const res = await uploadTextFileToDrive(
            token,
            fileName,
            currentChatText || 'MarinerAI Operational Session Log\n\n' + new Date().toISOString()
          );
          onShowToast(`Saved to Drive: ${res.name}`);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          loadDrive();
        } catch (err: any) {
          console.error(err);
          onShowToast(`Drive upload failed: ${err.message}`);
        } finally {
          setIsActionExecuting(false);
        }
      }
    });
  };

  // Google Sheets Action
  const triggerCreateSpreadsheet = () => {
    if (!token) {
      onShowToast('Please sign in with Google first.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Create Google Sheet in Google Drive',
      description: `Do you want to create a new spreadsheet titled "${newSheetTitle}" with 2026 Maritime Operational & Provisioning columns in your Google Drive?`,
      onConfirm: async () => {
        setIsActionExecuting(true);
        try {
          const sampleRows = [
            ['Category', 'Item Description', 'Unit', 'Daily/Pax Qty', '2026 Unit Price USD', 'Port Benchmark'],
            ['Grains & Rice', 'Jasmine / Long Grain Rice', 'kg', 0.35, 1.95, 'Singapore 2026'],
            ['Meat & Poultry', 'Chicken Breast & Thighs', 'kg', 0.30, 6.20, 'Rotterdam 2026'],
            ['Meat & Poultry', 'Beef Cuts & Ground Beef', 'kg', 0.20, 12.80, 'Houston 2026'],
            ['Fish & Seafood', 'Fish Fillet (Mackerel / Cod)', 'kg', 0.20, 7.60, 'Busan 2026'],
            ['Dairy & Eggs', 'Fresh Eggs', 'pcs', 2.0, 0.35, 'Global 2026'],
            ['Dairy & Eggs', 'UHT Fresh Milk', 'liters', 0.30, 2.40, 'Global 2026'],
            ['Produce', 'Fresh Fruits & Greens', 'kg', 0.60, 3.20, 'Global 2026']
          ];

          const res = await createGoogleSpreadsheet(token, newSheetTitle, sampleRows);
          onShowToast(`Google Sheet created: ${res.title}`);
          setCreatedDocLink({ title: res.title, url: res.spreadsheetUrl });
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          console.error(err);
          onShowToast(`Failed to create spreadsheet: ${err.message}`);
        } finally {
          setIsActionExecuting(false);
        }
      }
    });
  };

  // Google Docs Action
  const triggerCreateDoc = () => {
    if (!token) {
      onShowToast('Please sign in with Google first.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Create Google Document in Google Drive',
      description: `Do you want to create a new Google Doc titled "${newDocTitle}" with maritime operational guidance in your Google Drive?`,
      onConfirm: async () => {
        setIsActionExecuting(true);
        try {
          const docContent = `# ${newDocTitle}\nDate: ${new Date().toLocaleDateString()} (2026 Operations)\nReference: MAR-KB-001 Maritime Knowledge Base\n\n## 1. Passage & Watchkeeping Directives\n• Bridge team management and ECDIS safety contour check.\n• Under-Keel Clearance (UKC) confirmed with squat calculations.\n• MLC 2006 Regulation 3.2 victualing standard applied ($14.50/man-day allowance in 2026).\n\n## 2. Statutory Safety Controls\n• Enclosed space entry permit active.\n• Atmosphere verified: O2 >= 20.8%, LEL < 1%, H2S < 5 ppm, CO < 25 ppm.\n\nGenerated via MarinerAI Assistant.`;

          const res = await createGoogleDoc(token, newDocTitle, docContent);
          onShowToast(`Google Doc created: ${res.title}`);
          setCreatedDocLink({ title: res.title, url: res.documentUrl });
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          console.error(err);
          onShowToast(`Failed to create doc: ${err.message}`);
        } finally {
          setIsActionExecuting(false);
        }
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-[var(--border-subtle)] shadow-2xl overflow-hidden text-[var(--text-main)]"
        style={{ backgroundColor: 'var(--bg-main)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 grid place-items-center shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-[var(--text-main)]">Google Workspace Hub</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
                Google APIs
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auth Status Banner */}
        <div className="px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/30 flex flex-wrap items-center justify-between gap-2 text-xs">
          {currentUser ? (
            <div className="flex items-center gap-2">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-5 h-5 rounded-full border border-blue-400" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-blue-600 grid place-items-center text-white font-bold text-[10px]">
                  {currentUser.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-medium text-[var(--text-main)]">{currentUser.displayName || 'Mariner'}</span>
              <span className="text-[var(--text-muted)]">({currentUser.email})</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 ml-1">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Connect Google Account for Calendar, Gmail, Sheets, Docs, and Drive.</span>
            </div>
          )}

          <div>
            {currentUser ? (
              <button
                onClick={handleSignOut}
                className="px-2.5 py-1 rounded text-xs border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span>Disconnect</span>
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isLoadingAuth}
                className="gsi-material-button text-xs py-1 px-2.5 rounded bg-white text-gray-900 font-medium shadow-xs hover:bg-gray-100 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isLoadingAuth ? 'Connecting...' : 'Sign in'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Segmented Tab Navigation */}
        <div className="px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)] overflow-x-auto scrollbar-none">
          <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs">
            {[
              { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
              { id: 'gmail', label: 'Gmail', icon: Mail },
              { id: 'sheets', label: 'Sheets', icon: FileSpreadsheet },
              { id: 'docs', label: 'Docs', icon: FileText },
              { id: 'drive', label: 'Drive Files', icon: FolderGit2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1 rounded text-xs transition-colors flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-[var(--text-main)] text-[var(--bg-main)] font-semibold shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Created Doc / Sheet Notification Banner */}
        {createdDocLink && (
          <div className="px-5 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Created "{createdDocLink.title}". Click to open in Google:</span>
            </div>
            <a
              href={createdDocLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold flex items-center gap-1 hover:bg-emerald-500 transition-colors"
            >
              <span>Open File</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* TAB 0: GOOGLE CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Schedule Maritime Event */}
              <div className="space-y-3 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-blue-400" />
                    <span>Schedule Maritime Event</span>
                  </h3>
                  <span className="text-[10px] text-[var(--text-muted)]">Google Calendar</span>
                </div>

                {/* Templates Selector */}
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block mb-1">Maritime Presets:</label>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      onClick={() => handleSelectCalendarTemplate('pilot')}
                      className="p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-[11px] font-medium text-left truncate"
                    >
                      ⚓ Pilot Boarding ETA
                    </button>
                    <button
                      onClick={() => handleSelectCalendarTemplate('drill')}
                      className="p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-[11px] font-medium text-left truncate"
                    >
                      🚨 SOLAS Safety Drill
                    </button>
                    <button
                      onClick={() => handleSelectCalendarTemplate('psc')}
                      className="p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-[11px] font-medium text-left truncate"
                    >
                      🛡️ PSC Inspection
                    </button>
                    <button
                      onClick={() => handleSelectCalendarTemplate('provision')}
                      className="p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-[11px] font-medium text-left truncate"
                    >
                      🍎 MLC 3.2 Stores Delivery
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block mb-1">Event Title:</label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Vessel Event Title"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-[var(--text-muted)] block mb-1">Date & Start Time:</label>
                    <input
                      type="datetime-local"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--text-muted)] block mb-1">Duration (Hours):</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="24"
                      value={eventDurationHours}
                      onChange={(e) => setEventDurationHours(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block mb-1">Location / Berth:</label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Pilot Station / Berth coordinates"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block mb-1">Description & Notes:</label>
                  <textarea
                    rows={3}
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="Brief description or checklist reference..."
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent)] resize-none"
                  />
                </div>

                <button
                  onClick={triggerCreateCalendarEvent}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Add to Google Calendar (with Confirmation)</span>
                </button>
              </div>

              {/* Upcoming Events List */}
              <div className="space-y-3 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-emerald-400" />
                    <span>Upcoming Calendar Events</span>
                  </h3>
                  <button
                    onClick={loadCalendar}
                    disabled={isLoadingCalendar}
                    className="p-1 rounded-lg hover:bg-[var(--bg-main)] text-[var(--text-muted)]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCalendar ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {!currentUser ? (
                  <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                    Please sign in with Google to view your calendar schedule.
                  </div>
                ) : isLoadingCalendar ? (
                  <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                    Loading calendar events...
                  </div>
                ) : calendarEvents.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                    No upcoming calendar events found.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {calendarEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-blue-400 truncate max-w-[200px]">
                            {ev.summary}
                          </span>
                          <span className="text-[10px] text-[var(--text-subtle)] font-mono">
                            {ev.start?.dateTime
                              ? new Date(ev.start.dateTime).toLocaleDateString() + ' ' + new Date(ev.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : ev.start?.date || ''}
                          </span>
                        </div>
                        {ev.location && (
                          <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                            <span className="truncate">{ev.location}</span>
                          </div>
                        )}
                        {ev.description && (
                          <p className="text-[11px] text-[var(--text-subtle)] line-clamp-2">
                            {ev.description}
                          </p>
                        )}
                        {ev.htmlLink && (
                          <a
                            href={ev.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:underline pt-1"
                          >
                            <span>View in Google Calendar</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: GMAIL */}
          {activeTab === 'gmail' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Compose Email */}
              <div className="space-y-3 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-red-400" />
                    <span>Compose Maritime Email</span>
                  </h3>
                  <span className="text-[10px] text-[var(--text-muted)]">OAuth Client</span>
                </div>

                {/* Templates Selector */}
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block mb-1">Preset Templates:</label>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    <button
                      onClick={() => handleSelectEmailTemplate('voyage')}
                      className={`p-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                        emailTemplate === 'voyage'
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      Voyage Notice
                    </button>
                    <button
                      onClick={() => handleSelectEmailTemplate('provision')}
                      className={`p-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                        emailTemplate === 'provision'
                          ? 'bg-orange-600 text-white border-orange-500'
                          : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      MLC 3.2 Stores Order
                    </button>
                    <button
                      onClick={() => handleSelectEmailTemplate('safety')}
                      className={`p-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                        emailTemplate === 'safety'
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      Safety Brief
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block mb-1">To (Recipient Email):</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="agent@shippingagency.com"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block mb-1">Subject:</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Voyage Notice / Provision Order"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block mb-1">Message Body:</label>
                  <textarea
                    rows={6}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Type email body or select a preset template above..."
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent)] resize-none"
                  />
                </div>

                <button
                  onClick={triggerSendEmail}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Email with Confirmation</span>
                </button>
              </div>

              {/* Recent Inbox Messages */}
              <div className="space-y-3 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <span>Recent Gmail Inbox</span>
                  </h3>
                  <button
                    onClick={loadGmail}
                    disabled={isLoadingGmail}
                    className="p-1 rounded-lg hover:bg-[var(--bg-main)] text-[var(--text-muted)]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGmail ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {!currentUser ? (
                  <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                    Please sign in with Google to read your messages.
                  </div>
                ) : isLoadingGmail ? (
                  <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                    Fetching recent emails...
                  </div>
                ) : gmailMessages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                    No recent inbox messages found.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {gmailMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[var(--text-main)] truncate max-w-[180px]">
                            {msg.from}
                          </span>
                          <span className="text-[10px] text-[var(--text-subtle)] font-mono">
                            {msg.date ? new Date(msg.date).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <div className="font-medium text-blue-400 truncate">{msg.subject}</div>
                        <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">{msg.snippet}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE SHEETS */}
          {activeTab === 'sheets' && (
            <div className="space-y-4 max-w-2xl mx-auto p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <FileSpreadsheet className="w-5 h-5" />
                <span>Export & Manage Google Sheets</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Create a live Google Spreadsheet in your Google Drive with the 2026 Maritime Ship Chandler Pricelist and MLC 3.2 Food & Catering allocation.
              </p>

              <div className="space-y-2">
                <label className="text-[11px] text-[var(--text-muted)] block">Spreadsheet Title:</label>
                <input
                  type="text"
                  value={newSheetTitle}
                  onChange={(e) => setNewSheetTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent)]"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                <strong>Sheet Contents (Pre-formatted 2026 Data):</strong>
                <ul className="list-disc list-inside text-[11px] text-emerald-200/80 space-y-0.5">
                  <li>2026 Ship Chandler Price Index (Grains, Meats, Seafood, Dairy, Produce)</li>
                  <li>Crew Victualing Budget Calculation ($14.50/man-day rate)</li>
                  <li>Multi-nationality Daily Menu Breakdown</li>
                  <li>Port Price Multipliers (Singapore, Rotterdam, Houston, Fujairah, Busan)</li>
                </ul>
              </div>

              <button
                onClick={triggerCreateSpreadsheet}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Create Spreadsheet in Google Drive (with Confirmation)</span>
              </button>
            </div>
          )}

          {/* TAB 3: GOOGLE DOCS */}
          {activeTab === 'docs' && (
            <div className="space-y-4 max-w-2xl mx-auto p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <FileText className="w-5 h-5" />
                <span>Export to Google Docs</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Generate an official maritime document in Google Docs with navigation passage checklists and safety briefing standards.
              </p>

              <div className="space-y-2">
                <label className="text-[11px] text-[var(--text-muted)] block">Document Title:</label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent)]"
                />
              </div>

              <button
                onClick={triggerCreateDoc}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>Create Google Document (with Confirmation)</span>
              </button>
            </div>
          )}

          {/* TAB 4: GOOGLE DRIVE */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--text-subtle)]" />
                    <input
                      type="text"
                      value={driveSearch}
                      onChange={(e) => setDriveSearch(e.target.value)}
                      placeholder="Search Drive files..."
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] focus:outline-hidden"
                    />
                  </div>
                  <button
                    onClick={loadDrive}
                    className="px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  >
                    Search
                  </button>
                </div>

                <button
                  onClick={triggerUploadChatToDrive}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Backup Current Chat to Drive</span>
                </button>
              </div>

              {!currentUser ? (
                <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                  Please sign in with Google to view files in your Google Drive.
                </div>
              ) : isLoadingDrive ? (
                <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                  Loading files from Google Drive...
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                  No files found in Google Drive.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {driveFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-focus)] transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-xs text-[var(--text-main)] line-clamp-1">
                            {file.name}
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--text-subtle)] font-mono">
                          {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : ''}
                        </div>
                      </div>

                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <span>Open in Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* User Confirmation Dialog (MANDATORY per Workspace Skill) */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-md p-5 rounded-3xl bg-[var(--bg-sidebar)] border border-[var(--border-subtle)] shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-amber-400">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-[var(--text-main)]">
                  {confirmModal.title}
                </h3>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {confirmModal.description}
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  disabled={isActionExecuting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  disabled={isActionExecuting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:opacity-90 text-white shadow-md transition-all flex items-center gap-1.5"
                >
                  {isActionExecuting && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Confirm Action</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
