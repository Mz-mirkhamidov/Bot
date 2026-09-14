// Bitta so'rovnoma javobini qisqa, o'qish oson matn fayl ko'rinishiga o'giradi.

export function formatSubmissionText(row) {
  const lines = [];
  lines.push("BOG'CHA: " + (row.org_name || "—"));
  lines.push("TURI: " + (row.org_type || "—"));
  lines.push("MANZIL: " + (row.org_addr || "—"));
  lines.push("TELEFON: " + (row.org_phone || "—"));
  lines.push("RAHBAR: " + (row.org_boss || "—"));
  lines.push("SANA: " + new Date(row.created_at).toLocaleString("uz-UZ"));
  lines.push("TO'LDIRILGAN: " + row.answered_count + " / " + row.total_count);
  lines.push("");
  lines.push("—".repeat(40));

  const answers = Array.isArray(row.answers) ? row.answers : [];
  for (const a of answers) {
    lines.push("");
    lines.push((a.n || "?") + ". " + (a.q || ""));
    lines.push(a.a && String(a.a).trim() ? String(a.a).trim() : "(javob berilmagan)");
  }

  return lines.join("\n");
}

export function safeFileName(name) {
  return (
    String(name || "sorovnoma")
      .replace(/[^\p{L}\p{N}_-]+/gu, "_")
      .slice(0, 40) || "sorovnoma"
  );
}
