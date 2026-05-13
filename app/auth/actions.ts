"use server";

import { redirect } from "next/navigation";
import { assertSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface AuthResult {
  error?: string;
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function getSupabaseConfigError() {
  try {
    assertSupabaseConfig();
    return null;
  } catch {
    return "Supabase env eksik. Vercel Environment Variables alanına NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY eklenmeli.";
  }
}

export async function signInWithEmail(_prevState: AuthResult, formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Enter your email address." };
  }

  const configError = getSupabaseConfigError();
  if (configError) {
    return { error: configError };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      shouldCreateUser: false,
    },
  });

  if (error) {
    return { error: "We could not send a login code. Check the email or create an account first." };
  }

  redirect(`/auth/verify?email=${encodeURIComponent(email)}&flow=login`);
}

export async function signUpWithEmail(_prevState: AuthResult, formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!email || !fullName) {
    return { error: "Enter your name and email address." };
  }

  const configError = getSupabaseConfigError();
  if (configError) {
    return { error: configError };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { error: "We could not send a verification code. Try again in a moment." };
  }

  redirect(`/auth/verify?email=${encodeURIComponent(email)}&flow=signup`);
}

export async function verifyEmailCode(_prevState: AuthResult, formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("token") ?? "").replace(/\s/g, "");

  if (!email || !token) {
    return { error: "Enter the code we sent to your email." };
  }

  if (!/^\d{6}$/.test(token)) {
    return { error: "The code must be 6 digits." };
  }

  const configError = getSupabaseConfigError();
  if (configError) {
    return { error: configError };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });

  if (error || !data.user) {
    return { error: "That code is invalid or expired." };
  }

  await supabase.from("profiles").upsert({
    id: data.user.id,
    email: data.user.email ?? email,
    full_name: data.user.user_metadata.full_name ?? null,
  });

  redirect("/dashboard");
}

export async function signOut() {
  const configError = getSupabaseConfigError();
  if (configError) {
    redirect("/");
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
