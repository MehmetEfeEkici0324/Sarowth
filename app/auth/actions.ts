"use server";

import { redirect } from "next/navigation";
import { assertSupabaseConfig } from "@/lib/supabase/config";
import { createEmailCode, hashEmailCode } from "@/lib/auth-codes";
import { sendVerificationCode } from "@/lib/mail/agent";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface AuthResult {
  error?: string;
}

function getSupabaseConfigError() {
  try {
    assertSupabaseConfig();
    return null;
  } catch {
    return "Supabase ortam değişkenleri eksik.";
  }
}

function getAdminConfigError() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return "SUPABASE_SERVICE_ROLE_KEY eksik.";
  }

  if (!process.env.EMAIL_CODE_SECRET && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return "EMAIL_CODE_SECRET eksik.";
  }

  return null;
}

async function storeAndSendVerificationCode(userId: string, email: string, fullName?: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  const code = createEmailCode();
  const codeHash = hashEmailCode(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabaseAdmin
    .from("email_verification_codes")
    .update({ consumed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("consumed_at", null);

  const { error: insertError } = await supabaseAdmin.from("email_verification_codes").insert({
    user_id: userId,
    email,
    code_hash: codeHash,
    expires_at: expiresAt,
  });

  if (insertError) {
    return { error: "Doğrulama kodu kaydedilemedi." };
  }

  const mail = await sendVerificationCode({ to: email, code, fullName });

  if (!mail.ok) {
    return { error: `Doğrulama e-postası gönderilemedi: ${mail.error}` };
  }

  return {};
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

  const adminConfigError = getAdminConfigError();
  if (adminConfigError) {
    return { error: adminConfigError };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (error || !data.user) {
    return { error: "Hesap oluşturulamadı. Bu e-posta zaten kayıtlı olabilir." };
  }

  await supabaseAdmin.from("profiles").upsert({
    id: data.user.id,
    email,
    full_name: fullName,
  });

  const sendResult = await storeAndSendVerificationCode(data.user.id, email, fullName);
  if (sendResult.error) {
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    return { error: sendResult.error };
  }

  redirect(`/auth/verify?email=${encodeURIComponent(email)}`);
}

export async function verifyEmailCode(_prevState: AuthResult, formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("token") ?? "").replace(/\s/g, "");

  if (!email || !token) {
    return { error: "E-postana gönderdiğimiz kodu gir." };
  }

  if (!/^\d{6}$/.test(token)) {
    return { error: "Kod 6 haneli olmalı." };
  }

  const configError = getSupabaseConfigError();
  if (configError) {
    return { error: configError };
  }

  const adminConfigError = getAdminConfigError();
  if (adminConfigError) {
    return { error: adminConfigError };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const tokenHash = hashEmailCode(token);
  const { data: codeRow, error: codeError } = await supabaseAdmin
    .from("email_verification_codes")
    .select("id, user_id, expires_at")
    .eq("email", email)
    .eq("code_hash", tokenHash)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (codeError || !codeRow) {
    return { error: "Bu kod geçersiz veya süresi dolmuş." };
  }

  if (new Date(codeRow.expires_at).getTime() < Date.now()) {
    return { error: "Kodun süresi dolmuş. Yeni kod iste." };
  }

  const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(codeRow.user_id, {
    email_confirm: true,
  });

  if (updateError || !updatedUser.user) {
    return { error: "Hesap doğrulanamadı. Tekrar dene." };
  }

  await supabaseAdmin.from("email_verification_codes").update({ consumed_at: new Date().toISOString() }).eq("id", codeRow.id);
  await supabaseAdmin.from("profiles").upsert({
    id: updatedUser.user.id,
    email: updatedUser.user.email ?? email,
    full_name: updatedUser.user.user_metadata.full_name ?? null,
  });

  redirect("/login");
}

export async function resendVerificationCode(_prevState: AuthResult, formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "E-posta adresi eksik." };
  }

  const configError = getSupabaseConfigError();
  if (configError) {
    return { error: configError };
  }

  const adminConfigError = getAdminConfigError();
  if (adminConfigError) {
    return { error: adminConfigError };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await supabaseAdmin.from("profiles").select("id, full_name").eq("email", email).single();

  if (profileError || !profile) {
    return { error: "Doğrulama bekleyen bir hesap bulunamadı." };
  }

  return storeAndSendVerificationCode(profile.id, email, profile.full_name ?? undefined);
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
