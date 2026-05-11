import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface DashboardPageProps {}

export default async function DashboardPage({}: DashboardPageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", userData.user.id).single();

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">{profile?.full_name ?? "Sarowth Agent"}</h1>
            <p className="mt-2 text-slate-400">{profile?.email ?? userData.user.email}</p>
          </div>
          <form action={signOut}>
            <button type="submit" className="rounded-full border border-white/10 px-5 py-3 text-sm text-white transition hover:bg-white/10">Sign out</button>
          </form>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Cycle capital", "$0", "Yeni kayıt için başlangıç bakiyesi"],
            ["Guardian status", "Ready", "Harcama analizi için veri bekliyor"],
            ["Hunter status", "Ready", "Trend taraması için ajan hazır"],
          ].map(([label, value, detail]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-3 text-3xl font-semibold">{value}</p>
              <p className="mt-3 text-sm leading-6 text-slate-500">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
