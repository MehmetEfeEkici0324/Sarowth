# Supabase Auth Setup

Sarowth uses one sign-in method:

- Email + password for login.
- Email verification code during registration.
- Google and GitHub OAuth are intentionally removed from the UI.

## Email Sender

To send codes from `sarowth@gmail.com`, configure Supabase SMTP:

1. Open Supabase Dashboard.
2. Go to Authentication > Emails > SMTP Settings.
3. Enable custom SMTP.
4. Use your Gmail or Google Workspace SMTP credentials.
5. Set sender name to `Sarowth` and sender email to `sarowth@gmail.com`.

For Gmail, you usually need an app password, not the normal mailbox password.

## Email OTP Template

In Authentication > Emails, make sure the OTP template includes the token:

```txt
Your Sarowth verification code is {{ .Token }}
```

## URL Configuration

In Supabase, go to Authentication > URL Configuration and add redirect URLs:

```txt
http://localhost:3000/auth/callback
https://sarowth.com/auth/callback
```

If the production domain is different, replace `https://sarowth.com` with the real Vercel/custom domain.

## Disable OAuth Providers

In Supabase Authentication > Providers, keep Google and GitHub disabled unless you intentionally add them back later.
