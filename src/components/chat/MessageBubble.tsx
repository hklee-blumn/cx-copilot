type Props = {
  sender: string;
  body: string;
};

const SENDER_STYLES: Record<string, string> = {
  customer: "self-end bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900",
  ai: "self-start bg-indigo-50 text-indigo-950 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-100 dark:border-indigo-800",
  agent:
    "self-start bg-emerald-50 text-emerald-950 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800",
};

const SENDER_LABELS: Record<string, string> = {
  customer: "You",
  ai: "AI Agent",
  agent: "Support Agent",
};

export default function MessageBubble({ sender, body }: Props) {
  return (
    <div
      className={`flex max-w-[75%] flex-col gap-1 rounded-2xl px-4 py-2 ${
        SENDER_STYLES[sender] ?? "self-start bg-zinc-100"
      }`}
    >
      <span className="text-xs font-medium opacity-70">
        {SENDER_LABELS[sender] ?? sender}
      </span>
      <span className="whitespace-pre-wrap text-sm">{body}</span>
    </div>
  );
}
