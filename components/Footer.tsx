import { Github, Linkedin, Send, Twitter } from "lucide-react";

interface FooterProps {
  year?: number;
}

const columns = [
  { title: "Ürün", links: ["Ajanlar", "Döngü Motoru", "Trend Takibi", "Panel"] },
  { title: "Şirket", links: ["Vizyon", "Kariyer", "Basın", "İletişim"] },
  { title: "Kaynaklar", links: ["Dokümanlar", "API", "Rehberler", "Güvenlik"] },
  { title: "Yasal", links: ["Gizlilik", "Şartlar", "Uyumluluk", "Risk"] },
];

export function Footer({ year = new Date().getFullYear() }: FooterProps) {
  return (
    <footer id="alpha" className="border-t border-white/10 bg-[#050505] px-5 py-14 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_1.5fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-emerald-400/40 bg-emerald-400/10">
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
            </span>
            <span className="text-lg font-semibold tracking-[0.28em] text-white">SAROWTH</span>
          </div>
          <p className="mt-5 max-w-sm leading-7 text-slate-400">Disiplinli birikim yap. Fikirlerini ölçülü test et. Her finansal döngüyü daha akıllı bir büyüme adımına çevir.</p>
          <form className="mt-7 flex max-w-md overflow-hidden rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl">
            <label className="sr-only" htmlFor="alpha-email">E-posta adresi</label>
            <input id="alpha-email" type="email" placeholder="Erken erişime katıl" className="min-w-0 flex-1 bg-transparent px-5 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:ring-0" />
            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-200">
              <Send size={16} /> Katıl
            </button>
          </form>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="font-semibold text-white">{column.title}</h3>
              <div className="mt-4 grid gap-3">
                {column.links.map((link) => (
                  <a key={link} href="#top" className="text-sm text-slate-400 transition hover:text-white">
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-5 border-t border-white/10 pt-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {year} Sarowth. Bütçeden işe giden daha net döngüler için geliştirildi.</p>
        <div className="flex items-center gap-3">
          {[Twitter, Github, Linkedin].map((Icon, index) => (
            <a key={index} href="#top" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-emerald-400/40 hover:text-white" aria-label="Sosyal profil">
              <Icon size={18} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
