"use client";

import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { resendVerificationCode, verifyEmailCode } from "@/app/auth/actions";

interface VerifyCodeFormProps {
  email: string;
}

export function VerifyCodeForm({ email }: VerifyCodeFormProps) {
  const [state, formAction, isPending] = useActionState(verifyEmailCode, { error: undefined });
  const [resendState, resendAction, isResending] = useActionState(resendVerificationCode, { error: undefined });

  return (
    <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-[0_0_60px_rgba(16,185,129,0.08)] backdrop-blur-xl">
      <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Gelen kutunu kontrol et</p>
      <h1 className="mt-3 text-center text-3xl font-semibold tracking-[-0.04em] text-white">6 haneli kodu gir</h1>
      <p className="mt-3 text-center text-sm leading-6 text-slate-400">
        <span className="text-slate-200">{email}</span> adresine tek kullanımlık doğrulama kodu gönderdik. Doğruladıktan sonra şifrenle giriş yapabilirsin.
      </p>
      <form action={formAction} className="mt-6 grid gap-3">
        <input type="hidden" name="email" value={email} />
        <input name="token" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="000000" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-center font-mono text-3xl tracking-[0.35em] text-white outline-none transition placeholder:text-slate-700 focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10" />
        {state.error ? <p className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{state.error}</p> : null}
        <button disabled={isPending} type="submit" className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 px-5 py-3 font-semibold text-[#03110c] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60">
          <ShieldCheck size={17} /> {isPending ? "Doğrulanıyor..." : "Doğrula ve devam et"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        E-posta yanlış mı? <a href="/signup" className="font-semibold text-emerald-300 hover:text-emerald-200">Baştan başla</a>
      </p>
      <form action={resendAction} className="mt-4 text-center">
        <input type="hidden" name="email" value={email} />
        <button disabled={isResending} type="submit" className="text-sm font-semibold text-emerald-300 transition hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-60">
          {isResending ? "Tekrar gönderiliyor..." : "Yeni kod gönder"}
        </button>
        {resendState.error ? <p className="mt-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{resendState.error}</p> : null}
      </form>
    </div>
  );
}
