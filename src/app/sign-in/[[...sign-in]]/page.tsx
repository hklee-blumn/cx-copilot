import { Alex_Brush } from "next/font/google";
import { SignIn } from "@clerk/nextjs";
import Reveal from "@/components/marketing/Reveal";
import AnimatedStat from "@/components/marketing/AnimatedStat";
import ScrollProgressBar from "@/components/marketing/ScrollProgressBar";
import ParallaxLayer from "@/components/marketing/ParallaxLayer";
import BeforeAfterMorph from "@/components/marketing/BeforeAfterMorph";
import RoiCalculator from "@/components/marketing/RoiCalculator";

const logoFont = Alex_Brush({ weight: "400", subsets: ["latin"] });

const STEPS = [
  {
    n: "1",
    title: "AI handles it first",
    body: "Every conversation starts with AI — answering FAQs, checking order status, and resolving policy-based requests instantly, 24/7.",
  },
  {
    n: "2",
    title: "Continuous triage, not a queue",
    body: "Claude assesses mood, confidence, and policy gray areas on every turn — flagging risk early instead of waiting for a hard escalation.",
  },
  {
    n: "3",
    title: "Agents see only what matters",
    body: "Only conversations that truly need a human reach your team, prioritized by urgency, with full context already gathered.",
  },
];

const TREND = [
  { year: "2023", value: 18 },
  { year: "2024", value: 34 },
  { year: "2025", value: 52 },
  { year: "2026", value: 71 },
];

export default function SignInPage() {
  return (
    <div id="top" className="flex flex-1 flex-col overflow-x-hidden bg-white dark:bg-zinc-950">
      <div className="sticky top-0 z-50">
        <div className="flex w-full items-center bg-blue-950 px-6 py-3">
          <span className={`${logoFont.className} text-3xl text-white`}>JL</span>
        </div>
        <ScrollProgressBar />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-white px-6 py-20 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950 sm:py-28">
        <ParallaxLayer speed={0.25} className="pointer-events-none absolute -left-32 -top-24">
          <div
            aria-hidden
            className="animate-drift-a h-96 w-96 rounded-full bg-blue-200/50 blur-3xl dark:bg-blue-900/30"
          />
        </ParallaxLayer>
        <ParallaxLayer speed={-0.15} className="pointer-events-none absolute -right-24 top-40">
          <div
            aria-hidden
            className="animate-drift-b h-80 w-80 rounded-full bg-sky-200/50 blur-3xl dark:bg-indigo-900/30"
          />
        </ParallaxLayer>

        <div className="relative mx-auto grid w-full max-w-6xl gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
              AI-first support, built for contact centers.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
              CX Copilot lets AI handle the majority of customer conversations
              end-to-end — routing only what truly needs a human to your
              team, with full visibility into every conversation as it
              happens.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {["70% auto-resolved", "< 2 min avg. response", "24/7 coverage"].map(
                (chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200"
                  >
                    {chip}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <SignIn fallbackRedirectUrl="/dashboard" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-to-b from-indigo-50 to-white px-6 py-24 dark:from-zinc-900 dark:to-zinc-950">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="text-center text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              How it works
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delayMs={i * 120}>
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-950 text-sm font-semibold text-white dark:bg-blue-500">
                    {step.n}
                  </span>
                  <h3 className="mt-4 font-semibold text-zinc-900 dark:text-zinc-50">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Before / after — transforms as you scroll through it */}
      <section className="bg-white px-6 py-32 dark:bg-zinc-950">
        <BeforeAfterMorph />
      </section>

      {/* Stats */}
      <section className="bg-gradient-to-b from-white to-sky-50 px-6 py-24 dark:from-zinc-950 dark:to-zinc-900">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="text-center text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              The efficiency gain is measurable
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-zinc-600 dark:text-zinc-400">
              Illustrative figures for a contact center adopting an AI-first
              front line.
            </p>
          </Reveal>
          <div className="mt-14 grid grid-cols-2 gap-10 sm:grid-cols-4">
            <Reveal delayMs={0}>
              <AnimatedStat value={68} suffix="%" label="of inquiries resolved without a human" />
            </Reveal>
            <Reveal delayMs={100}>
              <AnimatedStat value={3.4} suffix="x" label="faster time-to-resolution" />
            </Reveal>
            <Reveal delayMs={200}>
              <AnimatedStat value={24} suffix="/7" label="always-on coverage" />
            </Reveal>
            <Reveal delayMs={300}>
              <AnimatedStat value={41} suffix="%" label="lower cost per resolved conversation" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ROI calculator */}
      <section className="bg-white px-6 py-24 dark:bg-zinc-950">
        <Reveal>
          <h2 className="text-center text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            What would this save your team?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-zinc-600 dark:text-zinc-400">
            Drag the sliders to match your contact center.
          </p>
        </Reveal>
        <Reveal delayMs={150} className="mt-14">
          <RoiCalculator />
        </Reveal>
      </section>

      {/* Trend */}
      <section className="bg-gradient-to-b from-sky-50 to-blue-50 px-6 py-24 dark:from-zinc-900 dark:to-zinc-900">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-center text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              More contact centers are going AI-first
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-zinc-600 dark:text-zinc-400">
              Share of contact centers with an AI agent as their first line
              of support.
            </p>
          </Reveal>
          <Reveal delayMs={150}>
            <div className="mt-14 flex items-end justify-center gap-8 sm:gap-12">
              {TREND.map((t) => (
                <div key={t.year} className="flex flex-col items-center gap-3">
                  <div className="flex h-48 w-12 items-end overflow-hidden rounded-full bg-white dark:bg-zinc-800">
                    <div
                      className="w-full rounded-full bg-gradient-to-t from-blue-950 to-sky-500 transition-[height] duration-1000 ease-out"
                      style={{ height: `${t.value}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {t.value}%
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t.year}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-gradient-to-b from-blue-50 to-white px-6 py-24 dark:from-zinc-900 dark:to-zinc-950">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            See it live on your team's queue.
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Sign in above to watch AI and your agents handle a live queue
            together, in real time.
          </p>
          <a
            href="#top"
            className="mt-6 inline-block rounded-full bg-blue-950 px-6 py-3 text-sm font-medium text-white hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            Back to sign in
          </a>
        </Reveal>
      </section>
    </div>
  );
}
