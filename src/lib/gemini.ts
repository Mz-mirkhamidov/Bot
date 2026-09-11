import { GoogleGenAI } from "@google/genai";
import type { AiSummaryJson } from "@/types/admin";

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

const SUMMARY_PROMPT =
  "Sen intervyu tahlilchisisan. Faqat respondent AYTGAN narsaga tayan. " +
  "Hech narsa o'ylab topma yoki taxmin qilma. Ma'lumot yetishmasa \"missing_info\" ga yoz. " +
  "Maqtov va umumiy gaplarni dalil deb hisoblama — faqat aniq sana, summa va hodisalar dalil bo'ladi.\n\n" +
  "Quyida bog'cha direktori bilan o'tkazilgan so'rovnomaning savol-javoblari berilgan. " +
  "Shular asosida faqat quyidagi JSON formatida (boshqa hech narsa qo'shmasdan) xulosa chiqar:\n\n" +
  `{
  "biggest_pain": "string — respondentning o'z so'zlari bilan",
  "pain_evidence": ["aniq iqtiboslar"],
  "numbers_mentioned": [{"what":"...","value":"...","question":12}],
  "time_costs": [{"activity":"...","hours_per_month":0}],
  "money_at_risk": "string yoki null",
  "already_paid_for": "string yoki null",
  "hypothesis_signals": {"subsidy":"strong|weak|none","documents":"strong|weak|none","occupancy":"strong|weak|none"},
  "green_flags": ["..."],
  "red_flags": ["..."],
  "quotes_worth_keeping": ["..."],
  "missing_info": ["aniqlanmagan, qayta so'rash kerak bo'lgan narsalar"]
}`;

const SUMMARY_TIMEOUT_MS = 60_000;

export async function generateSessionSummary(
  qaPairs: { number: number; text: string; answer: string }[]
): Promise<AiSummaryJson | null> {
  const ai = getClient();
  if (!ai) return null;

  const transcript = qaPairs.map((qa) => `${qa.number}. ${qa.text}\nJavob: ${qa.answer}`).join("\n\n");

  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: getModelName(),
        contents: [{ role: "user", parts: [{ text: `${SUMMARY_PROMPT}\n\n=== SAVOL-JAVOBLAR ===\n${transcript}` }] }],
        config: { responseMimeType: "application/json" },
      }),
      SUMMARY_TIMEOUT_MS
    );
    const text = response.text?.trim();
    if (!text) {
      console.error("[gemini] xulosa bo'sh javob qaytardi", { model: getModelName() });
      return null;
    }
    return JSON.parse(text) as AiSummaryJson;
  } catch (err) {
    console.error("[gemini] xulosa generatsiya xatosi", {
      model: getModelName(),
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
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
