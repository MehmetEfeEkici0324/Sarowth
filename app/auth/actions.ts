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
    return "Supabase ortam değişkenleri eksik.";
  }
}

export async function signInWithEmail(_prevState: AuthResult, formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "E-posta ve şifreni gir." };
  }

  const configError = getSupabaseConfigError();
  if (configError) {
    return { error: configError };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "E-posta, şifre veya doğrulama durumu hatalı." };
  }

  redirect("/dashboard");
}

export async function signUpWithEmail(_prevState: AuthResult, formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !fullName || !password) {
    return { error: "Ad soyad, e-posta ve şifre gir." };
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
    return { error: "Hesap oluşturulamadı. Bu e-posta zaten kayıtlı olabilir." };
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
