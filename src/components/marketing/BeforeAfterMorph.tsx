"use client";

import { useEffect, useRef, useState } from "react";

const DOTS = Array.from({ length: 24 });

export default function BeforeAfterMorph() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    function update() {
      const el = ref.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const raw = 1 - rect.top / vh;
        setProgress(Math.min(1, Math.max(0, raw)));
      }
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={ref} className="mx-auto max-w-3xl text-center">
      <h2 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
        {progress < 0.55
          ? "Traditional queues are chaos."
          : "AI-first queues stay calm."}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
        Keep scrolling — this is the same queue, before and after AI takes
        the first line.
      </p>
      <div
        className="mx-auto mt-12 grid max-w-md grid-cols-6 gap-3"
        style={{
          transform: `perspective(800px) rotateX(${(1 - progress) * 6}deg) scale(${
            0.94 + progress * 0.06
          })`,
        }}
      >
        {DOTS.map((_, i) => {
          const threshold = progress * DOTS.length;
          const isCalm = i < threshold;
          return (
            <span
              key={i}
              className={`h-8 w-8 rounded-full transition-colors duration-500 ${
                isCalm ? "bg-emerald-400" : "bg-red-400"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
