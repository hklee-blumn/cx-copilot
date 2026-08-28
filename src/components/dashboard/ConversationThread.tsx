"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble from "@/components/chat/MessageBubble";

type Message = { id: string; sender: string; body: string; createdAt: string };
type Order = { id: string; description: string; amountCents: number; status: string };
type RefundDecision = {
  id: string;
  amountCents: number;
  decision: string;
  reasoning: string;
  confidence: number;
  decidedBy: string;
};
type Conversation = {
  id: string;
  status: string;
  escalateReason: string | null;
  assignedAgent: { id: string; name: string } | null;
  customer: { name: string; email: string; phone: string };
  messages: Message[];
  refundDecisions: RefundDecision[];
};

export default function ConversationThread({
  conversationId,
}: {
  conversationId: string;
}) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lifetimeSpentCents, setLifetimeSpentCents] = useState(0);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (!res.ok) throw new Error("Failed to load conversation");
      const data = await res.json();
      setConversation(data.conversation);
      setOrders(data.orders);
      setLifetimeSpentCents(data.lifetimeSpentCents);
      setError(null);
    } catch {
      setError("Couldn't reach the server. Retrying...");
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [conversation?.messages.length]);

  async function takeOver() {
    setBusy(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/takeover`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to take over");
      await load();
    } catch {
      setError("Couldn't take over this conversation. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resolve() {
    setBusy(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/resolve`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to resolve");
      await load();
    } catch {
      setError("Couldn't mark this conversation resolved. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendReply() {
    if (!draft.trim()) return;
    setBusy(true);
    const body = draft;
    setDraft("");
    try {
      const res = await fetch(`/api/conversations/${conversationId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error("Failed to send reply");
      await load();
    } catch {
      setError("Your reply couldn't be sent. Please try again.");
      setDraft(body);
    } finally {
      setBusy(false);
    }
  }

  if (!conversation) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-1 gap-6 p-6">
        <div className="h-96 flex-1 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
        <div className="h-96 w-72 shrink-0 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      </div>
    );
  }

  const canTakeOver = conversation.status === "escalated";
  const canReply = conversation.status === "human_active";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3 p-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}
      <div className="flex flex-1 gap-6">
      <div className="flex flex-1 flex-col">
        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex flex-col gap-3">
            {conversation.messages.map((m) => (
              <MessageBubble key={m.id} sender={m.sender} body={m.body} />
            ))}
          </div>
        </div>

        <div className="mt-3">
          {canTakeOver && (
            <button
              onClick={takeOver}
              disabled={busy}
              className="w-full rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white disabled:opacity-40"
            >
              Take Over Conversation
            </button>
          )}
          {canReply && (
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-full border border-zinc-300 px-4 py-3 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Reply to customer..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendReply()}
              />
              <button
                onClick={sendReply}
                disabled={busy || !draft.trim()}
                className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900"
              >
                Send
              </button>
            </div>
          )}
          {!canTakeOver && !canReply && (
            <p className="text-center text-sm text-zinc-500">
              {conversation.status === "resolved"
                ? "This conversation is resolved."
                : "The AI is currently handling this conversation."}
            </p>
          )}
        </div>
      </div>

      <aside className="w-72 shrink-0 space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            {conversation.customer.name}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {conversation.customer.phone}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {conversation.customer.email}
          </p>
          <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Lifetime spend: ${(lifetimeSpentCents / 100).toFixed(2)}
          </p>
          {conversation.status !== "resolved" && (
            <button
              onClick={resolve}
              disabled={busy}
              className="mt-3 w-full rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
            >
              Mark Resolved
            </button>
          )}
        </div>

        {conversation.escalateReason && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <p className="font-medium">Why this is here</p>
            <p className="mt-1">{conversation.escalateReason}</p>
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-2 font-medium text-zinc-900 dark:text-zinc-50">
            Order History
          </p>
          <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            {orders.map((o) => (
              <li key={o.id}>
                {o.description} — ${(o.amountCents / 100).toFixed(2)}
              </li>
            ))}
          </ul>
        </div>

        {conversation.refundDecisions.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-2 font-medium text-zinc-900 dark:text-zinc-50">
              Refund Decisions
            </p>
            <ul className="space-y-2 text-sm">
              {conversation.refundDecisions.map((r) => (
                <li key={r.id} className="text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium capitalize">{r.decision}</span>{" "}
                  · ${(r.amountCents / 100).toFixed(2)} by {r.decidedBy}
                  <p className="text-xs italic">{r.reasoning}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
      </div>
    </div>
  );
}
