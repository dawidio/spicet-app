/**
 * AI Engine — manages WebLLM (local) and Gemini (BYO key) backends.
 * Exposes a unified interface for the chat UI.
 */

import { getSetting, setSetting } from './db';

// ── State ───────────────────────────────────────────────────────
let webllmEngine = null;
let webllmReady = false;
let initPromise = null;
let currentBackend = null; // 'webllm' | 'gemini'

// ── Status callback (for UI progress) ───────────────────────────
let statusCallback = () => {};
export function onStatus(cb) {
  statusCallback = cb;
}

// ── Backend detection ───────────────────────────────────────────
export function getBackend() {
  return currentBackend;
}

export async function getGeminiKey() {
  return getSetting('geminiApiKey');
}

export async function setGeminiKey(key) {
  await setSetting('geminiApiKey', key);
}

// ── WebLLM initialization ───────────────────────────────────────
const PREFERRED_MODEL = 'Llama-3.2-3B-Instruct-q4f16_1-MLC';
const FALLBACK_MODEL = 'Phi-3.5-mini-instruct-q4f16_1-MLC';

export async function initWebLLM() {
  if (webllmReady && webllmEngine) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      statusCallback({
        stage: 'loading',
        message: 'Loading AI model... (one-time download, ~1.5 GB)',
        progress: 0,
      });

      const webllm = await import('@mlc-ai/web-llm');

      // Try to create engine with preferred model
      let modelId = PREFERRED_MODEL;
      try {
        webllmEngine = await webllm.CreateMLCEngine(modelId, {
          initProgressCallback: (info) => {
            const pct = Math.round((info.progress || 0) * 100);
            statusCallback({
              stage: 'loading',
              message: info.text || `Downloading model... ${pct}%`,
              progress: pct,
            });
          },
        });
      } catch (err) {
        console.warn('Primary model failed, trying fallback:', err);
        modelId = FALLBACK_MODEL;
        statusCallback({
          stage: 'loading',
          message: 'Trying smaller model...',
          progress: 0,
        });
        webllmEngine = await webllm.CreateMLCEngine(modelId, {
          initProgressCallback: (info) => {
            const pct = Math.round((info.progress || 0) * 100);
            statusCallback({
              stage: 'loading',
              message: info.text || `Downloading model... ${pct}%`,
              progress: pct,
            });
          },
        });
      }

      webllmReady = true;
      currentBackend = 'webllm';
      statusCallback({ stage: 'ready', message: 'AI ready (local)', progress: 100 });
      return true;
    } catch (err) {
      console.error('WebLLM init failed:', err);
      statusCallback({
        stage: 'error',
        message:
          'Local AI unavailable on this device. Use Settings to add a Gemini API key as fallback.',
        progress: 0,
      });
      initPromise = null;
      return false;
    }
  })();

  return initPromise;
}

// ── Chat completion (unified) ───────────────────────────────────

/**
 * Send a message to the AI and stream the response.
 * @param {string} systemPrompt - The full system prompt with chart context
 * @param {Array} messages - Chat history [{role: 'user'|'assistant', content: string}]
 * @param {function} onChunk - Called with each text chunk as it streams
 * @returns {Promise<string>} The full response text
 */
export async function chat(systemPrompt, messages, onChunk) {
  // Decide which backend to use
  const geminiKey = await getGeminiKey();

  if (webllmReady && webllmEngine) {
    return chatWebLLM(systemPrompt, messages, onChunk);
  } else if (geminiKey) {
    return chatGemini(systemPrompt, messages, onChunk, geminiKey);
  } else {
    throw new Error(
      'No AI backend available. Either download the local model or add a Gemini API key in Settings.'
    );
  }
}

/**
 * Check if any AI backend is available
 */
export async function isAIAvailable() {
  if (webllmReady) return true;
  const key = await getGeminiKey();
  return !!key;
}

// ── WebLLM chat ─────────────────────────────────────────────────
async function chatWebLLM(systemPrompt, messages, onChunk) {
  if (!webllmEngine) throw new Error('WebLLM not initialized');

  const llmMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  let fullResponse = '';

  try {
    const completion = await webllmEngine.chat.completions.create({
      messages: llmMessages,
      temperature: 0.7,
      max_tokens: 800,
      stream: true,
    });

    for await (const chunk of completion) {
      const delta = chunk.choices?.[0]?.delta?.content || '';
      if (delta) {
        fullResponse += delta;
        onChunk(delta);
      }
    }
  } catch (err) {
    console.error('WebLLM chat error:', err);
    throw new Error('Local AI error. Try refreshing the page.');
  }

  return fullResponse;
}

// ── Gemini chat ─────────────────────────────────────────────────
async function chatGemini(systemPrompt, messages, onChunk, apiKey) {
  currentBackend = 'gemini';

  // Build Gemini request — using the v1beta generateContent endpoint
  const geminiMessages = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: geminiMessages,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800,
    },
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      if (response.status === 400 || response.status === 403) {
        throw new Error('Invalid Gemini API key. Check your key in Settings.');
      }
      throw new Error(`Gemini API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

    // Simulate streaming for consistent UX
    const words = text.split(' ');
    let fullResponse = '';
    for (let i = 0; i < words.length; i++) {
      const chunk = (i === 0 ? '' : ' ') + words[i];
      fullResponse += chunk;
      onChunk(chunk);
      // Small delay for streaming feel
      if (i % 5 === 0) {
        await new Promise((r) => setTimeout(r, 10));
      }
    }

    return fullResponse;
  } catch (err) {
    if (err.message.includes('Gemini API')) throw err;
    if (err.message.includes('Invalid Gemini')) throw err;
    throw new Error('Failed to reach Gemini API. Check your internet connection.');
  }
}
