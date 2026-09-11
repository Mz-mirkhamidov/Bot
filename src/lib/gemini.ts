import { GoogleGenAI } from "@google/genai";

const TRANSCRIBE_PROMPT =
  "Bu audio o'zbek tilida yozilgan javob. Uni aynan eshitilganidek matnga o'gir. " +
  "Hech narsa qo'shma, tushuntirma yozma, tarjima qilma. Faqat matn. " +
  "Agar ba'zi joy tushunarsiz bo'lsa [?] deb belgila. Raqamlar va summalarni raqam bilan yoz.";

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[gemini] GEMINI_API_KEY o'rnatilmagan");
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

function getModelName(): string {
  return process.env.GEMINI_MODEL || "gemini-3.8-flash";
}

const TRANSCRIBE_TIMEOUT_MS = 60_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

// Ovozni matnga o'giradi. Muvaffaqiyatsiz bo'lsa null qaytaradi —
// chaqiruvchi ovoz faylini saqlab qolib, xatoni ko'rsatadi (TZ 8.3).
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<string | null> {
  const ai = getClient();
  if (!ai) return null;

  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: getModelName(),
        contents: [
          {
            role: "user",
            parts: [
              { text: TRANSCRIBE_PROMPT },
              { inlineData: { mimeType, data: audioBuffer.toString("base64") } },
            ],
          },
        ],
      }),
      TRANSCRIBE_TIMEOUT_MS
    );
    const text = response.text?.trim();
    if (!text || text.length === 0) {
      console.error("[gemini] transkripsiya bo'sh javob qaytardi", { mimeType, model: getModelName() });
      return null;
    }
    return text;
  } catch (err) {
    console.error("[gemini] transkripsiya xatosi", {
      mimeType,
      model: getModelName(),
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
