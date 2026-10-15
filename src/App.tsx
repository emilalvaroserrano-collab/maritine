/**
 * MarinerAI - Maritime & Seafarer Operations Assistant
 * Minimalist, Clean & Mobile-First Chatbot Interface (ChatGPT / DeepSeek Style)
 * Strictly Grounded on MAR-KB-001 (Version 1.0, 14 October 2026)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Anchor,
  Compass,
  BookOpen,
  Calculator,
  Plus,
  Send,
  Mic,
  X,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Menu,
  ChevronDown,
  Sun,
  Moon,
  RotateCcw,
  Shield,
  FileText,
  Ship,
  Sparkles,
  ArrowUp,
  Square,
  Paperclip,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  ChevronRight,
  Utensils,
  FileSpreadsheet,
  Printer,
  Loader2,
  Calendar,
  Mail,
  HardDrive
} from 'lucide-react';
import {
  MARITIME_ROLES,
  QUICK_PROMPTS,
  MARITIME_SECTIONS,
  MARITIME_GLOSSARY,
  KNOWLEDGE_BASE_META,
  KnowledgeSection
} from './data/maritimeKnowledge.ts';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal.tsx';
import { TTS_VOICE } from './config/aiModels.ts';
import { MaritimeToolsModal } from './components/MaritimeToolsModal.tsx';
import { FoodPlannerModal } from './components/FoodPlannerModal.tsx';
import { WorkspaceModal } from './components/WorkspaceModal.tsx';
import { testFirestoreConnection } from './services/firebase.ts';

interface Attachment {
  id: number;
  file?: File;
  name: string;
  type: string;
  size: number;
  url: string;
  base64?: string;
}

interface AudioMessage {
  url: string;
  duration: number;
  base64?: string;
}

interface Message {
  id: string;
  role: 'bot' | 'user';
  text: string;
  attachments?: Attachment[];
  audio?: AudioMessage;
  time: string;
}

/** Coerce any error value into a readable string — never "[object Object]". */
function errorToDisplayText(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err instanceof Error && err.message) return err.message;
  const anyErr = err as any;
  if (typeof anyErr?.message === 'string' && anyErr.message) return anyErr.message;
  if (typeof anyErr?.error === 'string' && anyErr.error) return anyErr.error;
  try {
    const s = JSON.stringify(anyErr?.error ?? err);
    if (s && s !== '{}' && s !== '""') return s.slice(0, 300);
  } catch {
    /* fall through */
  }
  return 'Unknown error';
}

/**
 * Offline MAR-KB-001 fallback rendered when the chat API is unreachable,
 * so the user still gets a grounded reference instead of a dead-end notice.
 */
function buildOfflineFallback(message: string): string {
  const query = (message || '').toLowerCase();
  if (!query.trim()) return '';
  const scored = MARITIME_SECTIONS.map((sec) => {
    let score = 0;
    if (query.includes(sec.title.toLowerCase())) score += 10;
    if (query.includes(`§${sec.number}`) || query.includes(`section ${sec.number}`)) score += 15;
    for (const tag of sec.tags) {
      if (query.includes(tag.toLowerCase())) score += 5;
    }
    const words = query.split(/\s+/).filter((w) => w.length > 3);
    for (const w of words) {
      if (sec.summary.toLowerCase().includes(w)) score += 2;
      if (sec.content?.toLowerCase().includes(w)) score += 1;
      if (sec.items?.some((it) => it.toLowerCase().includes(w))) score += 2;
    }
    return { sec, score };
  }).sort((a, b) => b.score - a.score);
  const top = scored[0]?.score > 0 ? scored[0].sec : MARITIME_SECTIONS[0];
  const matched = MARITIME_GLOSSARY.filter((g) =>
    new RegExp(`\\b${g.abbreviation.toLowerCase()}\\b`, 'i').test(query),
  );
  let out = `**Direct Operational Answer [MAR-KB-001 §${top.number} ${top.title}]:**\n${top.summary}\n`;
  if (top.items && top.items.length > 0) {
    out += `\n**Core Standards & Requirements [STATUTORY / REQUIRED]:**\n`;
    top.items.slice(0, 5).forEach((it) => {
      out += `• ${it}\n`;
    });
  } else if (top.content) {
    out += `\n${top.content}\n`;
  }
  if (matched.length > 0) {
    out += `\n**Relevant Terminology [MAR-KB-001 §25]:**\n`;
    matched.slice(0, 3).forEach((g) => {
      out += `• **${g.abbreviation}:** ${g.meaning}\n`;
    });
  }
  out += `\n*Source:* [MAR-KB-001 §${top.number} ${top.title}]. Verify against the vessel's approved SMS and responsible officer.`;
  return out;
}

const SEGMENTED_PROMPTS: Record<string, { label: string; query: string; icon: string }[]> = {
  all: [
    { label: 'Enclosed Space Entry', query: 'What are the statutory atmosphere testing limits before enclosed space entry under MAR-KB-001?', icon: '🛡️' },
    { label: 'UKC & Squat Check', query: 'How do you calculate Under-Keel Clearance (UKC) and vessel squat in confined channels?', icon: '🧭' },
    { label: 'OWS 15 ppm Discharge', query: 'What are the MARPOL Annex I requirements and log procedures for 15 ppm bilge discharge?', icon: '⚙️' },
    { label: 'MLC 3.2 Meal Plan', query: 'Plan a 7-day multinational daily food and catering menu for 22 crew members under MLC 2006.', icon: '🍽️' },
  ],
  nav: [
    { label: 'Passage Plan Verification', query: 'What are the 4 stages of passage planning under SOLAS Chapter V and Section 04?', icon: '🧭' },
    { label: 'Rule 19 Restricted Visibility', query: 'Explain COLREGs Rule 19 actions in fog and radar plotting requirements.', icon: '🌫️' },
    { label: 'ECDIS Cross-Check', query: 'What are the statutory cross-checks required when navigating by ECDIS?', icon: '📡' },
    { label: 'UKC in Port Approvals', query: 'Calculate dynamic draft and safety margin for 12.2m static draft at 10 knots.', icon: '⚓' },
  ],
  engine: [
    { label: 'Blackout Recovery', query: 'What is the immediate action checklist for main engine blackout and emergency generator restoration?', icon: '⚡' },
    { label: 'OWS & Oil Record Book', query: 'Explain MARPOL Annex I Code (D) and (E) ORB entry rules for bilge water.', icon: '🛢️' },
    { label: 'Fuel Switching in ECA', query: 'What are the 0.10% sulfur MARPOL Annex VI fuel changeover procedures and logs?', icon: '🔥' },
    { label: 'Steering Gear Emergency Test', query: 'What are the SOLAS Chapter V Rule 26 steering gear pre-departure test requirements?', icon: '⚙️' },
  ],
  safety: [
    { label: 'Enclosed Space Limits', query: 'Detail exact O2, LEL, CO, and H2S limits and standby watchkeeper duties before tank entry.', icon: '🦺' },
    { label: 'Mooring Snap-Back Safety', query: 'What are the safe working practices and hazard markings for mooring line snap-back zones?', icon: '🪢' },
    { label: 'Cargo Liquefaction (IMSBC)', query: 'What are the Transportable Moisture Limit (TML) and can-test rules for Group A solid bulk cargoes?', icon: '📦' },
    { label: 'Lifeboat Lowering Drill', query: 'Explain SOLAS Chapter III 3-month lifeboat waterborne release and drill regulations.', icon: '🚤' },
  ],
  food: [
    { label: '7-Day MLC 3.2 Rotation', query: 'Generate a balanced 7-day menu for 22 mixed multinational crew with midnight watchkeeper snacks.', icon: '🍲' },
    { label: 'Cold Room Temp Logs', query: 'What are the mandatory cold-room temperatures for meat, fish, dairy, and veg under MLC 3.2?', icon: '❄️' },
    { label: '2026 Victualing Rates', query: 'What is the recommended 2026 ship-chandler daily rate allowance per man-day in Singapore and Rotterdam?', icon: '💵' },
    { label: 'Potable Water Quota', query: 'What is the minimum fresh drinking water allowance per seafarer per day under WHO/MLC standards?', icon: '💧' },
  ],
  marina: [
    { label: 'MISMO CoC Revalidation', query: 'What are the current MARINA STCW circulars and documentary requirements for renewing a CoC via MISMO?', icon: '🇵🇭' },
    { label: 'Sea Service Testimonial', query: 'What details must be verified on a Master’s sea service testimonial for MARINA approval?', icon: '📜' },
    { label: 'PEME Medical Clearance', query: 'What are the DOH-accredited PEME medical examination requirements for Filipino seafarers?', icon: '🩺' },
    { label: 'CoP Basic Training (BT)', query: 'What are the revalidation and refresher training rules for Certificate of Proficiency (CoP) under MARINA?', icon: '🎓' },
  ],
};

export default function App() {
  // Clean frontend: start clean without preset wall of text
  const [messages, setMessages] = useState<Message[]>([]);

  const [inputText, setInputText] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isKBModalOpen, setIsKBModalOpen] = useState(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [promptCategory, setPromptCategory] = useState<'all' | 'nav' | 'engine' | 'safety' | 'food' | 'marina'>('all');
  const [workspacePreloadText, setWorkspacePreloadText] = useState('');
  const [isLightTheme, setIsLightTheme] = useState(false);

  // Attachments
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [recDuration, setRecDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<any>(null);
  const recordingStartRef = useRef<number>(0);

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);

  // Clipboard & Speech Synthesis
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [loadingTtsId, setLoadingTtsId] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  // DOM Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (smooth = true) => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Auto-grow textarea
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [inputText]);

  // Test Firestore connection on boot (Firebase Integration Skill mandatory check)
  useEffect(() => {
    testFirestoreConnection().catch((err) => console.warn('Firestore boot test:', err));
  }, []);

  const showToast = (msg: string, ms = 2800) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), ms);
  };

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  };

  const formatSize = (bytes: number) => {
    if (!bytes && bytes !== 0) return '';
    const u = ['B', 'KB', 'MB', 'GB'];
    let i = 0, n = bytes;
    while (n >= 1024 && i < u.length - 1) {
      n /= 1024;
      i++;
    }
    return (n >= 10 || i === 0 ? Math.round(n) : n.toFixed(1)) + ' ' + u[i];
  };

  const getFileEmoji = (type: string, name: string) => {
    const n = (name || '').toLowerCase();
    if ((type || '').startsWith('video/')) return '🎬';
    if ((type || '').startsWith('audio/')) return '🎵';
    if (n.endsWith('.pdf')) return '📕';
    if (/\.(doc|docx)$/.test(n)) return '📘';
    if (/\.(xls|xlsx|csv)$/.test(n)) return '📗';
    if (/\.(ppt|pptx)$/.test(n)) return '📙';
    if (/\.(zip|rar|7z)$/.test(n)) return '🗜️';
    if (/\.(txt|md|json)$/.test(n)) return '📝';
    return '📄';
  };

  const handleAddFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    let rejected = 0;
    const newItems: Attachment[] = [];

    for (const f of files) {
      if (f.size > 25 * 1024 * 1024) {
        rejected++;
        continue;
      }
      try {
        const base64 = await fileToBase64(f);
        const url = URL.createObjectURL(f);
        newItems.push({
          id: Date.now() + Math.random(),
          file: f,
          name: f.name,
          type: f.type || 'application/octet-stream',
          size: f.size,
          url,
          base64,
        });
      } catch (e) {
        console.error(e);
      }
    }

    if (rejected > 0) showToast(`${rejected} file(s) skipped (max 25MB).`);
    if (newItems.length > 0) {
      setPendingAttachments((prev) => [...prev, ...newItems]);
    }
  };

  const removeAttachment = (id: number) => {
    setPendingAttachments((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  // --- AUDIO VOICE RECORDING ---
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Microphone not supported on this device.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      const mimeCandidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
      let mime = '';
      for (const c of mimeCandidates) {
        if (MediaRecorder.isTypeSupported(c)) {
          mime = c;
          break;
        }
      }

      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(recordingTimerRef.current);
        const duration = Math.max((Date.now() - recordingStartRef.current) / 1000, 0.5);

        if (chunks.length === 0) {
          showToast('No audio was recorded.');
          setIsRecording(false);
          return;
        }

        const blob = new Blob(chunks, { type: mime || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setIsRecording(false);
          sendMessage('', [], {
            url,
            duration,
            base64: base64Audio,
          });
        };
      };

      recordingStartRef.current = Date.now();
      setRecDuration(0);
      setMediaRecorder(recorder);
      recorder.start(200);
      setIsRecording(true);

      recordingTimerRef.current = setInterval(() => {
        setRecDuration(Math.floor((Date.now() - recordingStartRef.current) / 1000));
      }, 500);

    } catch (err) {
      console.error(err);
      showToast('Microphone access denied.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.ondataavailable = null;
      mediaRecorder.onstop = null;
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((t) => t.stop());
    }
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecDuration(0);
    showToast('Recording cancelled.');
  };

  // --- SEND MESSAGE FLOW ---
  const sendMessage = async (
    textToSend: string,
    attachmentsToSend = pendingAttachments,
    audioToSend?: AudioMessage
  ) => {
    const trimmed = textToSend.trim();
    if (!trimmed && attachmentsToSend.length === 0 && !audioToSend) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: trimmed,
      attachments: attachmentsToSend.length > 0 ? [...attachmentsToSend] : undefined,
      audio: audioToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setPendingAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsGenerating(true);

    try {
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome-msg')
        .slice(-6)
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          message: trimmed,
          role: selectedRole,
          history: historyPayload,
          attachments: attachmentsToSend.map((a) => ({
            name: a.name,
            type: a.type,
            size: a.size,
            base64: a.base64,
          })),
          audio: audioToSend
            ? {
                base64: audioToSend.base64,
                mimeType: 'audio/webm',
                duration: audioToSend.duration,
              }
            : undefined,
        }),
      });

      // Read the response body exactly once — a fetch body cannot be re-read,
      // so parse the text as JSON instead of calling res.json() then res.text().
      let data: any = null;
      const rawBody: string = await res.text().catch(() => '');
      if (rawBody) {
        try {
          data = JSON.parse(rawBody);
        } catch {
          data = null;
        }
      }

      if (!data) {
        if (!res.ok) {
          const looksLikeHtml =
            rawBody.includes('<!doctype') || rawBody.includes('<html');
          throw new Error(
            looksLikeHtml
              ? `AI service endpoint not found (HTTP ${res.status}). The chat API may not be deployed — check /api/chat and GEMINI_API_KEY.`
              : `AI service returned a non-JSON response (HTTP ${res.status}).`,
          );
        }
        throw new Error('Server returned an unexpected non-JSON response.');
      }

      if (!res.ok && !data?.text) {
        const serverErr =
          typeof data?.error === 'string'
            ? data.error
            : data?.error
              ? errorToDisplayText(data.error)
              : '';
        throw new Error(serverErr || `Server responded with status ${res.status}`);
      }

      const botReply: Message = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        text: data.text || 'Operational response received.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err: any) {
      console.error(err);
      const reason = errorToDisplayText(err);
      const fallback = buildOfflineFallback(trimmed);
      const errorMsg: Message = {
        id: `bot-err-${Date.now()}`,
        role: 'bot',
        text: fallback
          ? `⚓ **MarinerAI (MAR-KB-001 offline reference):**\n\n${fallback}\n\n_Note: live AI service unreachable (${reason}). Verify connection / GEMINI_API_KEY and always confirm against the vessel's approved SMS._`
          : `⚠️ **Connection Notice:** Unable to reach maritime AI service (${reason}). Please verify connection or retry.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleNewChat = () => {
    window.speechSynthesis?.cancel();
    setSpeakingMsgId(null);
    setMessages([]);
    setIsSidebarOpen(false);
    showToast('New session started.');
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Gemini TTS Audio Generation (model + voice from src/config/aiModels.ts)
  const toggleSpeech = async (id: string, text: string) => {
    // If currently speaking this message, toggle pause/stop
    if (speakingMsgId === id) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      window.speechSynthesis?.cancel();
      setSpeakingMsgId(null);
      return;
    }

    // Stop any existing playback
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setSpeakingMsgId(null);
    setLoadingTtsId(id);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceName: TTS_VOICE,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error(`TTS server error (${response.status})`);
      }

      const data = await response.json();
      if (!data.audioUrl) {
        throw new Error('No audio URL received');
      }

      const audio = new Audio(data.audioUrl);
      currentAudioRef.current = audio;
      setLoadingTtsId(null);
      setSpeakingMsgId(id);

      audio.onended = () => {
        setSpeakingMsgId(null);
        currentAudioRef.current = null;
      };

      audio.onerror = () => {
        setSpeakingMsgId(null);
        currentAudioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      console.warn('Gemini 3.8 Flash Lite TTS error, fallback to browser speech synthesis:', err);
      setLoadingTtsId(null);

      // Graceful fallback to browser speech synthesis
      if ('speechSynthesis' in window) {
        const cleanText = text
          .replace(/\[STATUTORY \/ REQUIRED\]/g, 'Statutory required:')
          .replace(/\[VESSEL-SPECIFIC\]/g, 'Vessel specific:')
          .replace(/\[CONDITIONAL\]/g, 'Conditional:')
          .replace(/\[RECOMMENDED\]/g, 'Recommended:')
          .replace(/\[VERIFY\]/g, 'Verify:')
          .replace(/\[MAR-KB-001\s*§\d+[^\]]*\]/g, '')
          .replace(/[*_#`]/g, '');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        utterance.onend = () => setSpeakingMsgId(null);
        utterance.onerror = () => setSpeakingMsgId(null);
        setSpeakingMsgId(id);
        window.speechSynthesis.speak(utterance);
      } else {
        showToast('TTS audio playback failed.');
      }
    }
  };

  const activeRoleObj = MARITIME_ROLES.find((r) => r.id === selectedRole) || MARITIME_ROLES[0];

  // Markdown rendering with sleek modern styling
  const renderMarkdown = (rawText: string) => {
    if (!rawText) return null;
    const paragraphs = rawText.split('\n\n');

    return (
      <div className="markdown-body space-y-2">
        {paragraphs.map((p, pIdx) => {
          const lines = p.split('\n');
          return (
            <div key={pIdx}>
              {lines.map((line, lIdx) => {
                const parts = line.split(
                  /(\*\*.*?\*\*|\[STATUTORY \/ REQUIRED\]|\[VESSEL-SPECIFIC\]|\[CONDITIONAL\]|\[RECOMMENDED\]|\[VERIFY\]|\[MAR-KB-001\s*§\d+[^\]]*\])/g
                );

                const isListItem = line.startsWith('•') || line.startsWith('-') || /^\d+\./.test(line);

                return (
                  <div key={lIdx} className={isListItem ? 'ml-3 my-1' : 'my-0.5'}>
                    {parts.map((part, partIdx) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                          <strong key={partIdx} className="font-semibold text-[var(--text-main)]">
                            {part.slice(2, -2)}
                          </strong>
                        );
                      }
                      if (part === '[STATUTORY / REQUIRED]') {
                        return (
                          <span key={partIdx} className="maritime-tag tag-statutory">
                            STATUTORY
                          </span>
                        );
                      }
                      if (part === '[VESSEL-SPECIFIC]') {
                        return (
                          <span key={partIdx} className="maritime-tag tag-vessel">
                            VESSEL-SPECIFIC
                          </span>
                        );
                      }
                      if (part === '[CONDITIONAL]') {
                        return (
                          <span key={partIdx} className="maritime-tag tag-conditional">
                            CONDITIONAL
                          </span>
                        );
                      }
                      if (part === '[RECOMMENDED]') {
                        return (
                          <span key={partIdx} className="maritime-tag tag-recommended">
                            RECOMMENDED
                          </span>
                        );
                      }
                      if (part === '[VERIFY]') {
                        return (
                          <span key={partIdx} className="maritime-tag tag-verify">
                            VERIFY
                          </span>
                        );
                      }
                      if (part.startsWith('[MAR-KB-001') && part.endsWith(']')) {
                        return (
                          <span key={partIdx} className="citation-chip">
                            {part.slice(1, -1)}
                          </span>
                        );
                      }
                      return <span key={partIdx}>{part}</span>;
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`h-[100dvh] w-full flex overflow-hidden ${
        isLightTheme ? 'light-theme' : ''
      }`}
      style={{ backgroundColor: 'var(--bg-main)' }}
      onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files?.length) handleAddFiles(e.dataTransfer.files);
      }}
    >
      {/* ============ SIDEBAR DRAWER (ChatGPT/DeepSeek Slide-out) ============ */}
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 sm:w-80 flex flex-col transition-transform duration-300 ease-in-out border-r border-[var(--border-subtle)] ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-72'
        }`}
        style={{ backgroundColor: 'var(--bg-sidebar)' }}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 flex items-center justify-between border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 grid place-items-center text-white shadow-sm">
              <Anchor className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-[var(--text-main)]">
                MarinerAI
              </div>
              <div className="text-[10px] text-[var(--text-muted)] font-mono">
                MAR-KB-001 · v1.0
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleNewChat}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              title="Close Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New Chat Primary Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-3.5 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-focus)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-xs font-medium text-[var(--text-main)] flex items-center justify-between transition-all group shadow-2xs"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-main)]" />
              New Conversation
            </span>
            <span className="text-[10px] text-[var(--text-subtle)]">⌘K</span>
          </button>
        </div>

        {/* Scrollable Navigation / Topics / Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          
          {/* Quick Tools & Calculators */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
              Operational Tools (§16, §23)
            </div>
            <div className="space-y-1">
              <button
                onClick={() => { setIsToolsModalOpen(true); setIsSidebarOpen(false); }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-[var(--bg-surface)] text-[var(--text-main)] flex items-center gap-2.5 transition-colors group"
              >
                <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">UKC & Squat Calculator</span>
              </button>

              <button
                onClick={() => { setIsToolsModalOpen(true); setIsSidebarOpen(false); }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-[var(--bg-surface)] text-[var(--text-main)] flex items-center gap-2.5 transition-colors group"
              >
                <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="truncate">Departure Readiness Checklist</span>
              </button>

              <button
                onClick={() => { setIsFoodModalOpen(true); setIsSidebarOpen(false); }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-[var(--bg-surface)] text-[var(--text-main)] flex items-center gap-2.5 transition-colors group"
              >
                <Utensils className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="truncate">Food Planner (MLC 3.2 · 2026)</span>
              </button>

              <button
                onClick={() => { setIsWorkspaceModalOpen(true); setIsSidebarOpen(false); }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-[var(--bg-surface)] text-[var(--text-main)] flex items-center gap-2.5 transition-colors group"
              >
                <HardDrive className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="truncate font-medium text-blue-300">Google Workspace Hub</span>
              </button>

              <button
                onClick={() => { setIsToolsModalOpen(true); setIsSidebarOpen(false); }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-[var(--bg-surface)] text-[var(--text-main)] flex items-center gap-2.5 transition-colors group"
              >
                <HelpCircle className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="truncate">50+ Acronym Glossary (§25)</span>
              </button>
            </div>
          </div>

          {/* Rank / Persona Selector */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
              Crew Perspective Filter
            </div>
            <div className="space-y-0.5">
              {MARITIME_ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedRole(r.id);
                    showToast(`Role: ${r.label}`);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    selectedRole === r.id
                      ? 'bg-[var(--bg-surface)] text-[var(--accent)] font-medium'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <span className="truncate">{r.label}</span>
                  {selectedRole === r.id && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-[11px] truncate">MAR-KB-001 Grounded</span>
          </div>
          <button
            onClick={() => setIsLightTheme(!isLightTheme)}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            title={isLightTheme ? 'Switch to Dark' : 'Switch to Light'}
          >
            {isLightTheme ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* ============ MAIN CHAT CONTAINER ============ */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        
        {/* Minimalist Top Bar (ChatGPT / DeepSeek style) */}
        <header
          className="h-14 flex items-center justify-between px-3 sm:px-5 border-b border-[var(--border-subtle)] shrink-0 z-20 backdrop-blur-md"
          style={{ backgroundColor: 'var(--bg-main)' }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors lg:hidden"
              title="Open Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Model / Role Pill Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                className="px-3 py-1.5 rounded-xl hover:bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-main)] flex items-center gap-1.5 transition-colors"
              >
                <span>MarinerAI</span>
                <span className="text-xs text-[var(--text-muted)] font-normal hidden sm:inline">
                  · {activeRoleObj.label}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>

              {isRoleMenuOpen && (
                <div
                  className="absolute left-0 mt-1.5 w-60 rounded-2xl border border-[var(--border-subtle)] shadow-2xl p-1.5 z-50 text-xs space-y-0.5 animate-fadeIn"
                  style={{ backgroundColor: 'var(--bg-sidebar)' }}
                >
                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                    Switch Rank Perspective
                  </div>
                  {MARITIME_ROLES.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedRole(r.id);
                        setIsRoleMenuOpen(false);
                        showToast(`Perspective: ${r.label}`);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors ${
                        selectedRole === r.id
                          ? 'bg-[var(--accent)] text-white font-medium'
                          : 'text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
                      }`}
                    >
                      <span>{r.label}</span>
                      {selectedRole === r.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                  <div className="pt-1 mt-1 border-t border-[var(--border-subtle)]">
                    <button
                      onClick={() => {
                        setIsRoleMenuOpen(false);
                        setIsFoodModalOpen(true);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl flex items-center gap-2 text-orange-400 hover:bg-[var(--bg-surface)] font-medium transition-colors"
                    >
                      <Utensils className="w-4 h-4" />
                      <span>Food Planner (MLC 3.2)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Top Actions - Codex-style Segmented Toolbar */}
          <div className="flex items-center gap-1.5">
            <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs">
              <button
                onClick={() => setIsFoodModalOpen(true)}
                className="px-2.5 py-1 rounded-md text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1.5 transition-colors"
                title="MLC 3.2 Food & Catering Planner"
              >
                <Utensils className="w-3.5 h-3.5 text-orange-400" />
                <span className="hidden sm:inline font-medium">Food</span>
              </button>

              <button
                onClick={() => setIsKBModalOpen(true)}
                className="px-2.5 py-1 rounded-md text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1.5 transition-colors"
                title="Browse 26 Knowledge Base Sections"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline font-medium">KB</span>
              </button>

              <button
                onClick={() => setIsToolsModalOpen(true)}
                className="px-2.5 py-1 rounded-md text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1.5 transition-colors"
                title="UKC / Squat Calculator & Checklists"
              >
                <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline font-medium">Tools</span>
              </button>

              <button
                onClick={() => setIsWorkspaceModalOpen(true)}
                className="px-2.5 py-1 rounded-md text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1.5 transition-colors"
                title="Google Workspace Hub"
              >
                <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline font-medium">Workspace</span>
              </button>
            </div>

            <button
              onClick={handleNewChat}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              title="New Chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ============ MESSAGES STREAM ============ */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Minimalist ChatGPT / Codex App style Landing Screen when no conversation */}
            {messages.length === 0 && (
              <div className="pt-8 sm:pt-16 pb-6 text-center space-y-6 animate-fadeIn max-w-2xl mx-auto">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 mx-auto grid place-items-center text-white shadow-sm">
                    <Anchor className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)]">
                    MarinerAI
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Maritime operations, statutory IMO/MLC rules & operational calculations.
                  </p>
                </div>

                {/* Segmented Category Filter Bar */}
                <div className="flex items-center justify-center gap-1.5 overflow-x-auto pb-1 scrollbar-none px-2">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'nav', label: '🧭 Navigation' },
                    { id: 'engine', label: '⚙️ Engine' },
                    { id: 'safety', label: '🛡️ Safety & Cargo' },
                    { id: 'food', label: '🍽️ Provisions' },
                    { id: 'marina', label: '🇵🇭 MARINA' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setPromptCategory(cat.id as any)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
                        promptCategory === cat.id
                          ? 'bg-[var(--text-main)] text-[var(--bg-main)] shadow-xs'
                          : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Segmented 1-Line Quick Prompt Chips (Codex Style) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-1">
                  {(SEGMENTED_PROMPTS[promptCategory] || SEGMENTED_PROMPTS.all).map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(item.query)}
                      className="p-3 rounded-2xl border border-[var(--border-subtle)] hover:border-[var(--border-focus)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-all flex items-center justify-between gap-2.5 group text-left cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-sm shrink-0">{item.icon}</span>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors truncate">
                            {item.label}
                          </div>
                          <div className="text-[10.5px] text-[var(--text-subtle)] truncate">
                            {item.query}
                          </div>
                        </div>
                      </div>
                      <ArrowUp className="w-3.5 h-3.5 text-[var(--text-subtle)] group-hover:text-[var(--text-main)] shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Render Conversation */}
            {messages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
                >
                  {/* Sender Label (Minimalist) */}
                  {!isUser && (
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      <div className="w-5 h-5 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30 grid place-items-center text-[10px]">
                        ⚓
                      </div>
                      <span className="text-xs font-semibold text-[var(--text-main)]">
                        MarinerAI
                      </span>
                      <span className="text-[10px] text-[var(--text-subtle)] font-mono">
                        {msg.time}
                      </span>
                    </div>
                  )}

                  {/* Message Body */}
                  <div
                    className={`${
                      isUser
                        ? 'bg-[var(--bg-bubble-user)] border border-[var(--border-subtle)] text-[var(--text-main)] rounded-2xl sm:rounded-3xl px-4 py-2.5 max-w-[88%] sm:max-w-[80%]'
                        : 'text-[var(--text-main)] w-full py-1 leading-relaxed'
                    }`}
                  >
                    {/* Audio Player if present */}
                    {msg.audio && (
                      <div className="flex items-center gap-2 py-1 mb-2">
                        <audio controls src={msg.audio.url} className="h-8 max-w-[240px]" />
                        <span className="text-[10px] text-[var(--text-subtle)] font-mono">
                          {Math.floor(msg.audio.duration / 60)}:{String(Math.floor(msg.audio.duration % 60)).padStart(2, '0')}
                        </span>
                      </div>
                    )}

                    {/* Attachments if present */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {/* Image grid */}
                        {msg.attachments.some((a) => a.type.startsWith('image/')) && (
                          <div className="grid grid-cols-2 gap-2 max-w-sm rounded-xl overflow-hidden">
                            {msg.attachments
                              .filter((a) => a.type.startsWith('image/'))
                              .map((img) => (
                                <a
                                  key={img.id}
                                  href={img.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <img
                                    src={img.url}
                                    alt={img.name}
                                    className="w-full h-32 object-cover rounded-lg bg-[var(--bg-surface)]"
                                    loading="lazy"
                                  />
                                </a>
                              ))}
                          </div>
                        )}

                        {/* File chips */}
                        {msg.attachments
                          .filter((a) => !a.type.startsWith('image/'))
                          .map((f) => (
                            <a
                              key={f.id}
                              href={f.url}
                              download={f.name}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                            >
                              <span>{getFileEmoji(f.type, f.name)}</span>
                              <span className="truncate max-w-[180px]">{f.name}</span>
                              <span className="text-[10px] text-[var(--text-subtle)]">({formatSize(f.size)})</span>
                            </a>
                          ))}
                      </div>
                    )}

                    {/* Text content */}
                    {msg.text && (
                      <div>
                        {isUser ? (
                          <div className="text-sm whitespace-pre-wrap">{msg.text}</div>
                        ) : (
                          renderMarkdown(msg.text)
                        )}
                      </div>
                    )}

                    {/* Food plan export banner if message contains meal plan */}
                    {!isUser && (msg.text.includes('Food & Catering Plan') || msg.text.includes('Victualing Parameters') || msg.text.includes('Meal Schedule') || msg.text.includes('Ship-Chandler Provisioning')) && (
                      <div className="mt-3 p-3 rounded-2xl bg-orange-500/10 border border-orange-500/25 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                        <div className="flex items-center gap-2 text-orange-400 font-semibold">
                          <Utensils className="w-4 h-4 shrink-0" />
                          <span>MLC 3.2 Provision Manifest & Excel Order Sheet Ready</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsFoodModalOpen(true)}
                            className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-emerald-400 flex items-center gap-1.5 transition-colors font-medium shadow-2xs"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>Export Excel (.csv)</span>
                          </button>
                          <button
                            onClick={() => setIsFoodModalOpen(true)}
                            className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-blue-400 flex items-center gap-1.5 transition-colors font-medium shadow-2xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print / PDF Manifest</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Assistant Actions Bar (Copy, TTS, Timestamp) */}
                  {!isUser && msg.id !== 'welcome-msg' && (
                    <div className="flex items-center gap-1.5 mt-2 px-1 text-[var(--text-subtle)]">
                      <button
                        onClick={() => copyToClipboard(msg.id, msg.text)}
                        className="p-1 rounded-md hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => toggleSpeech(msg.id, msg.text)}
                        className={`p-1 rounded-md hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors ${
                          speakingMsgId === msg.id ? 'text-blue-400' : ''
                        }`}
                        title={
                          loadingTtsId === msg.id
                            ? `Generating audio with Gemini TTS (${TTS_VOICE})...`
                            : speakingMsgId === msg.id
                            ? 'Stop reading'
                            : `Read aloud with Gemini TTS (Voice: ${TTS_VOICE})`
                        }
                      >
                        {loadingTtsId === msg.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                        ) : speakingMsgId === msg.id ? (
                          <VolumeX className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => setIsKBModalOpen(true)}
                        className="p-1 text-[11px] rounded-md hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors flex items-center gap-1"
                        title="View in Knowledge Base"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Sources</span>
                      </button>
                    </div>
                  )}

                  {/* User Timestamp */}
                  {isUser && (
                    <span className="text-[10px] text-[var(--text-subtle)] font-mono mt-1 px-1">
                      {msg.time}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Generating Typing Indicator */}
            {isGenerating && (
              <div className="flex items-center gap-3 py-2">
                <div className="w-5 h-5 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30 grid place-items-center text-[10px]">
                  ⚓
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* ============ BOTTOM PILL COMPOSER (ChatGPT / DeepSeek Style) ============ */}
        <div className="shrink-0 px-3 sm:px-4 pb-safe pt-1 z-20">
          <div className="max-w-3xl mx-auto">
            
            {/* Pending Attachments Strip */}
            {pendingAttachments.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {pendingAttachments.map((it) => (
                  <div
                    key={it.id}
                    className="relative flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] shrink-0"
                  >
                    <span>{getFileEmoji(it.type, it.name)}</span>
                    <span className="truncate max-w-[120px]">{it.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(it.id)}
                      className="w-4 h-4 rounded-full hover:bg-[var(--danger)] hover:text-white grid place-items-center text-[var(--text-muted)]"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Pill Container */}
            <div
              className={`relative rounded-3xl sm:rounded-[26px] border border-[var(--border-subtle)] focus-within:border-[var(--border-focus)] transition-all shadow-xs flex flex-col ${
                isRecording ? 'border-red-500/40 bg-red-500/5' : 'bg-[var(--bg-surface)]'
              }`}
            >
              {/* Active Audio Recording Bar */}
              {isRecording ? (
                <div className="flex items-center justify-between px-4 py-3 min-h-[52px]">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 h-5">
                      <span className="wave-bar" />
                      <span className="wave-bar" />
                      <span className="wave-bar" />
                      <span className="wave-bar" />
                      <span className="wave-bar" />
                    </div>
                    <span className="text-sm font-semibold text-red-400 font-mono">
                      {Math.floor(recDuration / 60)}:{String(recDuration % 60).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      Listening to voice inquiry…
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={cancelRecording}
                      className="px-3 py-1 rounded-full text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-subtle)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white grid place-items-center shadow-md transition-transform active:scale-95"
                      title="Send Voice Note"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal Text Composer Row */
                <div className="flex items-end px-3 py-2 gap-2">
                  
                  {/* Plus Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-8 h-8 rounded-full hover:bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] grid place-items-center shrink-0 mb-0.5 transition-colors"
                    title="Attach document, nautical plan, or image"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  {/* Auto-growing Textarea */}
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputText}
                    placeholder="Ask MarinerAI anything about ship operations or MAR-KB-001…"
                    className="flex-1 bg-transparent border-0 outline-none resize-none text-sm text-[var(--text-main)] placeholder-[var(--text-subtle)] py-1.5 px-1 min-h-[36px] max-h-40 leading-relaxed"
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        sendMessage(inputText);
                      }
                    }}
                  />

                  {/* Right Tools & Mic & Send Button */}
                  <div className="flex items-center gap-1 shrink-0 mb-0.5">
                    {/* Quick tools trigger */}
                    <button
                      type="button"
                      onClick={() => setIsToolsModalOpen(true)}
                      className="w-8 h-8 rounded-full hover:bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] grid place-items-center transition-colors hidden sm:grid"
                      title="Maritime Tools"
                    >
                      <Calculator className="w-4 h-4 text-emerald-400" />
                    </button>

                    {/* Microphone button */}
                    <button
                      type="button"
                      onClick={startRecording}
                      className="w-8 h-8 rounded-full hover:bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] grid place-items-center transition-colors"
                      title="Voice Note"
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    {/* Send Button (ChatGPT / DeepSeek Arrow-up circle) */}
                    <button
                      type="button"
                      disabled={(!inputText.trim() && pendingAttachments.length === 0) || isGenerating}
                      onClick={() => sendMessage(inputText)}
                      className={`w-8 h-8 rounded-full grid place-items-center transition-all ${
                        (inputText.trim() || pendingAttachments.length > 0) && !isGenerating
                          ? 'bg-[var(--send-btn-active)] text-[var(--send-btn-icon)] shadow-xs scale-100 hover:opacity-90 active:scale-95'
                          : 'bg-[var(--border-subtle)] text-[var(--text-subtle)] cursor-not-allowed opacity-50'
                      }`}
                      title="Send message"
                    >
                      <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Subtle disclaimer */}
            <div className="text-[10px] text-center text-[var(--text-subtle)] py-2 select-none">
              MarinerAI references MAR-KB-001. Always verify with vessel's approved SMS & responsible officers.
            </div>

          </div>
        </div>

      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.json,.md"
        onChange={(e) => {
          handleAddFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-black/85 text-white text-xs border border-white/10 shadow-2xl backdrop-blur-md animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* Drag & Drop Overlay */}
      {isDragOver && (
        <div className="fixed inset-4 z-50 rounded-2xl border-2 border-dashed border-blue-500 bg-blue-500/10 backdrop-blur-xs flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-2">
            <Anchor className="w-10 h-10 text-blue-400 mx-auto animate-bounce" />
            <div className="text-sm font-semibold text-blue-300">
              Drop nautical documents or images to inspect
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Base Modal */}
      <KnowledgeBaseModal
        isOpen={isKBModalOpen}
        onClose={() => setIsKBModalOpen(false)}
        onAskAboutSection={(section: KnowledgeSection) => {
          sendMessage(
            `Explain the operational requirements, mandatory checklists, and safety boundaries for Section ${section.number}: "${section.title}" under MAR-KB-001.`
          );
        }}
      />

      {/* Maritime Tools Modal */}
      <MaritimeToolsModal
        isOpen={isToolsModalOpen}
        onClose={() => setIsToolsModalOpen(false)}
        onSendToChat={(text: string) => {
          sendMessage(text);
        }}
      />

      {/* Food & Provisioning Planner Modal (MLC 3.2) */}
      <FoodPlannerModal
        isOpen={isFoodModalOpen}
        onClose={() => setIsFoodModalOpen(false)}
        onSendToChat={(text: string) => {
          sendMessage(text);
        }}
        onShowToast={showToast}
      />

      {/* Google Workspace Hub Modal (Calendar, Gmail, Sheets, Docs, Drive) */}
      <WorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        currentChatText={messages.map((m) => `${m.role === 'user' ? 'USER' : 'MARINER_AI'}: ${m.text}`).join('\n\n')}
        onShowToast={showToast}
      />

    </div>
  );
}
