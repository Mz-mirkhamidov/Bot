import { requireAuth } from "../../lib/adminAuth.js";
import { sbSelect } from "../../lib/supabase.js";
import { formatSubmissionText, safeFileName } from "../../lib/formatSubmission.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }
  if (!requireAuth(req, res)) return;

  const id = req.query && req.query.id;
  if (!id) {
    res.status(400).json({ ok: false, error: "missing_id" });
    return;
  }

  try {
    const rows = await sbSelect("bogcha_submissions", {
      select: "*",
      filter: { id: "eq." + id },
      limit: 1,
    });
    if (!rows.length) {
      res.status(404).json({ ok: false, error: "not_found" });
      return;
    }
    const row = rows[0];
    const text = formatSubmissionText(row);
    const fileName = safeFileName(row.org_name) + ".txt";

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.status(200).send(text);
  } catch (e) {
    res.status(500).json({ ok: false, error: "export_failed" });
  }
}
