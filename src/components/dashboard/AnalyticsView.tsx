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
          <p className="mb-4 font-medium text-zinc-900 dark:text-zinc-50">
            Volume by hour
          </p>
          <div className="flex h-32 items-end gap-1">
            {data.volume.map((v) => (
              <div
                key={v.hour}
                className="flex-1 rounded-t bg-blue-500 transition-[height] duration-700 dark:bg-blue-600"
                style={{ height: `${(v.count / maxVolume) * 100}%` }}
                title={`${new Date(v.hour).toLocaleString()}: ${v.count}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
