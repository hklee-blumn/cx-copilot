"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";

type Customer = { id: string; name: string; email: string };
type Message = { id: string; sender: string; body: string; createdAt: string };
type Conversation = {
  id: string;
  status: string;
  escalateReason: string | null;
  assignedAgent: { name: string } | null;
};

const STATUS_LABEL: Record<string, string> = {
  ai_active: "AI is helping you",
  escalated: "Waiting for a human agent",
  human_active: "A human agent has joined",
  resolved: "Resolved",
};

export default function ChatWindow() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingThread, setLoadingThread] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load customers");
        return r.json();
      })
      .then((data) => {
        setCustomers(data.customers);
        if (data.customers[0]) setCustomerId(data.customers[0].id);
      })
      .catch(() => setError("Couldn't load customers. Try refreshing the page."))
      .finally(() => setLoadingCustomers(false));
  }, []);

  useEffect(() => {
    if (!customerId) return;

    let cancelled = false;
    async function load(isFirstLoad: boolean) {
      if (isFirstLoad) setLoadingThread(true);
      try {
        const res = await fetch(`/api/chat/thread?customerId=${customerId}`);
        if (!res.ok) throw new Error("Failed to load conversation");
        const data = await res.json();
        if (!cancelled) {
          setConversation(data.conversation);
          setMessages(data.messages);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Couldn't reach the server. Retrying...");
      } finally {
        if (!cancelled && isFirstLoad) setLoadingThread(false);
      }
    }
    load(true);
    const interval = setInterval(() => load(false), 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [customerId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, sending]);

  async function sendMessage() {
    if (!draft.trim() || !customerId || sending) return;
    setSending(true);
    const body = draft;
    setDraft("");
    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, message: body }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      const data = await res.json();
      setConversation(data.conversation);
      setMessages(data.messages);
      setError(null);
    } catch {
      setError("Your message couldn't be sent. Please try again.");
      setDraft(body);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        {loadingCustomers ? (
          <div className="h-9 w-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        ) : (
          <select
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                Chatting as: {c.name}
              </option>
            ))}
          </select>
        )}
        {conversation && (
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {STATUS_LABEL[conversation.status] ?? conversation.status}
            {conversation.assignedAgent
              ? ` · ${conversation.assignedAgent.name}`
              : ""}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        {loadingThread ? (
          <div className="flex flex-col gap-3">
            <div className="h-12 w-2/3 animate-pulse self-start rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-12 w-1/2 animate-pulse self-end rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <MessageBubble key={m.id} sender={m.sender} body={m.body} />
            ))}
            {messages.length === 0 && (
              <p className="text-center text-sm text-zinc-400">
                Say hello to start the conversation.
              </p>
            )}
            {sending && (
              <div className="flex max-w-[75%] items-center gap-1 self-start rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-800 dark:bg-indigo-950">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-full border border-zinc-300 px-4 py-3 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Type a message..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !draft.trim()}
          className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900"
        >
          Send
        </button>
      </div>
    </div>
  );
}
