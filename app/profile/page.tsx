import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { FormSubmit } from "@/components/FormSubmit";
import { updateProfile } from "@/app/workspace/actions";
import { getWorkspace } from "@/lib/auth";

interface ProfilePageProps {}

export const metadata: Metadata = {
  title: "Profil",
  description: "Sarowth profilini, birikim hedefini ve risk tercihini yönet.",
  robots: { index: false, follow: false },
};

export default async function ProfilePage({}: ProfilePageProps) {
  const { profile, user } = await getWorkspace();

  return (
    <AppShell title="Profil" subtitle="Sarowth'un bütçeni ve fırsatlarını gerçek risk konforuna göre değerlendirebilmesi için temel tercihlerini net tut.">
      <form action={updateProfile} className="grid gap-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-slate-300">
            Ad soyad
            <input name="fullName" defaultValue={profile?.full_name ?? ""} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10" />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            E-posta
            <input value={profile?.email ?? user.email ?? ""} readOnly className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-slate-400 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Aylık gelir
            <input name="monthlyIncome" type="number" min="0" step="1" defaultValue={profile?.monthly_income ?? 0} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10" />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Aylık birikim hedefi
            <input name="savingsGoal" type="number" min="0" step="1" placeholder="Örn. 5000" defaultValue={profile?.savings_goal && Number(profile.savings_goal) !== 500 ? profile.savings_goal : ""} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-blue-400/60 focus:ring-4 focus:ring-blue-400/10" />
          </label>
        </div>
        <label className="grid gap-2 text-sm text-slate-300">
          Risk tercihi
          <select name="riskPreference" defaultValue={profile?.risk_preference ?? "balanced"} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10">
            <option value="careful">Dikkatli · önce sermayeyi koru</option>
            <option value="balanced">Dengeli · küçük test et, hızlı öğren</option>
            <option value="bold">Cesur · daha yüksek fırsat ara</option>
          </select>
        </label>
        <div className="flex justify-end">
          <FormSubmit idleLabel="Profili kaydet" />
        </div>
      </form>
    </AppShell>
  );
}
