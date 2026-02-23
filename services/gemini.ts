
import { GoogleGenAI, Type, Modality } from "@google/genai";

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
  if (errorMessage.includes("429") || errorMessage.includes("Quota exceeded") || errorMessage.includes("Requested entity was not found")) {
    console.warn("API limit reached or key invalid. Prompting for personal key...");
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      // After selecting, the app should be reloaded or the caller should retry
    }
  }
  throw error;
}

export const generateWarningMessage = async (app: string, usage: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const customStyle = localStorage.getItem('untether_warning_style') || 'The Stoic';
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a warning message for someone who has spent ${usage} on ${app}. 
      The style should be: ${customStyle}. 
      The goal is to encourage them to put down their phone and look at the real world. 
      Keep it under 20 words.`,
      config: {
        temperature: 0.8,
        topP: 0.95,
      }
    });
    return response.text || "Life is happening right now, beyond this lens. Look up.";
  } catch (error) {
    return handleApiError(error).catch(() => "The lens is stealing your focus. Reconnect with reality.");
  }
};

export const analyzeAddiction = async (answers: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these digital addiction assessment answers: ${JSON.stringify(answers)}. 
      Return a JSON object with: 
      - score: number (0-100)
      - category: string (creative profile name)
      - breakdown: array of objects {name: string, value: number} representing usage drivers.`,
      config: {
        responseMimeType: "application/json",
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
      }
    });
    const result = JSON.parse(response.text || "{}");
    return { ...result, lastTaken: new Date().toISOString() };
  } catch (e) {
    return handleApiError(e);
  }
};

export const speakWarning = async (text: string, voiceName: string = 'Charon') => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) throw new Error("AudioContext not supported");
    
    const audioCtx = new AudioContextClass({ sampleRate: 24000 });
    const decoded = decode(base64Audio);
    const buffer = await decodeAudioData(decoded, audioCtx, 24000, 1);
    
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start();
    
    return true;
  } catch (error) {
    console.error("TTS Error:", error);
    return false;
  }
};

export const getMindfulInsight = async (stats: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on these app usage stats: ${JSON.stringify(stats)}, provide 3 short, actionable mindfulness tips to reduce digital clutter and increase focus.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });
    const jsonStr = response.text?.trim() || "[]";
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
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate one profound, open-ended mindfulness question to help someone reflect on their day after a deep focus session. Max 15 words.",
      config: { temperature: 0.9 }
    });
    return response.text?.trim() || "What did the silence teach you today?";
  } catch (error) {
    return handleApiError(error).catch(() => "What is one thing you noticed in the real world during your break?");
  }
};
