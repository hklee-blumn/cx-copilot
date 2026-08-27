import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <Link href="/dashboard" className="font-semibold text-zinc-900 dark:text-zinc-50">
          Agent Dashboard
        </Link>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {user.fullName ?? user.emailAddresses[0]?.emailAddress}
            </span>
          )}
          <UserButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
