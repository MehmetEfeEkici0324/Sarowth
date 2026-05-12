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
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email ve şifre zorunlu." };
  }

  const configError = getSupabaseConfigError();
  if (configError) {
    return { error: configError };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Giriş başarısız. Bilgilerini kontrol et." };
  }

  redirect("/dashboard");
}

export async function signUpWithEmail(_prevState: AuthResult, formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!email || !password || !fullName) {
    return { error: "Ad, email ve şifre zorunlu." };
  }

  if (password.length < 8) {
    return { error: "Şifre en az 8 karakter olmalı." };
  }

  const configError = getSupabaseConfigError();
  if (configError) {
    return { error: configError };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${getSiteUrl()}/auth/callback`,
    },
  });

  if (error) {
    return { error: "Kayıt oluşturulamadı. Bu email zaten kullanılıyor olabilir." };
  }

  redirect("/auth/check-email");
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
