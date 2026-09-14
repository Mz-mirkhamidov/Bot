// Supabase REST (PostgREST) uchun yengil wrapper — @supabase/supabase-js kutubxonasisiz.
// Faqat serverda (Vercel funksiyalarida) ishlatiladi, service_role kaliti brauzerga chiqmaydi.

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

export function supabaseConfigured() {
  return !!config();
}

export async function sbInsert(table, row) {
  const cfg = config();
  if (!cfg) throw new Error("supabase_not_configured");
  const r = await fetch(`${cfg.url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error("supabase_insert_failed " + r.status + " " + t.slice(0, 300));
  }
  const data = await r.json();
  return data[0];
}

export async function sbSelect(table, { select = "*", order, limit, offset, filter } = {}) {
  const cfg = config();
  if (!cfg) throw new Error("supabase_not_configured");
  const params = new URLSearchParams();
  params.set("select", select);
  if (order) params.set("order", order);
  if (limit) params.set("limit", String(limit));
  if (offset) params.set("offset", String(offset));
  if (filter) for (const [k, v] of Object.entries(filter)) params.set(k, v);

  const r = await fetch(`${cfg.url}/rest/v1/${table}?${params.toString()}`, {
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
    },
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error("supabase_select_failed " + r.status + " " + t.slice(0, 300));
  }
  return r.json();
}
