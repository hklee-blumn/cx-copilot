"use client";

import { useEffect, useState } from "react";

type Analytics = {
  total: number;
  resolvedTotal: number;
  resolvedWithoutHuman: number;
  resolutionRate: number;
  autoResolvedRate: number;
  escalationRate: number;
  avgResolutionMinutes: number;
  severityBreakdown: Record<string, number>;
  refundSummary: Record<string, number>;
  approvedAmountCents: number;
  volume: { hour: string; count: number }[];
  fraudFlaggedPhotos: number;
  fraudPreventedAmountCents: number;
};

const SEVERITY_COLORS: Record<string, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}

export default function AnalyticsView() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/analytics");
        if (!res.ok) throw new Error("Failed to load analytics");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("Couldn't load analytics. Retrying...");
      }
    }
    load();
    const interval = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (error && !data) {
    return <p className="p-6 text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-5xl p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
          ))}
        </div>
      </div>
    );
  }

  const maxVolume = Math.max(1, ...data.volume.map((v) => v.count));
  const severityTotal =
    Object.values(data.severityBreakdown).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Analytics
      </h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total conversations" value={String(data.total)} />
        <StatCard
          label="Resolved without a human"
          value={`${Math.round(data.autoResolvedRate * 100)}%`}
        />
        <StatCard
          label="Escalation rate"
          value={`${Math.round(data.escalationRate * 100)}%`}
        />
        <StatCard
          label="Avg. time to resolution"
          value={
            data.avgResolutionMinutes < 1
              ? "< 1 min"
              : `${Math.round(data.avgResolutionMinutes)} min`
          }
        />
      </div>

      {data.fraudFlaggedPhotos > 0 && (
        <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center dark:border-red-900 dark:bg-red-950">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden>
              🛡️
            </span>
            <div>
              <p className="font-medium text-red-900 dark:text-red-200">
                Fraud caught by AI photo verification
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {data.fraudFlaggedPhotos} fake evidence photo
                {data.fraudFlaggedPhotos === 1 ? "" : "s"} flagged before a refund was
                approved
              </p>
            </div>
          </div>
          <p className="text-2xl font-bold text-red-900 dark:text-red-200">
            ${(data.fraudPreventedAmountCents / 100).toFixed(2)}
            <span className="ml-1.5 text-sm font-normal text-red-700 dark:text-red-300">
              at risk
            </span>
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-4 font-medium text-zinc-900 dark:text-zinc-50">
            Severity breakdown
          </p>
          <div className="space-y-2">
            {(["red", "orange", "yellow", "green"] as const).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span className="w-14 text-xs capitalize text-zinc-500 dark:text-zinc-400">
                  {s}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={`h-full ${SEVERITY_COLORS[s]} transition-[width] duration-700`}
                    style={{
                      width: `${((data.severityBreakdown[s] ?? 0) / severityTotal) * 100}%`,
                    }}
                  />
                </div>
                <span className="w-8 text-right text-xs text-zinc-500 dark:text-zinc-400">
                  {data.severityBreakdown[s] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-4 font-medium text-zinc-900 dark:text-zinc-50">
            Refund decisions
          </p>
          <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <p>Approved: {data.refundSummary.approved ?? 0}</p>
            <p>Rejected: {data.refundSummary.rejected ?? 0}</p>
            <p>Escalated to human: {data.refundSummary.escalated ?? 0}</p>
            <p className="mt-2 font-medium text-zinc-900 dark:text-zinc-50">
              Total approved: ${(data.approvedAmountCents / 100).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {data.volume.length > 0 && (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-baseline justify-between">
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              Volume by hour
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {data.volume.reduce((sum, v) => sum + v.count, 0)} conversations across{" "}
              {data.volume.length} {data.volume.length === 1 ? "hour" : "hours"}
            </p>
          </div>
          <div className="flex items-end gap-3 overflow-x-auto pb-1">
            {data.volume.map((v, i) => {
              const date = new Date(v.hour);
              const prevDate = i > 0 ? new Date(data.volume[i - 1].hour) : null;
              const isNewDay =
                !prevDate || date.toDateString() !== prevDate.toDateString();
              return (
                <div key={v.hour} className="flex w-14 shrink-0 flex-col items-center">
                  {isNewDay && (
                    <span className="mb-1 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                      {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {v.count}
                  </span>
                  <div className="mt-1 flex h-28 w-full items-end rounded-t bg-zinc-50 dark:bg-zinc-950">
                    <div
                      className="w-full rounded-t bg-blue-500 transition-[height] duration-700 dark:bg-blue-600"
                      style={{ height: `${Math.max(4, (v.count / maxVolume) * 100)}%` }}
                      title={`${date.toLocaleString()}: ${v.count} conversation${v.count === 1 ? "" : "s"}`}
                    />
                  </div>
                  <span className="mt-1 border-t border-zinc-200 pt-1 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    {date.toLocaleTimeString(undefined, { hour: "numeric" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
