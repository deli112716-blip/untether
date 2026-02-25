import { Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';

/**
 * A Vite plugin that acts as a local backend proxy for Gemini API calls.
 * This runs securely on the Node.js server to prevent exposing GEMINI_API_KEY to the browser.
 */
export function geminiBackendPlugin(apiKey: string | undefined): Plugin {
    let ai: GoogleGenAI | null = null;
    if (apiKey) {
        try {
            ai = new GoogleGenAI({ apiKey });
        } catch (e) {
            console.warn("Could not initialize GoogleGenAI:", e);
        }
    }

    return {
        name: 'gemini-backend-proxy',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                if (req.url === '/api/gemini' && req.method === 'POST') {
                    if (!apiKey || !ai) {
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: 'GEMINI_API_KEY missing or invalid on server' }));
                        return;
                    }

                    // Parse JSON body
                    let body = '';
                    req.on('data', chunk => {
                        body += chunk.toString();
                    });

                    req.on('end', async () => {
                        try {
                            const parsed = JSON.parse(body);
                            const prompt = parsed.prompt;
                            const systemInstruction = parsed.systemInstruction;
                            const tools = parsed.tools;
                            const responseSchema = parsed.responseSchema;

                            const config: any = {};
                            if (systemInstruction) config.systemInstruction = systemInstruction;
                            if (responseSchema) config.responseSchema = responseSchema;
                            if (tools) config.tools = tools;

                            console.log("[Backend] Calling Gemini API securely...");
                            const response = await ai!.models.generateContent({
                                model: 'gemini-2.5-flash',
                                contents: prompt,
                                config
                            });

                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ text: response.text }));
                        } catch (error: any) {
                            console.error('[Backend] Gemini API Error:', error);
                            res.statusCode = 500;
                            res.end(JSON.stringify({ error: error.message }));
                        }
                    });
                } else {
                    next();
                }
            });
        }
    };
}
