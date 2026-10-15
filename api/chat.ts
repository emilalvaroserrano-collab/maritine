/**
 * Vercel serverless function: POST /api/chat
 * Same behavior as the Express route in server.ts (which does not run on Vercel).
 */
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  buildSystemInstruction,
  generateLocalMaritimeResponse,
  parseBody,
  errorToString,
} from './_kb';
import { CHAT_MODELS, CHAT_META_MODEL, supportsThinking } from '../src/config/aiModels';

export const config = { maxDuration: 30 };

function sendJson(res: any, status: number, payload: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(payload));
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed. Use POST /api/chat.' });
  }

  try {
    const body = parseBody(req.body);
    const { message, role = 'all', history = [], attachments = [], audio } = body;

    if (!message && (!attachments || attachments.length === 0) && !audio) {
      return sendJson(res, 400, { error: 'Message or attachment is required.' });
    }

    const ok = (text: string, meta: Record<string, unknown>) =>
      sendJson(res, 200, { text, meta });

    // No API key -> serve the grounded local KB answer instead of a 500,
    // so the UI never shows a connection notice for a missing secret.
    if (!process.env.GEMINI_API_KEY) {
      return ok(generateLocalMaritimeResponse(message || '', role, attachments || []), {
        model: 'local-maritime-kb',
        reference: 'MAR-KB-001',
        source: 'Maritime Operations Knowledge Base (offline fallback: GEMINI_API_KEY not configured)',
        timestamp: new Date().toISOString(),
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    let roleAugmentation = '';
    if (role && role !== 'all') {
      roleAugmentation = `\nActive User Rank/Perspective: Focus your response primarily for the "${role}" role per Section 02 and Section 22 role-based reference bundles.`;
    }

    const parts: any[] = [];
    if (audio && audio.base64) {
      const cleanBase64 = String(audio.base64).replace(/^data:[^;]+;base64,/, '');
      parts.push({
        inlineData: { mimeType: audio.mimeType || 'audio/webm', data: cleanBase64 },
      });
      parts.push({
        text: 'The user sent the above voice recording. Listen, transcribe their spoken request, and answer their maritime question thoroughly according to MAR-KB-001.',
      });
    }

    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.base64) {
          const cleanData = String(att.base64).replace(/^data:[^;]+;base64,/, '');
          if (att.type && att.type.startsWith('image/')) {
            parts.push({ inlineData: { mimeType: att.type, data: cleanData } });
            parts.push({
              text: `[Attached image: "${att.name || 'image'}"] Please inspect any maritime equipment, markings, documents, or conditions visible.`,
            });
          } else if (att.type === 'application/pdf' || att.type?.includes('text') || att.type?.includes('json')) {
            parts.push({ text: `[Attached document: "${att.name || 'document'}" (${att.type || 'file'})]` });
          }
        }
      }
    }

    if (message) parts.push({ text: message });

    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const turn of history.slice(-6)) {
        if (turn.role === 'user') contents.push({ role: 'user', parts: [{ text: turn.content }] });
        else if (turn.role === 'assistant' || turn.role === 'model')
          contents.push({ role: 'model', parts: [{ text: turn.content }] });
      }
    }
    contents.push({ role: 'user', parts });

    let replyText = '';
    const modelsToTry = CHAT_MODELS;

    for (const modelName of modelsToTry) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Model timeout after 25s (${modelName})`)), 25000),
        );
        const modelConfig: any = {
          systemInstruction: buildSystemInstruction() + roleAugmentation,
          temperature: 0.3,
        };
        if (supportsThinking(modelName)) {
          modelConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }
        const callPromise = ai.models.generateContent({ model: modelName, contents, config: modelConfig });
        const response: any = await Promise.race([callPromise, timeoutPromise]);
        replyText = response?.text || '';
        if (replyText) break;
      } catch (callErr: any) {
        console.warn(`Model ${modelName} call returned:`, callErr?.message || callErr);
      }
    }

    if (!replyText) {
      replyText = generateLocalMaritimeResponse(message || '', role, attachments || []);
    }

    return ok(replyText, {
      model: CHAT_META_MODEL,
      reference: 'MAR-KB-001',
      source: 'Maritime Operations Knowledge Base',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('Error generating response:', err);
    return sendJson(res, 500, {
      error: errorToString(err) || 'An error occurred while processing the maritime query.',
    });
  }
}
