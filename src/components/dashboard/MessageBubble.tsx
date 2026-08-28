type Props = {
  sender: string;
  body: string;
  customerName?: string;
};

const SENDER_STYLES: Record<string, string> = {
  agent:
    "self-end bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950",
  ai: "self-start bg-indigo-50 text-indigo-950 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-100 dark:border-indigo-800",
  customer:
    "self-start bg-zinc-100 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
};

export default function MessageBubble({ sender, body, customerName }: Props) {
  const label =
    sender === "agent"
      ? "You"
      : sender === "ai"
        ? "AI Agent"
        : (customerName ?? "Customer");

  return (
    <div
      className={`flex max-w-[75%] flex-col gap-1 rounded-2xl px-4 py-2 ${
        SENDER_STYLES[sender] ?? "self-start bg-zinc-100"
      }`}
    >
      <span className="text-xs font-medium opacity-70">{label}</span>
      <span className="whitespace-pre-wrap text-sm">{body}</span>
    </div>
  );
}
