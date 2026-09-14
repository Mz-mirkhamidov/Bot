import { clearSessionCookie } from "../../lib/adminAuth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }
  res.setHeader("Set-Cookie", clearSessionCookie());
  res.status(200).json({ ok: true });
}
