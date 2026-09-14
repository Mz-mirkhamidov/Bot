import { checkPassword, createSessionCookie } from "../../lib/adminAuth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  if (!process.env.ADMIN_PASSWORD) {
    res.status(200).json({ ok: false, error: "not_configured" });
    return;
  }

  let data = req.body;
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch { data = null; }
  }
  const password = data && data.password;

  if (!checkPassword(password)) {
    res.status(401).json({ ok: false, error: "wrong_password" });
    return;
  }

  res.setHeader("Set-Cookie", createSessionCookie());
  res.status(200).json({ ok: true });
}
