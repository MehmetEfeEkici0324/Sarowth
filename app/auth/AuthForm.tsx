"use client";

import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { signInWithEmail, signUpWithEmail } from "@/app/auth/actions";

interface AuthFormProps {
  mode: "login" | "signup";
  error?: string;
}

export function AuthForm({ mode, error }: AuthFormProps) {
  const isSignup = mode === "signup";
  const action = isSignup ? signUpWithEmail : signInWithEmail;
  const [state, formAction, isPending] = useActionState(action, { error });

  return (
    <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-[0_0_60px_rgba(16,185,129,0.08)] backdrop-blur-xl">
      <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Private Beta</p>
      <h1 className="mt-3 text-center text-3xl font-semibold tracking-[-0.04em] text-white">{isSignup ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-3 text-center text-sm leading-6 text-slate-400">
        {isSignup ? "Use your email and a password. We will send a one-time code to verify the account before you continue." : "Sign in with the email and password you verified during registration."}
      </p>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
        <span className="h-px flex-1 bg-white/10" /> Email account <span className="h-px flex-1 bg-white/10" />
      </div>

      <form action={formAction} className="grid gap-3">
        {isSignup ? (
          <input name="fullName" type="text" placeholder="Full name" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10" />
        ) : null}
        <input name="email" type="email" placeholder="Email" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10" />
        <input name="password" type="password" placeholder="Password" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60 focus:ring-4 focus:ring-blue-400/10" />
        {state.error ? <p className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{state.error}</p> : null}
        <button disabled={isPending} type="submit" className="mt-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 px-5 py-3 font-semibold text-[#03110c] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60">
          <span className="inline-flex items-center justify-center gap-2">
            <ShieldCheck size={17} /> {isPending ? "Please wait..." : isSignup ? "Send verification code" : "Sign in"}
          </span>
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        {isSignup ? "Already scaling?" : "New to Sarowth?"} {" "}
        <a href={isSignup ? "/login" : "/signup"} className="font-semibold text-emerald-300 hover:text-emerald-200">
          {isSignup ? "Login" : "Create account"}
        </a>
      </p>
    </div>
  );
}
