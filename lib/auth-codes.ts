import { createHash, randomInt } from "node:crypto";

export function createEmailCode() {
  return String(randomInt(100000, 1000000));
}

export function hashEmailCode(code: string) {
  const secret = process.env.EMAIL_CODE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error("EMAIL_CODE_SECRET veya SUPABASE_SERVICE_ROLE_KEY eksik.");
  }

  return createHash("sha256").update(`${code}:${secret}`).digest("hex");
}
