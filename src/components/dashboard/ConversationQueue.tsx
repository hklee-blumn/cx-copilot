"use client";

import { useEffect, useState } from "react";
import CustomerCard from "./CustomerCard";
import SimulationDriver from "./SimulationDriver";

type QueueConversation = Parameters<typeof CustomerCard>[0]["c"];

const SEVERITY_ORDER = ["red", "orange", "yellow", "green"] as const;

const COUNT_STYLES: Record<string, string> = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-500",
  green: "bg-green-500",
};

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

  const counts = conversations.reduce<Record<string, number>>((acc, c) => {
    acc[c.severity] = (acc[c.severity] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <SimulationDriver />
      <h1 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Live Conversations
      </h1>

      {loaded && (
        <div className="mb-4 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          {SEVERITY_ORDER.map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${COUNT_STYLES[s]}`} />
              {counts[s] ?? 0}
            </span>
          ))}
        </div>
      )}

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
            No live conversations right now.
          </p>
        )}
      </div>
    </div>
  );
}
