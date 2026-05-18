"use client";

import { useState } from "react";
import { FormSubmit } from "@/components/FormSubmit";
import { addBudgetEntry } from "@/app/workspace/actions";

const entryTypes = [
  { value: "expense", label: "Gider", helper: "Düzenli veya tek seferlik harcamalar", tone: "from-rose-400/20 to-orange-400/10 border-rose-300/25 text-rose-50" },
  { value: "income", label: "Gelir", helper: "Maaş, satış ve ek kazançlar", tone: "from-emerald-400/20 to-teal-400/10 border-emerald-300/25 text-emerald-50" },
  { value: "saving", label: "Birikim", helper: "Ayırdığın güvenli bütçe", tone: "from-blue-400/20 to-cyan-400/10 border-blue-300/25 text-blue-50" },
] as const;

const categories = {
  income: ["Maaş", "Ek iş", "Satış geliri", "İade", "Diğer gelir"],
  expense: ["Market", "Yemek", "Ulaşım", "Kira", "Fatura", "Abonelik", "E-Ticaret / Giyim", "Sağlık", "Eğitim", "Borç", "Diğer gider"],
  saving: ["Acil durum", "Yatırım bütçesi", "Ürün test bütçesi", "Birikim hesabı", "Diğer birikim"],
};

type EntryType = keyof typeof categories;

export function BudgetEntryForm() {
  const [entryType, setEntryType] = useState<EntryType>("expense");
  const [category, setCategory] = useState(categories.expense[0]);

  function selectEntryType(nextType: EntryType) {
    setEntryType(nextType);
    setCategory(categories[nextType][0]);
  }

  const selectedType = entryTypes.find((type) => type.value === entryType) ?? entryTypes[0];

  return (
    <form action={addBudgetEntry} className="grid gap-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
      <div>
        <h2 className="text-2xl font-semibold">Yeni bütçe kaydı</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">Önce kayıt türünü seç. Kategori listesi sadece o türe ait seçenekleri gösterir.</p>
      </div>

      <input type="hidden" name="entryType" value={entryType} />
      <input type="hidden" name="category" value={category} />

      <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Kayıt türü">
        {entryTypes.map((type) => {
          const selected = type.value === entryType;
          return (
            <button
              key={type.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => selectEntryType(type.value)}
              className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${selected ? `bg-gradient-to-br ${type.tone}` : "border-white/10 bg-black/25 text-slate-400 hover:border-white/20"}`}
            >
              <span className="block text-base font-semibold">{type.label}</span>
              <span className="mt-1 block text-xs leading-5 opacity-75">{type.helper}</span>
            </button>
          );
        })}
      </div>

      <div className={`rounded-3xl border bg-gradient-to-br p-4 ${selectedType.tone}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{selectedType.label} kategorisi</p>
            <p className="mt-1 text-xs opacity-70">Sadece {selectedType.label.toLocaleLowerCase("tr-TR")} kategorileri gösteriliyor.</p>
          </div>
          <span className="rounded-full bg-black/20 px-3 py-1 text-xs font-medium">{categories[entryType].length} seçenek</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {categories[entryType].map((item) => {
            const selected = item === category;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-2xl border px-3 py-3 text-left text-sm font-medium transition ${selected ? "border-white/50 bg-white text-slate-950 shadow-lg shadow-black/20" : "border-white/10 bg-black/20 text-white/80 hover:border-white/30 hover:bg-black/30"}`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2">
        <p className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 px-4 py-3 text-sm leading-6 text-emerald-50">Kayıt ön adı yazılmaz ise seçilen kategorinin isminde kayıt oluşturulur.</p>
        <input name="label" placeholder="Kayıt adı: örn. Mayıs maaşı, ayakkabı, kira" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10" />
      </div>
      <input name="amount" type="number" min="0" step="0.01" placeholder="Tutar" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-400/60 focus:ring-4 focus:ring-blue-400/10" />
      <FormSubmit idleLabel="Kaydet" />
    </form>
  );
}
