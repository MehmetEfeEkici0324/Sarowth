"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AssistantChatProps {
  onDashboardData?: (dashboardData: unknown) => void;
}

export function AssistantChat({ onDashboardData }: AssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Bana normal cümleyle de yazabilirsin. Örnek: al tişört 6000",
    },
  ]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  function sendMessage(nextInput = input) {
    const content = nextInput.trim();
    if (!content) return;

    setInput("");
    setMessages((current) => [...current, { role: "user", content }]);

    startTransition(async () => {
      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content }),
        });
        const data = await response.json();
        if (data.dashboardData) {
          onDashboardData?.(data.dashboardData);
        }
        setMessages((current) => [...current, { role: "assistant", content: data.reply ?? "Şu anda yanıt üretilemedi." }]);
      } catch {
        setMessages((current) => [...current, { role: "assistant", content: "Bağlantı kurulamadı. Biraz sonra tekrar deneyebilirsin." }]);
      }
    });
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Kişisel Asistan</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Gemini destekli kişisel karar asistanı</h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-slate-400">Bütçe kayıtlarını okur, haber/trend tablolarını kontrol eder ve sadece mesaj gönderdiğinde çalışır.</p>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-5">
        {[
          { label: "Almalı mıyım?", prompt: "al tişört 6000", detail: "Bütçeye göre karar" },
          { label: "Haber ara", prompt: "haber e-ticaret", detail: "Günlük haber bundle" },
          { label: "Ürün takip", prompt: "takip stres çarkı", detail: "Trend ve tedarik" },
          { label: "Yatırım alanı", prompt: "yatırım", detail: "Tavsiye değildir" },
          { label: "Bütçe özeti", prompt: "özet", detail: "Gelir gider durumu" },
        ].map((item) => (
          <button key={item.prompt} type="button" onClick={() => sendMessage(item.prompt)} disabled={isPending} className="rounded-2xl border border-white/10 bg-black/25 p-4 text-left transition hover:border-emerald-300/30 hover:bg-white/[0.06] disabled:opacity-60">
            <span className="block text-sm font-semibold text-white">{item.label}</span>
            <span className="mt-1 block text-xs text-emerald-200">{item.prompt}</span>
            <span className="mt-2 block text-xs text-slate-500">{item.detail}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid max-h-[26rem] gap-3 overflow-y-auto rounded-3xl border border-white/10 bg-black/25 p-4">
        {messages.map((message, index) => (
          <div key={index} className={message.role === "user" ? "ml-auto max-w-[85%] whitespace-pre-wrap rounded-3xl bg-emerald-400 px-4 py-3 text-sm font-medium text-[#03110c]" : "mr-auto max-w-[85%] whitespace-pre-wrap rounded-3xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-6 text-slate-200"}>
            {message.content}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-3">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Örn: al tişört 6000 veya haber e-ticaret"
          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10"
        />
        <button type="button" onClick={() => sendMessage()} disabled={isPending} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 px-5 py-3 font-semibold text-[#03110c] disabled:opacity-60">
          <Send size={17} /> {isPending ? "Düşünüyor" : "Gönder"}
        </button>
      </div>
    </section>
  );
}
