"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  links?: Array<{ label: string; href: string }>;
  userName?: string | null;
}

const defaultLinks = [
  { label: "Nasıl Çalışır", href: "#agents" },
  { label: "Döngü", href: "#cycles" },
  { label: "Trendler", href: "#tracker" },
  { label: "Kayıt", href: "#alpha" },
];

const signedInLinks = [
  { label: "Agentlar", href: "/#agents" },
  { label: "Piyasa", href: "/#market" },
  { label: "Haberler", href: "/#news" },
  { label: "Bütçe", href: "/#spending" },
  { label: "Asistan", href: "/#assistant" },
];

export function Navbar({ links = defaultLinks, userName }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isSignedIn = Boolean(userName);
  const navLinks = isSignedIn ? signedInLinks : links;
  const navLinkClass = isSignedIn
    ? "rounded-full border border-emerald-400/20 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-emerald-300/45 hover:bg-emerald-400/10 hover:text-white"
    : "text-sm text-slate-300 transition hover:text-white";
  const mobileNavLinkClass = isSignedIn
    ? "block rounded-2xl border border-emerald-400/20 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-emerald-300/45 hover:bg-emerald-400/10 hover:text-white"
    : "block rounded-2xl px-4 py-3 text-sm text-slate-200 hover:bg-white/10";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050505]/70 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="/" className="group flex items-center gap-3" aria-label="Sarowth ana sayfa">
          <span className="grid h-9 w-9 place-items-center rounded-2xl border border-emerald-400/40 bg-emerald-400/10 shadow-[0_0_35px_rgba(16,185,129,0.2)]">
            <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.9)]" />
          </span>
          <span className="text-lg font-semibold tracking-[0.28em] text-white">SAROWTH</span>
        </a>

        <div className={cn("hidden items-center md:flex", isSignedIn ? "gap-2" : "gap-8")}>
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className={navLinkClass}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isSignedIn ? (
            <>
              <a href="/dashboard" className="rounded-full border border-blue-400/30 bg-blue-400/10 px-5 py-2 text-sm font-semibold text-blue-50 shadow-[0_0_24px_rgba(59,130,246,0.14),inset_0_1px_0_rgba(255,255,255,0.1)] transition hover:border-blue-300/55 hover:bg-blue-400/15 hover:text-white">
                Panel
              </a>
              <a href="/profile" className="rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 px-5 py-2 text-sm font-semibold text-[#03110c] shadow-[0_0_28px_rgba(59,130,246,0.24)] transition hover:scale-[1.02]">
                {userName}
              </a>
            </>
          ) : (
            <>
              <a href="/login" className="rounded-full px-5 py-2 text-sm text-slate-200 transition hover:bg-white/10">
                Giriş Yap
              </a>
              <a href="/signup" className="rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 px-5 py-2 text-sm font-semibold text-[#03110c] shadow-[0_0_28px_rgba(59,130,246,0.24)] transition hover:scale-[1.02]">
                Kayıt Ol
              </a>
            </>
          )}
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white md:hidden"
          aria-label="Menüyü aç veya kapat"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      <div className={cn("grid transition-all duration-300 md:hidden", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          <div className="mx-5 mb-5 grid gap-2 rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className={mobileNavLinkClass} onClick={() => setIsOpen(false)}>
                {link.label}
              </a>
            ))}
            <div className="mt-3 grid gap-3">
              {isSignedIn ? (
                <>
                  <a href="/dashboard" className="rounded-full border border-blue-400/30 bg-blue-400/10 px-5 py-3 text-center text-sm font-semibold text-blue-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                    Panel
                  </a>
                  <a href="/profile" className="rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 px-5 py-3 text-center text-sm font-semibold text-[#03110c]">
                    {userName}
                  </a>
                </>
              ) : (
                <>
                  <a href="/login" className="rounded-full border border-white/10 px-5 py-3 text-center text-sm text-white">
                    Giriş Yap
                  </a>
                  <a href="/signup" className="rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 px-5 py-3 text-center text-sm font-semibold text-[#03110c]">
                    Kayıt Ol
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
