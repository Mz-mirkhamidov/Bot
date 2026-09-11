"use client";

import { useState } from "react";
import { useSafeRawInitData } from "@/lib/useTelegramInitData";
import { callApi } from "@/lib/apiClient";
import { formatDate } from "@/lib/format";
import type { AdminSessionSummary, AiSummaryJson, SummarySheetManual } from "@/types/admin";

const HYPOTHESIS_LABELS: Record<string, string> = {
  subsidy: "Subsidiya",
  documents: "Hujjatlar",
  occupancy: "Bandlik",
  none: "Hech biri",
};

const SIGNAL_LABELS: Record<string, string> = { strong: "kuchli", weak: "kuchsiz", none: "yo'q" };

export function SummarySection({ sessionId, summary }: { sessionId: string; summary: AdminSessionSummary }) {
  const { raw: initDataRaw } = useSafeRawInitData();
  const [aiSummary, setAiSummary] = useState<AiSummaryJson | null>(summary.aiSummary);
  const [aiGeneratedAt, setAiGeneratedAt] = useState<string | null>(summary.aiGeneratedAt);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const [manual, setManual] = useState<SummarySheetManual>(summary.manual);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    setGenError(null);
    const { ok, json } = await callApi<{ summary: AiSummaryJson; generatedAt: string }>(
      "/api/admin/summary",
      initDataRaw,
      "POST",
      { sessionId }
    );
    setGenerating(false);
    if (!ok || !json) {
      setGenError("Xulosa chiqarib bo'lmadi. Javoblar yetarli emas yoki Gemini xato qaytardi.");
      return;
    }
    setAiSummary(json.summary);
    setAiGeneratedAt(json.generatedAt);
  }

  async function handleSaveManual() {
    setSaving(true);
    setSaveMessage(null);
    const { ok } = await callApi(`/api/admin/session/${sessionId}/summary`, initDataRaw, "POST", {
      biggestPain: manual.biggestPain,
      hoursPerMonth: manual.hoursPerMonth,
      moneyLost12m: manual.moneyLost12m,
      currentSolution: manual.currentSolution,
      paidBefore: manual.paidBefore,
      paidBeforeAmount: manual.paidBeforeAmount,
      hypothesisConfirmed: manual.hypothesisConfirmed,
      referralOk: manual.referralOk,
      telegramGroup: manual.telegramGroup,
      surprise: manual.surprise,
    });
    setSaving(false);
    setSaveMessage(ok ? "Saqlandi" : "Saqlab bo'lmadi");
  }

  return (
    <div style={{ marginTop: 28, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Xulosa</div>

      <button type="button" onClick={handleGenerate} disabled={generating} style={primaryButtonStyle}>
        {generating ? "Yaratilmoqda..." : aiSummary ? "AI xulosani qayta chiqarish" : "AI xulosa chiqarish"}
      </button>
      {genError && <div style={{ fontSize: 13, color: "var(--danger, #e5484d)", marginTop: 6 }}>{genError}</div>}

      {aiSummary && (
        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            fontSize: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {aiGeneratedAt && (
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Yaratildi: {formatDate(aiGeneratedAt)}
            </div>
          )}

          <Field label="Eng katta muammo">{aiSummary.biggest_pain || "—"}</Field>

          {aiSummary.pain_evidence?.length > 0 && (
            <Field label="Dalillar">
              <ul style={listStyle}>
                {aiSummary.pain_evidence.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </Field>
          )}

          {aiSummary.numbers_mentioned?.length > 0 && (
            <Field label="Aytilgan raqamlar">
              <ul style={listStyle}>
                {aiSummary.numbers_mentioned.map((n, i) => (
                  <li key={i}>
                    {n.what}: <b>{n.value}</b> (savol {n.question})
                  </li>
                ))}
              </ul>
            </Field>
          )}

          {aiSummary.time_costs?.length > 0 && (
            <Field label="Vaqt sarfi">
              <ul style={listStyle}>
                {aiSummary.time_costs.map((t, i) => (
                  <li key={i}>
                    {t.activity} — {t.hours_per_month} soat/oy
                  </li>
                ))}
              </ul>
            </Field>
          )}

          <Field label="Xavf ostidagi pul">{aiSummary.money_at_risk || "—"}</Field>
          <Field label="Avval to'lagan">{aiSummary.already_paid_for || "—"}</Field>

          <Field label="Gipoteza signallari">
            {Object.entries(aiSummary.hypothesis_signals ?? {})
              .map(([k, v]) => `${HYPOTHESIS_LABELS[k] ?? k}: ${SIGNAL_LABELS[v] ?? v}`)
              .join(" · ")}
          </Field>

          {aiSummary.green_flags?.length > 0 && (
            <Field label="🟢 Yaxshi belgilar">
              <ul style={listStyle}>
                {aiSummary.green_flags.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </Field>
          )}

          {aiSummary.red_flags?.length > 0 && (
            <Field label="🔴 Xavotirli belgilar">
              <ul style={listStyle}>
                {aiSummary.red_flags.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </Field>
          )}

          {aiSummary.quotes_worth_keeping?.length > 0 && (
            <Field label="Saqlash kerak bo'lgan iqtiboslar">
              <ul style={listStyle}>
                {aiSummary.quotes_worth_keeping.map((q, i) => (
                  <li key={i} style={{ fontStyle: "italic" }}>
                    &ldquo;{q}&rdquo;
                  </li>
                ))}
              </ul>
            </Field>
          )}

          {aiSummary.missing_info?.length > 0 && (
            <Field label="Aniqlanmagan / qayta so'rash kerak">
              <ul style={listStyle}>
                {aiSummary.missing_info.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </Field>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        style={{ ...secondaryButtonStyle, marginTop: 14 }}
      >
        {showForm ? "Xulosa varaqasini yashirish" : "Xulosa varaqasi (qo'lda to'ldirish)"}
      </button>

      {showForm && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          <LabeledTextarea
            label="Eng katta muammo"
            value={manual.biggestPain ?? ""}
            onChange={(v) => setManual((m) => ({ ...m, biggestPain: v || null }))}
          />
          <LabeledNumber
            label="Oyiga necha soat sarflanadi"
            value={manual.hoursPerMonth}
            onChange={(v) => setManual((m) => ({ ...m, hoursPerMonth: v }))}
          />
          <LabeledNumber
            label="12 oyda yo'qotilgan pul (so'm)"
            value={manual.moneyLost12m}
            onChange={(v) => setManual((m) => ({ ...m, moneyLost12m: v }))}
          />
          <LabeledTextarea
            label="Hozirgi yechim"
            value={manual.currentSolution ?? ""}
            onChange={(v) => setManual((m) => ({ ...m, currentSolution: v || null }))}
          />
          <LabeledBool
            label="Avval shunga o'xshash narsaga to'lagan"
            value={manual.paidBefore}
            onChange={(v) => setManual((m) => ({ ...m, paidBefore: v }))}
          />
          {manual.paidBefore && (
            <LabeledNumber
              label="Qancha to'lagan (so'm)"
              value={manual.paidBeforeAmount}
              onChange={(v) => setManual((m) => ({ ...m, paidBeforeAmount: v }))}
            />
          )}
          <LabeledSelect
            label="Qaysi gipoteza tasdiqlandi"
            value={manual.hypothesisConfirmed ?? ""}
            options={[
              { value: "", label: "—" },
              { value: "subsidy", label: "Subsidiya" },
              { value: "documents", label: "Hujjatlar" },
              { value: "occupancy", label: "Bandlik" },
              { value: "none", label: "Hech biri" },
            ]}
            onChange={(v) => setManual((m) => ({ ...m, hypothesisConfirmed: v || null }))}
          />
          <LabeledBool
            label="Boshqalarga tavsiya qilishga rozi"
            value={manual.referralOk}
            onChange={(v) => setManual((m) => ({ ...m, referralOk: v }))}
          />
          <LabeledTextarea
            label="Telegram guruh (bo'lsa)"
            value={manual.telegramGroup ?? ""}
            onChange={(v) => setManual((m) => ({ ...m, telegramGroup: v || null }))}
            rows={1}
          />
          <LabeledTextarea
            label="Kutilmagan / qiziqarli narsa"
            value={manual.surprise ?? ""}
            onChange={(v) => setManual((m) => ({ ...m, surprise: v || null }))}
          />

          <button type="button" onClick={handleSaveManual} disabled={saving} style={primaryButtonStyle}>
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
          {saveMessage && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{saveMessage}</div>}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 2 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

function LabeledTextarea({
  label,
  value,
  onChange,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <textarea style={{ ...inputStyle, resize: "vertical" }} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function LabeledNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <input
        style={inputStyle}
        type="text"
        inputMode="decimal"
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.]/g, "");
          onChange(raw === "" ? null : Number(raw));
        }}
      />
    </div>
  );
}

function LabeledBool({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { v: true, text: "Ha" },
          { v: false, text: "Yo'q" },
        ].map((opt) => (
          <button
            key={String(opt.v)}
            type="button"
            onClick={() => onChange(value === opt.v ? null : opt.v)}
            style={{
              flex: 1,
              minHeight: 40,
              borderRadius: "var(--radius)",
              border: `1px solid ${value === opt.v ? "var(--accent)" : "var(--border)"}`,
              background: value === opt.v ? "var(--accent)" : "var(--bg-secondary)",
              color: value === opt.v ? "var(--button-text)" : "var(--text)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
}

function LabeledSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <select style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const listStyle: React.CSSProperties = { margin: "4px 0 0", paddingLeft: 18 };

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-muted)",
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 16,
  padding: "10px 12px",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  background: "var(--bg-secondary)",
  color: "var(--text)",
  outline: "none",
};

const primaryButtonStyle: React.CSSProperties = {
  minHeight: 44,
  padding: "0 16px",
  width: "100%",
  borderRadius: "var(--radius)",
  border: "none",
  background: "var(--button)",
  color: "var(--button-text)",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  minHeight: 44,
  padding: "0 16px",
  width: "100%",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--text)",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
