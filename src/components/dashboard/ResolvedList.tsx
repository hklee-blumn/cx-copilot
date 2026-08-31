"use client";

import { useEffect, useState } from "react";
import CustomerCard from "./CustomerCard";

type ResolvedConversation = Parameters<typeof CustomerCard>[0]["c"];

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCsv(conversations: ResolvedConversation[]) {
  const headers = [
    "Customer",
    "Company",
    "Email",
    "Phone",
    "Lifetime Spend",
    "Status",
    "Resolved",
    "Details",
  ];
  const rows = conversations.map((c) => [
    c.customer.name,
    c.customer.company,
    c.customer.email,
    c.customer.phone,
    `$${(c.lifetimeSpentCents / 100).toFixed(2)}`,
    c.status,
    new Date(c.updatedAt).toLocaleString(),
    c.escalateReason ?? c.messages[0]?.body ?? "",
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => csvEscape(String(cell))).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `resolved-conversations-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ResolvedList() {
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<ResolvedConversation[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const params = query ? `?q=${encodeURIComponent(query)}` : "";
        const res = await fetch(`/api/conversations/resolved${params}`);
        const data = await res.json();
        if (!cancelled) {
          setConversations(data.conversations);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) setLoaded(true);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Resolved Conversations
        </h1>
        <button
          onClick={() => downloadCsv(conversations)}
          disabled={conversations.length === 0}
          className="shrink-0 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
        >
          Export CSV
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by customer name..."
        className="mb-4 w-full rounded-full border border-zinc-300 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
      />

      {!loaded && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
          ))}
        </div>
      )}

      {loaded && conversations.length === 0 && (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No resolved conversations{query ? " match that search" : " yet"}.
        </p>
      )}

      {loaded && conversations.length > 0 && (
        <div className="flex flex-col gap-3">
          {conversations.map((c) => (
            <CustomerCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}
