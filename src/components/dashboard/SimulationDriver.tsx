"use client";

import { useEffect } from "react";
import { TICK_INTERVAL_MS } from "@/lib/simulation/config";

export default function SimulationDriver() {
  useEffect(() => {
    function tick() {
      fetch("/api/simulate/tick", { method: "POST" }).catch(() => {});
    }
    tick(); // fire immediately so a freshly opened dashboard doesn't sit idle
    const interval = setInterval(tick, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}
