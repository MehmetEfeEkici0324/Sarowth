"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getWorkspace } from "@/lib/auth";

const allowedBudgetCategories: Record<string, string[]> = {
  income: ["Maaş", "Ek iş", "Satış geliri", "İade", "Diğer gelir"],
  expense: ["Market", "Yemek", "Ulaşım", "Kira", "Fatura", "Abonelik", "E-Ticaret / Giyim", "Sağlık", "Eğitim", "Borç", "Diğer gider"],
  saving: ["Acil durum", "Yatırım bütçesi", "Ürün test bütçesi", "Birikim hesabı", "Diğer birikim"],
};

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await getWorkspace();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const monthlyIncome = Number(formData.get("monthlyIncome") ?? 0);
  const savingsGoal = Number(formData.get("savingsGoal") ?? 0);
  const riskPreference = String(formData.get("riskPreference") ?? "balanced");

  if (!fullName) {
    return;
  }

  if (!Number.isFinite(monthlyIncome) || !Number.isFinite(savingsGoal)) {
    return;
  }

  const { error } = await supabase.from("profiles").update({
    full_name: fullName,
    monthly_income: monthlyIncome,
    savings_goal: savingsGoal,
    risk_preference: riskPreference,
  }).eq("id", user.id);

  if (error) return;

  revalidatePath("/profile");
  revalidatePath("/dashboard");
}

export async function addBudgetEntry(formData: FormData) {
  const { supabase, user } = await getWorkspace();
  const label = String(formData.get("label") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const entryType = String(formData.get("entryType") ?? "expense");
  const amount = Number(formData.get("amount") ?? 0);

  const allCategories = Object.values(allowedBudgetCategories).flat();

  if (!label || !allowedBudgetCategories[entryType] || !allCategories.includes(category) || !Number.isFinite(amount) || amount <= 0) {
    return;
  }

  const { error } = await supabase.from("budget_entries").insert({
    user_id: user.id,
    label,
    category,
    amount,
    entry_type: entryType,
  });

  if (error) return;

  revalidatePath("/budget");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

export async function addEcommerceIdea(formData: FormData) {
  const { supabase, user } = await getWorkspace();
  const productName = String(formData.get("productName") ?? "").trim();
  const audience = String(formData.get("audience") ?? "").trim();
  const demandScore = Number(formData.get("demandScore") ?? 50);
  const estimatedMargin = Number(formData.get("estimatedMargin") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim();

  if (!productName || !audience) {
    return;
  }

  const { error } = await supabase.from("ecommerce_ideas").insert({
    user_id: user.id,
    product_name: productName,
    audience,
    demand_score: Math.max(0, Math.min(100, demandScore)),
    estimated_margin: Math.max(0, estimatedMargin),
    notes,
  });

  if (error) return;

  revalidatePath("/ecommerce");
  revalidatePath("/dashboard");
}

export async function goToDashboard() {
  redirect("/dashboard");
}
