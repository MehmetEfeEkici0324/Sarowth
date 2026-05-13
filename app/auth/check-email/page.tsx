interface CheckEmailPageProps {}

export default function CheckEmailPage({}: CheckEmailPageProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#050505] px-5 py-12 text-white">
      <div className="max-w-md rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 text-center backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Verify</p>
        <h1 className="mt-3 text-3xl font-semibold">Check your email</h1>
        <p className="mt-4 leading-7 text-slate-400">Use the code we sent to finish sign-up. If this page appears after an older email link, start again and request a fresh code.</p>
        <a href="/signup" className="mt-7 inline-flex rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 px-6 py-3 font-semibold text-[#03110c]">Request a new code</a>
      </div>
    </main>
  );
}
