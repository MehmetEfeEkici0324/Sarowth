"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Merhaba, ben Sarowth asistanın. Banka hareketlerin, harcama kategorilerin, tasarruf hedefin ve ürün fikirlerin üzerinden kişisel karar desteği sunarım. Bir şey almak istiyorsan bana sorabilirsin.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  function sendMessage() {
    const content = input.trim();
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
        <p className="max-w-md text-sm leading-6 text-slate-400">Asistan; banka agent'ı, piyasa agent'ı, ticari hesap agent'ı ve konuşma geçmişini bağlam olarak kullanacak şekilde tasarlandı.</p>
      </div>

      <div className="mt-6 grid max-h-[26rem] gap-3 overflow-y-auto rounded-3xl border border-white/10 bg-black/25 p-4">
        {messages.map((message, index) => (
          <div key={index} className={message.role === "user" ? "ml-auto max-w-[85%] rounded-3xl bg-emerald-400 px-4 py-3 text-sm font-medium text-[#03110c]" : "mr-auto max-w-[85%] rounded-3xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-6 text-slate-200"}>
            {message.content}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-3">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") sendMessage();
          }}
          placeholder="Örn: Bu ay ayakkabı almalı mıyım, yoksa beklemeli miyim?"
          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10"
        />
        <button onClick={sendMessage} disabled={isPending} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 px-5 py-3 font-semibold text-[#03110c] disabled:opacity-60">
          <Send size={17} /> {isPending ? "Düşünüyor" : "Gönder"}
        </button>
      </div>
    </section>
  );
}
