"use client";

import { useEffect } from "react";
import { TICK_INTERVAL_MS } from "@/lib/simulation/config";

export default function SimulationDriver() {
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/simulate/tick", { method: "POST" }).catch(() => {});
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}
