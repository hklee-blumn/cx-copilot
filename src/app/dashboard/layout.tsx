import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

const NAV_LINKS = [
  { href: "/dashboard", label: "Live Board" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/resolved", label: "Resolved" },
  { href: "/dashboard/knowledge-base", label: "Knowledge Base" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-5">
          <Link href="/dashboard" className="font-semibold text-zinc-900 dark:text-zinc-50">
            CX Copilot
          </Link>
          <nav className="flex flex-wrap items-center gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
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
