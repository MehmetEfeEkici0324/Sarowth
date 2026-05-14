import { createHash, randomInt } from "node:crypto";

export function createEmailCode() {
  return String(randomInt(100000, 1000000));
}

export function hashEmailCode(code: string) {
  const secret = process.env.EMAIL_CODE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error("Missing EMAIL_CODE_SECRET or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createHash("sha256").update(`${code}:${secret}`).digest("hex");
}
