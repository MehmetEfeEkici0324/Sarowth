"use client";

import { useState, useTransition } from "react";
import { RefreshCw, Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AssistantChatProps {
  onDashboardData?: (dashboardData: unknown) => void;
  initialMessages?: Message[];
}

interface LastSearchAction {
  command: "haber" | "takip";
  topic: string;
}

interface ResultExclusions {
  urls: string[];
  titles: string[];
}

interface AssistantDashboardData {
  finansHaberleri?: Array<{ title?: string; url?: string }>;
  tedarikLinkleri?: Array<{ title?: string; url?: string }>;
}

const refreshPattern = /\b(yenile|yeniden|tekrar|refresh|başka|baska)\b/gi;
const newsPrefixes = ["haber ", "haberleri ", "gündem ", "piyasa haberi "];
const productPrefixes = ["takip ", "izle ", "ürün takip ", "ürün ara ", "urun takip ", "urun ara ", "tedarik "];

function stripRefreshWords(value: string) {
  return value.replace(refreshPattern, "").trim();
}

function isRefreshMessage(value: string) {
  refreshPattern.lastIndex = 0;
  return refreshPattern.test(value);
}

function getDashboardExclusions(data: AssistantDashboardData): ResultExclusions {
  const news = Array.isArray(data.finansHaberleri) ? data.finansHaberleri : [];
  const suppliers = Array.isArray(data.tedarikLinkleri) ? data.tedarikLinkleri : [];

  return {
    urls: [...news.map((item) => item.url), ...suppliers.map((item) => item.url)].filter(Boolean) as string[],
    titles: [...news.map((item) => item.title), ...suppliers.map((item) => item.title)].filter(Boolean) as string[],
  };
}

function getSearchAction(message: string): LastSearchAction | null {
  const trimmed = message.trim();
  const lower = trimmed.toLocaleLowerCase("tr-TR");
  const newsPrefix = newsPrefixes.find((prefix) => lower.startsWith(prefix));
  if (newsPrefix) return { command: "haber", topic: stripRefreshWords(trimmed.slice(newsPrefix.length)) };
  const productPrefix = productPrefixes.find((prefix) => lower.startsWith(prefix));
  if (productPrefix) return { command: "takip", topic: stripRefreshWords(trimmed.slice(productPrefix.length)) };
  return null;
}

export function AssistantChat({ onDashboardData, initialMessages = [] }: AssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages.length > 0 ? initialMessages : [
    {
      role: "assistant",
      content: "Bana normal cümleyle yazabilirsin. Ürün takibi için ürün adını sen girene kadar beklerim.",
    },
  ]);
  const [input, setInput] = useState("");
  const [lastSearchAction, setLastSearchAction] = useState<LastSearchAction | null>(null);
  const [resultExclusions, setResultExclusions] = useState<ResultExclusions>({ urls: [], titles: [] });
  const [isPending, startTransition] = useTransition();

  function sendMessage(nextInput = input) {
    const content = nextInput.trim();
    if (!content) return;

    setInput("");
    setMessages((current) => [...current, { role: "user", content }]);
    const nextSearchAction = getSearchAction(content);
    if (nextSearchAction?.topic) setLastSearchAction(nextSearchAction);
    const isRefresh = isRefreshMessage(content);

    startTransition(async () => {
      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            ...(isRefresh ? { excludeUrls: resultExclusions.urls, excludeTitles: resultExclusions.titles } : {}),
          }),
        });
        const data = await response.json();
        if (data.dashboardData) {
          setResultExclusions(getDashboardExclusions(data.dashboardData));
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
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
            <span className="rounded-full border border-emerald-300/20 bg-black/20 px-4 py-2">Piyasa ürünleri takibi için: <span className="text-emerald-200">takip &lt;ürün&gt;</span></span>
            <span className="rounded-full border border-blue-300/20 bg-black/20 px-4 py-2">Hisse, yatırım ürünleri takibi için: <span className="text-blue-200">haber &lt;ürün&gt;</span></span>
          </div>
        </div>
        <p className="max-w-md text-sm leading-6 text-slate-400">Bütçe kayıtlarını okur, haber/trend tablolarını kontrol eder ve sadece mesaj gönderdiğinde çalışır.</p>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-5">
        {[
          { label: "Almalı mıyım?", prompt: "al ürün 6000", detail: "Bütçeye göre karar" },
          { label: "Haber ara", prompt: "haber e-ticaret", detail: "Günlük haber bundle" },
          { label: "Ürün takip", prompt: "takip ürün adı", detail: "Trend ve tedarik" },
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

      {lastSearchAction ? (
        <div className="mt-4 grid gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => sendMessage(`${lastSearchAction.command} ${lastSearchAction.topic} yenile`)}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:border-emerald-300/40 disabled:opacity-60"
            >
              <RefreshCw size={15} /> {lastSearchAction.command === "haber" ? "Haberleri yenile" : "Ürün sonuçlarını yenile"}
            </button>
            <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-slate-500">Yeni sonuçlar önceki linkler hariç aranır.</span>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid max-h-[26rem] min-w-0 gap-3 overflow-y-auto overflow-x-hidden rounded-3xl border border-white/10 bg-black/25 p-4">
        {messages.map((message, index) => (
          <div key={index} className={message.role === "user" ? "ml-auto max-w-[85%] overflow-hidden break-words whitespace-pre-wrap rounded-3xl bg-emerald-400 px-4 py-3 text-sm font-medium text-[#03110c]" : "mr-auto max-w-[85%] overflow-hidden break-words whitespace-pre-wrap rounded-3xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-6 text-slate-200"}>
            {message.content}
          </div>
        ))}
        {isPending ? (
          <div className="mr-auto inline-flex max-w-[85%] items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-300">
            <span>Asistan düşünüyor</span>
            <span className="flex items-center gap-1" aria-hidden="true">
              <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-300 [animation-delay:-200ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-300 [animation-delay:-100ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-300" />
            </span>
          </div>
        ) : null}
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
          placeholder="Örn: al ürün 6000 veya takip ürün adı"
          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10"
        />
        <button type="button" onClick={() => sendMessage()} disabled={isPending} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 px-5 py-3 font-semibold text-[#03110c] disabled:opacity-60">
          <Send size={17} /> {isPending ? "Düşünüyor..." : "Gönder"}
        </button>
      </div>
    </section>
  );
}
