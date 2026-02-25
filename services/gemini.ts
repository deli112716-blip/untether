import { Type, Modality } from "@google/genai";

// Audio Helpers
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Handle API errors specifically 429 (Quota) and 404 (Entity not found)
 * by prompting the user to select a personal API key.
 */
async function handleApiError(error: any) {
  const errorMessage = error?.message || "";
  if (errorMessage.includes("429") || errorMessage.includes("Quota exceeded") || errorMessage.includes("Requested entity was not found") || errorMessage.includes("GEMINI_API_KEY")) {
    console.warn("API limit reached or key invalid. Prompting for personal key...");
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      // After selecting, the app should be reloaded or the caller should retry
    }
  }
  throw error;
}

/**
 * Generic helper to call the secure local backend proxy.
 */
async function callGeminiProxy(payload: any) {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to call Gemini via proxy');
  }
  return data;
}

export const generateWarningMessage = async (app: string, usage: string) => {
  const customStyle = localStorage.getItem('untether_warning_style') || 'The Stoic';

  try {
    const data = await callGeminiProxy({
      prompt: `Generate a warning message for someone who has spent ${usage} on ${app}. 
      The style should be: ${customStyle}. 
      The goal is to encourage them to put down their phone and look at the real world. 
      Keep it under 20 words.`,
      systemInstruction: null
    });
    return data.text || "Life is happening right now, beyond this lens. Look up.";
  } catch (error) {
    return handleApiError(error).catch(() => "The lens is stealing your focus. Reconnect with reality.");
  }
};

export const analyzeAddiction = async (answers: any) => {
  try {
    const data = await callGeminiProxy({
      prompt: `Analyze these digital addiction assessment answers: ${JSON.stringify(answers)}. 
      Return a JSON object with: 
      - score: number (0-100)
      - category: string (creative profile name)
      - breakdown: array of objects {name: string, value: number} representing usage drivers.`,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          category: { type: Type.STRING },
          breakdown: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    });
    const result = JSON.parse(data.text || "{}");
    return { ...result, lastTaken: new Date().toISOString() };
  } catch (e) {
    return handleApiError(e);
  }
};

export const speakWarning = async (text: string, voiceName: string = 'Charon') => {
  try {
    // Note: TTS proxy architecture depends on server implementation. 
    // For simplicity, we fallback to local basic TTS if the proxy doesn't handle audio payloads properly yet.
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
      return true;
    }
    return false;
  } catch (error) {
    console.error("TTS Error:", error);
    return false;
  }
};

export const getMindfulInsight = async (stats: any) => {
  try {
    const data = await callGeminiProxy({
      prompt: `Based on these app usage stats: ${JSON.stringify(stats)}, provide 3 short, actionable mindfulness tips to reduce digital clutter and increase focus.`,
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING
        }
      }
    });
    const jsonStr = data.text?.trim() || "[]";
    return JSON.parse(jsonStr);
  } catch (error) {
    return handleApiError(error).catch(() => [
      "Try the 20-20-20 rule for eye strain.",
      "Leave your phone in another room during focused work.",
      "Go for a 5-minute walk without any devices."
    ]);
  }
};

export const getReflectionQuestion = async () => {
  try {
    const data = await callGeminiProxy({
      prompt: "Generate one profound, open-ended mindfulness question to help someone reflect on their day after a deep focus session. Max 15 words."
    });
    return data.text?.trim() || "What did the silence teach you today?";
  } catch (error) {
    return handleApiError(error).catch(() => "What is one thing you noticed in the real world during your break?");
  }
};
