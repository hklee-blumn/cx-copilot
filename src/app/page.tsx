import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-zinc-50 px-6 text-center dark:bg-zinc-950">
      <div>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          CX Copilot
        </h1>
        <p className="mt-2 max-w-md text-zinc-600 dark:text-zinc-400">
          An AI-first support desk. Customers chat with an AI agent; anything
          it can&apos;t (or shouldn&apos;t) handle alone lands on a human
          dashboard.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/chat"
          className="rounded-full bg-zinc-900 px-6 py-3 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Open Customer Chat
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full border border-zinc-300 px-6 py-3 font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          Open Agent Dashboard
        </Link>
      </div>
    </div>
  );
}
