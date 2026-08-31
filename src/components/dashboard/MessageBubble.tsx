type Props = {
  sender: string;
  body: string;
  createdAt?: string;
  customerName?: string;
  imageUrl?: string | null;
  photoLooksFake?: boolean | null;
  photoFakeReason?: string | null;
};

const SENDER_STYLES: Record<string, string> = {
  agent:
    "self-end bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950",
  ai: "self-start bg-indigo-50 text-indigo-950 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-100 dark:border-indigo-800",
  customer:
    "self-start bg-zinc-100 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MessageBubble({
  sender,
  body,
  createdAt,
  customerName,
  imageUrl,
  photoLooksFake,
  photoFakeReason,
}: Props) {
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
      <span className="flex items-baseline gap-2 text-xs font-medium opacity-70">
        {label}
        {createdAt && (
          <span className="font-normal opacity-80">{formatTime(createdAt)}</span>
        )}
      </span>
      <span className="whitespace-pre-wrap text-sm">{body}</span>
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt="Customer-submitted evidence photo"
          className="mt-1 max-h-56 w-full max-w-xs rounded-lg border border-black/10 object-cover"
        />
      )}
      {photoLooksFake && (
        <div className="mt-1 flex max-w-xs items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <span aria-hidden>⚠️</span>
          <div>
            <p className="text-xs font-semibold">AI flagged this photo as likely fake</p>
            {photoFakeReason && (
              <p className="mt-0.5 text-xs opacity-90">{photoFakeReason}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
