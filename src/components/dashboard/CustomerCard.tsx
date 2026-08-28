import Link from "next/link";
import { formatRelativeTime } from "@/lib/format";

type QueueConversation = {
  id: string;
  status: string;
  severity: string;
  escalateReason: string | null;
  updatedAt: string;
  lifetimeSpentCents: number;
  customer: { name: string; phone: string; email: string };
  assignedAgent: { name: string } | null;
  messages: { body: string; sender: string }[];
};

const SEVERITY_DOT: Record<string, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
};

const STATUS_LABEL: Record<string, string> = {
  ai_active: "AI handling",
  human_active: "In progress",
  escalated: "Needs attention",
  resolved: "Resolved",
};

export default function CustomerCard({ c }: { c: QueueConversation }) {
  const lastMessage = c.messages[0];

  return (
    <Link
      href={`/dashboard/conversations/${c.id}`}
      className="block rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span
            className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
              SEVERITY_DOT[c.severity] ?? "bg-zinc-400"
            }`}
            title={`Severity: ${c.severity}`}
          />
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {c.customer.name}
            </p>
            <p className="break-all text-xs text-zinc-500 dark:text-zinc-400">
              {c.customer.phone} · {c.customer.email}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="whitespace-nowrap rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {STATUS_LABEL[c.status] ?? c.status}
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {formatRelativeTime(c.updatedAt)}
          </span>
        </div>
      </div>

      <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Lifetime spend: ${(c.lifetimeSpentCents / 100).toFixed(2)}
      </p>

      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {c.escalateReason ?? lastMessage?.body ?? "No details yet."}
      </p>

      {c.assignedAgent && (
        <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
          Assigned to {c.assignedAgent.name}
        </p>
      )}
    </Link>
  );
}
