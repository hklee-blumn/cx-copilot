import Link from "next/link";

type QueueConversation = {
  id: string;
  status: string;
  escalateReason: string | null;
  updatedAt: string;
  lifetimeSpentCents: number;
  customer: { name: string; phone: string; email: string };
  assignedAgent: { name: string } | null;
  messages: { body: string; sender: string }[];
};

export default function CustomerCard({ c }: { c: QueueConversation }) {
  const lastMessage = c.messages[0];

  return (
    <Link
      href={`/dashboard/conversations/${c.id}`}
      className="block rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            {c.customer.name}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {c.customer.phone} · {c.customer.email}
          </p>
        </div>
        <span className="whitespace-nowrap rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {c.status === "human_active" ? "In progress" : "Needs attention"}
        </span>
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
