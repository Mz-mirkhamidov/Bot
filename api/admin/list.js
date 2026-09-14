import { requireAuth } from "../../lib/adminAuth.js";
import { sbSelect } from "../../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }
  if (!requireAuth(req, res)) return;

  try {
    const rows = await sbSelect("bogcha_submissions", {
      select: "id,created_at,org_name,org_type,org_addr,org_phone,org_boss,answered_count,total_count",
      order: "created_at.desc",
      limit: 500,
    });
    res.status(200).json({ ok: true, rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: "list_failed" });
  }
}
