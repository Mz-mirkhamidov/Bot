// Foydalanish: npm run seed
// src/data/questions.ts'dagi savollarni Supabase bazasiga yozadi (upsert).

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { questionnaire, seedBlocks } from "../src/data/questions";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Xato: NEXT_PUBLIC_SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY .env.local faylida to'ldirilishi kerak."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log(`So'rovnoma seed qilinmoqda: ${questionnaire.code}`);

  const { data: q, error: qError } = await supabase
    .from("questionnaires")
    .upsert(
      {
        code: questionnaire.code,
        title: questionnaire.title,
        description: questionnaire.description,
        version: 1,
        is_active: true,
      },
      { onConflict: "code" }
    )
    .select()
    .single();

  if (qError || !q) {
    throw qError ?? new Error("Questionnaire yaratilmadi");
  }

  console.log(`Questionnaire: ${q.id}`);

  for (const [blockIndex, block] of seedBlocks.entries()) {
    const { data: b, error: bError } = await supabase
      .from("question_blocks")
      .upsert(
        {
          questionnaire_id: q.id,
          code: block.code,
          title: block.title,
          description: block.description ?? null,
          order_index: blockIndex,
        },
        { onConflict: "questionnaire_id,code" }
      )
      .select()
      .single();

    if (bError || !b) {
      throw bError ?? new Error(`Blok yaratilmadi: ${block.code}`);
    }

    console.log(`  Blok ${block.code} — ${block.title} (${block.questions.length} savol)`);

    for (const [qIndex, question] of block.questions.entries()) {
      const { error: qsError } = await supabase.from("questions").upsert(
        {
          block_id: b.id,
          number: question.number,
          order_index: qIndex,
          text: question.text,
          hint: question.hint ?? null,
          type: question.type,
          options: question.options ?? null,
          is_required: false,
          allow_voice: question.allowVoice ?? true,
          probes: question.probes ?? null,
          is_key: question.isKey ?? false,
        },
        { onConflict: "block_id,order_index" }
      );

      if (qsError) {
        throw qsError;
      }
    }
  }

  const totalQuestions = seedBlocks.reduce((sum, b) => sum + b.questions.length, 0);
  console.log(`Tayyor. ${seedBlocks.length} ta blok, ${totalQuestions} ta savol yozildi.`);
}

main().catch((err) => {
  console.error("Seed xato bilan tugadi:", err);
  process.exit(1);
});
