interface CheckEmailPageProps {}

export default function CheckEmailPage({}: CheckEmailPageProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#050505] px-5 py-12 text-white">
      <div className="max-w-md rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 text-center backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Verify</p>
        <h1 className="mt-3 text-3xl font-semibold">Emailini kontrol et</h1>
        <p className="mt-4 leading-7 text-slate-400">Supabase doğrulama linkini gönderdi. Linke tıkladığında session oluşacak ve dashboard alanına yönleneceksin.</p>
        <a href="/login" className="mt-7 inline-flex rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 px-6 py-3 font-semibold text-[#03110c]">Login'e dön</a>
      </div>
    </main>
  );
}
