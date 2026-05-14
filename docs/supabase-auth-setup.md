# Supabase Auth Setup

Sarowth uses one sign-in method and its own mail sender agent:

- Email + password for login.
- Custom email verification code during registration.
- Google and GitHub OAuth are intentionally removed from the UI.

## Mail Sender Agent

The app now sends verification codes through `lib/mail/agent.ts` using the Resend API. This avoids relying on Supabase's built-in email templates.

Required Vercel environment variables:

```txt
RESEND_API_KEY=your-resend-api-key
MAIL_FROM=Sarowth <verify@sarowth.com>
EMAIL_CODE_SECRET=long-random-secret
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

Recommended sender setup:

1. Create a Resend account.
2. Add and verify your sending domain, ideally `sarowth.com`.
3. Add the DNS records Resend gives you.
4. Use `MAIL_FROM=Sarowth <verify@sarowth.com>` after the domain is verified.

If you insist on sending directly from `sarowth@gmail.com`, configure Gmail SMTP in a transactional email provider that supports it. Direct Gmail SMTP is fragile on serverless platforms and can fail due to Google security checks.

## Old Supabase SMTP Option

Supabase SMTP is no longer required for the custom code flow. If you still want Supabase emails for other flows, configure it here:

1. Open Supabase Dashboard.
2. Go to Authentication > Emails > SMTP Settings.
3. Enable custom SMTP.
4. Use your Gmail or Google Workspace SMTP credentials.
5. Set sender name to `Sarowth` and sender email to `sarowth@gmail.com`.

For Gmail, you usually need an app password, not the normal mailbox password.

## Supabase Built-in Email Template

This is not used by the custom mail sender agent, but if you re-enable Supabase's built-in email confirmation, make sure the confirmation template includes the token:

```txt
Your Sarowth verification code is {{ .Token }}
```

If Supabase is still sending a clickable link instead of a token, update the "Confirm signup" template and include `{{ .Token }}` visibly in the email body.

## Required Supabase Auth Settings

In Authentication > Providers > Email:

- Enable Email provider.
- Confirm email can stay enabled, but the app confirms users via the service-role admin API after custom code verification.
- Keep Secure email change enabled.
- For this app flow, users register with email + password, verify the email code, then log in with email + password.

If emails do not arrive with the custom mail sender:

- Check Vercel Function logs for the exact Resend error.
- Check Resend Logs.
- Make sure `RESEND_API_KEY` is set in Vercel production.
- Make sure `MAIL_FROM` uses a verified Resend domain.
- Check spam/promotions folder.
- Wait one minute before requesting another code if the provider rate limits you.

## URL Configuration

In Supabase, go to Authentication > URL Configuration and add redirect URLs:

```txt
http://localhost:3000/auth/callback
https://sarowth.com/auth/callback
```

If the production domain is different, replace `https://sarowth.com` with the real Vercel/custom domain.

## Disable OAuth Providers

In Supabase Authentication > Providers, keep Google and GitHub disabled unless you intentionally add them back later.
