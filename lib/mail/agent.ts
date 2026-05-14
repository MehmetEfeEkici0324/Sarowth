interface SendVerificationCodeInput {
  to: string;
  code: string;
  fullName?: string;
}

interface MailResult {
  ok: boolean;
  error?: string;
}

export async function sendVerificationCode({ to, code, fullName }: SendVerificationCodeInput): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? "Sarowth <verify@sarowth.com>";

  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY eksik." };
  }

  const name = fullName?.trim() || "merhaba";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Sarowth doğrulama kodun",
      text: `Merhaba ${name},\n\nSarowth doğrulama kodun: ${code}. Bu kod 10 dakika içinde geçerliliğini kaybeder.\n\nBu işlemi sen başlatmadıysan bu e-postayı yok sayabilirsin.`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;background:#050505;color:#f8fafc;padding:32px;border-radius:24px">
          <p style="color:#10b981;letter-spacing:0.18em;text-transform:uppercase;font-size:12px;font-weight:700">Sarowth doğrulama</p>
          <h1 style="font-size:28px;margin:12px 0 8px">Kayıt kodun</h1>
          <p style="color:#cbd5e1;line-height:1.6">Merhaba ${name}, Sarowth hesabını doğrulamak için bu kodu kullan. Kod 10 dakika içinde geçerliliğini kaybeder.</p>
          <div style="font-size:36px;letter-spacing:0.35em;font-weight:800;background:#0f172a;border:1px solid rgba(255,255,255,0.12);border-radius:18px;padding:18px 22px;margin:24px 0;text-align:center;color:#ffffff">${code}</div>
          <p style="color:#64748b;font-size:13px;line-height:1.6">Bu işlemi sen başlatmadıysan bu e-postayı güvenle yok sayabilirsin.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    return { ok: false, error: message };
  }

  return { ok: true };
}
