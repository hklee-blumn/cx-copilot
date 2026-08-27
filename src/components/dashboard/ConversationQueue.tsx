"use client";

import { useEffect, useState } from "react";
import CustomerCard from "./CustomerCard";

type QueueConversation = Parameters<typeof CustomerCard>[0]["c"];

export default function ConversationQueue() {
  const [conversations, setConversations] = useState<QueueConversation[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/conversations");
        if (!res.ok) throw new Error("Failed to load queue");
        const data = await res.json();
        if (!cancelled) {
          setConversations(data.conversations);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Couldn't reach the server. Retrying...");
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    load();
    const interval = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Escalation Queue
      </h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {!loaded &&
          [0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900"
            />
          ))}
        {conversations.map((c) => (
          <CustomerCard key={c.id} c={c} />
        ))}
        {loaded && conversations.length === 0 && (
          <p className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
            Nothing needs a human right now — the AI is handling everything.
          </p>
        )}
      </div>
    </div>
  );
}
