/**
 * Vercel serverless function: POST /api/tts
 * Same behavior as the Express route in server.ts (which does not run on Vercel).
 */
import { GoogleGenAI } from '@google/genai';
import { parseBody, errorToString } from './_kb';

export const config = { maxDuration: 30 };

function sendJson(res: any, status: number, payload: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(payload));
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed. Use POST /api/tts.' });
  }

  try {
    const body = parseBody(req.body);
    const { text, voiceName = 'Fola' } = body;
    if (!text) return sendJson(res, 400, { error: 'Text is required for TTS.' });

    if (!process.env.GEMINI_API_KEY) {
      return sendJson(res, 500, {
        error: 'GEMINI_API_KEY is not configured on the server. Set it in the Vercel dashboard (Project Settings → Environment Variables).',
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const cleanText = String(text)
      .replace(/\[STATUTORY \/ REQUIRED\]/g, 'Statutory required: ')
      .replace(/\[VESSEL-SPECIFIC\]/g, 'Vessel specific: ')
      .replace(/\[CONDITIONAL\]/g, 'Conditional: ')
      .replace(/\[RECOMMENDED\]/g, 'Recommended: ')
      .replace(/\[VERIFY\]/g, 'Verify: ')
      .replace(/\[MAR-KB-001\s*§\d+[^\]]*\]/g, '')
      .replace(/[*_#`]/g, '')
      .trim()
      .slice(0, 1600);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [{ role: 'user', parts: [{ text: `## Transcript:\n${cleanText}` }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName || 'Fola' } } },
      },
    });

    const base64Audio = (response as any).candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error('TTS model did not return audio data.');

    return sendJson(res, 200, {
      audioUrl: `data:audio/wav;base64,${base64Audio}`,
      base64: base64Audio,
      mimeType: 'audio/wav',
      voice: voiceName || 'Fola',
    });
  } catch (err: unknown) {
    console.error('TTS endpoint error:', err);
    return sendJson(res, 500, { error: errorToString(err) || 'TTS generation failed' });
  }
}
