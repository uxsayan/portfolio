import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { guess } = req.body as { guess?: string };
  if (typeof guess !== "string") {
    return res.status(400).json({ error: "Bad request" });
  }

  const secret = process.env.CASE_STUDY_PASSWORD;
  if (!secret) {
    // Not configured — fail closed, never leak anything
    return res.status(503).json({ error: "Not configured" });
  }

  const ok = guess === secret;
  // Return ONLY a boolean — never echo the secret, never hint at its value
  return res.status(200).json({ ok });
}
