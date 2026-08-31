"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import MessageBubble from "./MessageBubble";
import { companyBadge } from "@/lib/companies";

type Message = {
  id: string;
  sender: string;
  body: string;
  createdAt: string;
  imageUrl?: string | null;
  photoLooksFake?: boolean | null;
  photoFakeReason?: string | null;
};
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
  severity: string;
  isSimulated: boolean;
  escalateReason: string | null;
  assignedAgent: { id: string; name: string } | null;
  customer: { name: string; email: string; phone: string; company: string };
  messages: Message[];
  refundDecisions: RefundDecision[];
};
type Suggestions = { accept: string; clarify: string; decline: string };

const SUGGESTION_META = {
  accept: { label: "Agree & Accommodate", style: "border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950" },
  clarify: { label: "Ask for More Info", style: "border-sky-300 hover:bg-sky-50 dark:border-sky-800 dark:hover:bg-sky-950" },
  decline: { label: "Decline Politely", style: "border-amber-300 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950" },
} as const;

export default function ConversationThread({
  conversationId,
}: {
  conversationId: string;
}) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lifetimeSpentCents, setLifetimeSpentCents] = useState(0);
  const [isVip, setIsVip] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [customerTyping, setCustomerTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const suggestionsForRef = useRef<string | null>(null);

  async function load() {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (!res.ok) throw new Error("Failed to load conversation");
      const data = await res.json();
      setConversation(data.conversation);
      setOrders(data.orders);
      setLifetimeSpentCents(data.lifetimeSpentCents);
      setIsVip(Boolean(data.isVip));
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
  }, [conversation?.messages.length, customerTyping]);

  useEffect(() => {
    if (!conversation) return;
    const actionable = conversation.status === "escalated" || conversation.status === "human_active";
    const relevant = conversation.severity === "red" || conversation.severity === "orange";
    if (!actionable || !relevant) return;

    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (!lastMessage || lastMessage.sender === "agent") return;
    if (lastMessage.id === suggestionsForRef.current) return;

    suggestionsForRef.current = lastMessage.id;
    setSuggestionsLoading(true);
    fetch(`/api/conversations/${conversationId}/suggestions`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => setSuggestions(data.suggestions ?? null))
      .catch(() => {})
      .finally(() => setSuggestionsLoading(false));
  }, [conversation, conversationId]);

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

  async function sendReplyText(text: string) {
    if (!text.trim()) return;
    setBusy(true);
    if (conversation?.isSimulated) setCustomerTyping(true);
    try {
      if (conversation?.status === "escalated") {
        const takeoverRes = await fetch(`/api/conversations/${conversationId}/takeover`, {
          method: "POST",
        });
        if (!takeoverRes.ok) throw new Error("Failed to take over");
      }
      const res = await fetch(`/api/conversations/${conversationId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) throw new Error("Failed to send reply");
      setSuggestions(null);
      await load();
    } catch {
      setError("Your reply couldn't be sent. Please try again.");
      return false;
    } finally {
      setBusy(false);
      setCustomerTyping(false);
    }
    return true;
  }

  async function sendReply() {
    const body = draft;
    setDraft("");
    const ok = await sendReplyText(body);
    if (ok === false) setDraft(body);
  }

  async function approveRefund() {
    setBusy(true);
    if (conversation?.isSimulated) setCustomerTyping(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/approve-refund`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to approve refund");
      setSuggestions(null);
      await load();
    } catch {
      setError("Couldn't approve the refund. Please try again.");
    } finally {
      setBusy(false);
      setCustomerTyping(false);
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
  const canSuggest =
    (canTakeOver || canReply) &&
    (conversation.severity === "red" || conversation.severity === "orange");
  const pendingRefund = conversation.refundDecisions.find((r) => r.decision === "escalated");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3 p-6">
      <Link
        href="/dashboard"
        className="flex w-fit items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← Back to dashboard
      </Link>
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
              <MessageBubble
                key={m.id}
                sender={m.sender}
                body={m.body}
                createdAt={m.createdAt}
                customerName={conversation.customer.name}
                imageUrl={m.imageUrl}
                photoLooksFake={m.photoLooksFake}
                photoFakeReason={m.photoFakeReason}
              />
            ))}
            {customerTyping && (
              <div className="flex max-w-[75%] items-center gap-1 self-start rounded-2xl border border-zinc-200 bg-zinc-100 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
              </div>
            )}
          </div>
        </div>

        {canSuggest && pendingRefund && (
          <button
            onClick={approveRefund}
            disabled={busy}
            className="mt-3 w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-medium text-white disabled:opacity-40"
          >
            ✓ Approve ${(pendingRefund.amountCents / 100).toFixed(2)} Refund &amp; Notify Customer
          </button>
        )}

        {canSuggest && (suggestionsLoading || suggestions) && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Suggested replies — click to send
            </p>
            {suggestionsLoading && !suggestions && (
              <div className="grid gap-2 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
                ))}
              </div>
            )}
            {suggestions && (
              <div className="grid gap-2 sm:grid-cols-3">
                {(["accept", "clarify", "decline"] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => sendReplyText(suggestions[key])}
                    disabled={busy}
                    className={`rounded-xl border bg-white p-3 text-left text-xs text-zinc-700 transition disabled:opacity-40 dark:bg-zinc-950 dark:text-zinc-300 ${SUGGESTION_META[key].style}`}
                  >
                    <span className="mb-1 block font-semibold text-zinc-900 dark:text-zinc-50">
                      {SUGGESTION_META[key].label}
                    </span>
                    {suggestions[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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
          <div className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${companyBadge(conversation.customer.company).color}`}
            >
              {companyBadge(conversation.customer.company).initials}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                {conversation.customer.name}
                {isVip && (
                  <span className="ml-1" title="Top 10% spender for this company">
                    👑
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {conversation.customer.company}
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {conversation.customer.phone}
          </p>
          <p className="break-all text-sm text-zinc-500 dark:text-zinc-400">
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
