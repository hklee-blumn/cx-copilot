"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import CustomerCard from "./CustomerCard";
import SimulationDriver from "./SimulationDriver";

type QueueConversation = Parameters<typeof CustomerCard>[0]["c"];
type Alert = { id: string; conversationId: string; name: string };

const SEVERITY_ORDER = ["red", "orange", "yellow", "green"] as const;

const SEVERITY_META: Record<
  (typeof SEVERITY_ORDER)[number],
  { dot: string; label: string }
> = {
  red: { dot: "bg-red-500", label: "Needs a Human" },
  orange: { dot: "bg-orange-500", label: "Needs Approval" },
  yellow: { dot: "bg-yellow-500", label: "Watch List" },
  green: { dot: "bg-green-500", label: "Routine" },
};

export default function ConversationQueue() {
  const [conversations, setConversations] = useState<QueueConversation[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    red: true,
    orange: true,
    yellow: true,
    green: true,
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [pulseRed, setPulseRed] = useState(false);
  const seenRedIds = useRef<Set<string> | null>(null);

  function dismissAlert(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/conversations");
        if (!res.ok) throw new Error("Failed to load queue");
        const data: { conversations: QueueConversation[] } = await res.json();
        if (cancelled) return;

        setConversations(data.conversations);
        setError(null);

        const currentRedIds = new Set(
          data.conversations.filter((c) => c.severity === "red").map((c) => c.id)
        );
        if (seenRedIds.current === null) {
          seenRedIds.current = currentRedIds;
        } else {
          const newReds = data.conversations.filter(
            (c) => c.severity === "red" && !seenRedIds.current!.has(c.id)
          );
          if (newReds.length > 0) {
            const newAlerts = newReds.map((c) => ({
              id: `${c.id}-${Date.now()}`,
              conversationId: c.id,
              name: c.customer.name,
            }));
            setAlerts((prev) => [...prev, ...newAlerts]);
            newAlerts.forEach((a) => {
              setTimeout(() => dismissAlert(a.id), 8000);
            });
            setExpanded((prev) => ({ ...prev, red: true }));
            setPulseRed(true);
            setTimeout(() => setPulseRed(false), 4000);
          }
          seenRedIds.current = currentRedIds;
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

  const groups = SEVERITY_ORDER.map((severity) => ({
    severity,
    items: conversations.filter((c) => c.severity === severity),
  }));

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <SimulationDriver />

      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
        {alerts.map((a) => (
          <Link
            key={a.id}
            href={`/dashboard/conversations/${a.conversationId}`}
            onClick={() => dismissAlert(a.id)}
            className="animate-toast-in pointer-events-auto flex w-full max-w-sm items-center justify-between gap-3 rounded-full border border-red-200 bg-white px-4 py-2.5 shadow-lg dark:border-red-900 dark:bg-zinc-900"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-300">
              <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
              New urgent conversation — {a.name}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dismissAlert(a.id);
              }}
              className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </Link>
        ))}
      </div>

      <h1 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Live Conversations
      </h1>

      {loaded && (
        <div className="mb-4 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          {groups.map(({ severity, items }) => (
            <span key={severity} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${SEVERITY_META[severity].dot}`} />
              {items.length}
            </span>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {!loaded && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900"
            />
          ))}
        </div>
      )}

      {loaded && conversations.length === 0 && (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No live conversations right now.
        </p>
      )}

      {loaded && conversations.length > 0 && (
        <div className="flex flex-col gap-3">
          {groups.map(({ severity, items }) => {
            const meta = SEVERITY_META[severity];
            const isOpen = expanded[severity];
            return (
              <div
                key={severity}
                className={`overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 ${
                  severity === "red" && pulseRed ? "animate-urgent-pulse" : ""
                }`}
              >
                <button
                  onClick={() =>
                    setExpanded((prev) => ({ ...prev, [severity]: !prev[severity] }))
                  }
                  className="flex w-full items-center justify-between bg-zinc-50 px-4 py-3 text-left dark:bg-zinc-900"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                    <span className="text-zinc-400 dark:text-zinc-500">
                      ({items.length})
                    </span>
                  </span>
                  <span
                    className={`text-zinc-400 transition-transform dark:text-zinc-500 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    ▾
                  </span>
                </button>
                {isOpen && (
                  <div className="flex flex-col gap-3 p-3">
                    {items.length === 0 ? (
                      <p className="px-2 py-1 text-sm text-zinc-400 dark:text-zinc-500">
                        Nothing here right now.
                      </p>
                    ) : (
                      items.map((c) => <CustomerCard key={c.id} c={c} />)
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
