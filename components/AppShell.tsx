import { BarChart3, BriefcaseBusiness, LayoutDashboard, LogOut, UserRound, WalletCards } from "lucide-react";
import { signOut } from "@/app/auth/actions";

interface AppShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const navItems = [
  { label: "Genel Bakış", href: "/dashboard", icon: LayoutDashboard },
  { label: "Bütçem", href: "/budget", icon: WalletCards },
  { label: "E-Ticaret", href: "/ecommerce", icon: BriefcaseBusiness },
  { label: "Profil", href: "/profile", icon: UserRound },
];

export function AppShell({ title, subtitle, children }: AppShellProps) {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,0.14),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.14),transparent_30%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[17rem_1fr]">
        <aside className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <a href="/" className="flex items-center gap-3 rounded-2xl px-3 py-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10">
              <BarChart3 className="text-emerald-200" size={19} />
            </span>
            <span className="font-semibold tracking-[0.24em]">SAROWTH</span>
          </a>
          <nav className="mt-6 grid gap-2">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
                <item.icon size={18} /> {item.label}
              </a>
            ))}
          </nav>
          <form action={signOut} className="mt-6 border-t border-white/10 pt-4">
            <button type="submit" className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
              <LogOut size={18} /> Çıkış Yap
            </button>
          </form>
        </aside>

        <section className="min-w-0">
          <div className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Çalışma Alanı</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{title}</h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-400">{subtitle}</p>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
