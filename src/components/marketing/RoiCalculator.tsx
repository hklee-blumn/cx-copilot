"use client";

import { useState } from "react";

const AUTO_RESOLVE_RATE = 0.68;
const AVG_HANDLE_TIME_MINUTES = 6;

export default function RoiCalculator() {
  const [agents, setAgents] = useState(20);
  const [conversationsPerAgentPerDay, setConversationsPerAgentPerDay] = useState(40);
  const [hourlyCost, setHourlyCost] = useState(25);

  const conversationsPerDay = agents * conversationsPerAgentPerDay;
  const autoResolvedPerDay = conversationsPerDay * AUTO_RESOLVE_RATE;
  const hoursSavedPerDay = (autoResolvedPerDay * AVG_HANDLE_TIME_MINUTES) / 60;
  const dollarsSavedPerMonth = hoursSavedPerDay * hourlyCost * 30;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <label htmlFor="agents">Support agents</label>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{agents}</span>
            </div>
            <input
              id="agents"
              type="range"
              min={5}
              max={200}
              value={agents}
              onChange={(e) => setAgents(Number(e.target.value))}
              className="mt-2 w-full accent-blue-950 dark:accent-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <label htmlFor="conversations">Conversations per agent / day</label>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {conversationsPerAgentPerDay}
              </span>
            </div>
            <input
              id="conversations"
              type="range"
              min={10}
              max={100}
              value={conversationsPerAgentPerDay}
              onChange={(e) => setConversationsPerAgentPerDay(Number(e.target.value))}
              className="mt-2 w-full accent-blue-950 dark:accent-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <label htmlFor="cost">Fully-loaded cost / agent hour</label>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                ${hourlyCost}
              </span>
            </div>
            <input
              id="cost"
              type="range"
              min={15}
              max={60}
              value={hourlyCost}
              onChange={(e) => setHourlyCost(Number(e.target.value))}
              className="mt-2 w-full accent-blue-950 dark:accent-blue-500"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center dark:border-blue-900 dark:bg-blue-950">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Estimated savings, at a {Math.round(AUTO_RESOLVE_RATE * 100)}% AI
            auto-resolve rate
          </p>
          <p className="mt-2 text-5xl font-bold text-blue-950 dark:text-blue-200">
            ${Math.round(dollarsSavedPerMonth).toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">per month</p>
          <p className="mt-4 text-xs text-blue-700 dark:text-blue-400">
            ≈ {Math.round(hoursSavedPerDay).toLocaleString()} agent-hours freed up
            every day
          </p>
        </div>
      </div>
    </div>
  );
}
