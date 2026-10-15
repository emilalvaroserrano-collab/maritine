/**
 * Single source of truth for Gemini model selection.
 *
 * Chat + TTS responses across the Express dev server (server.ts),
 * the Vercel serverless functions (api/), and the web client all use
 * these constants — change a model here and it applies everywhere.
 *
 * Verified against https://ai.google.dev/gemini-api/docs/models:
 * - gemini-3.8-flash ......... primary chat (recommended for new projects)
 * - gemini-3.1-flash-lite .... chat fallback (fast, budget-friendly)
 * - gemini-flash-latest ...... version alias fallback
 * - gemini-3.8-flash-lite-tts  primary TTS (fast, cost-efficient workhorse)
 * - gemini-3.8-flash-tts ..... TTS fallback (higher fidelity)
 */

/** Chat models tried in order until one returns text. */
export const CHAT_MODELS: string[] = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

/** Model name reported in chat response metadata (preferred model). */
export const CHAT_META_MODEL = 'gemini-3.8-flash';

/** TTS models tried in order until one returns audio. */
export const TTS_MODELS: string[] = [
  'gemini-3.8-flash-lite-tts',
  'gemini-3.8-flash-tts',
];

/** Default TTS voice (MarinerAI narrator voice). */
export const TTS_VOICE = 'Fola';

const THINKING_PREFIXES = ['gemini-3', 'gemini-4'];

/** Whether a model family accepts thinkingConfig.thinkingLevel. */
export function supportsThinking(modelName: string): boolean {
  return THINKING_PREFIXES.some((p) => modelName.startsWith(p));
}
