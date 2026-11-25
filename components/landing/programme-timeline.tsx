"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Award,
  Coffee,
  Laptop,
  Lightbulb,
  MessagesSquare,
  Mic,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { Period, SessionType } from "@/data/programme";
import { cn } from "@/lib/utils";

export type TimelineItem = {
  time: string;
  end: string;
  period: Period;
  type: SessionType;
  title: string;
  speaker?: string;
  note?: string;
  tbc?: boolean;
};

const ICONS: Record<SessionType, LucideIcon> = {
  ceremonie: Sparkles,
  conference: Mic,
  projet: Lightbulb,
  pause: Coffee,
  echange: MessagesSquare,
  atelier: Laptop,
  cloture: Award,
};

const FILTERS = ["all", "matin", "apres-midi"] as const;
type Filter = (typeof FILTERS)[number];

export function ProgrammeTimeline({ items }: { items: TimelineItem[] }) {
  const t = useTranslations("programme");
  const [filter, setFilter] = useState<Filter>("all");
  const visible = items.filter((item) => filter === "all" || item.period === filter);

  return (
    <div>
      <div
        role="group"
        aria-label={t("filterLabel")}
        className="glass inline-flex max-w-full gap-1 rounded-full p-1.5"
      >
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={cn(
              "cursor-pointer rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-300 sm:px-5",
              filter === value
                ? "bg-linear-to-r from-navy to-royal text-white shadow-md"
                : "text-navy hover:bg-navy/5",
            )}
          >
            {t(`filters.${value}`)}
          </button>
        ))}
      </div>

      <ol className="relative mt-9">
        {/* Ligne verticale de la frise */}
        <span
          aria-hidden="true"
          className="absolute start-[1.375rem] top-3 bottom-3 w-px bg-linear-to-b from-azure/70 via-lavender/60 to-mint/60 sm:start-[6.875rem]"
        />
        {visible.map((item) => {
          const Icon = ICONS[item.type];
          const isBreak = item.type === "pause";
          return (
            <li
              key={`${filter}-${item.time}`}
              className="relative flex animate-rise gap-4 pb-4 last:pb-0 sm:gap-6"
            >
              <time
                dateTime={item.time}
                className="hidden w-16 shrink-0 pt-3 text-end text-lg font-extrabold text-navy tabular-nums sm:block"
              >
                {item.time}
              </time>
              <span
                aria-hidden="true"
                className={cn(
                  "relative z-10 grid size-11 shrink-0 place-items-center rounded-full border-[1.5px] bg-white",
                  isBreak ? "border-lavender/60 text-muted" : "border-azure/50 text-navy",
                )}
              >
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <article
                className={cn(
                  "min-w-0 flex-1 rounded-2xl px-5 py-4 transition-all duration-300",
                  isBreak
                    ? "border border-dashed border-lavender/60 bg-white/40"
                    : "glass hover:-translate-y-0.5 hover:shadow-lift",
                )}
              >
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold tracking-wide text-muted uppercase rtl:text-sm rtl:tracking-normal">
                  <span className="text-sm font-extrabold text-navy tabular-nums sm:hidden">
                    {item.time}
                  </span>
                  <span className="text-mint-dark">{t(`types.${item.type}`)}</span>
                  <span className="font-medium normal-case tabular-nums">
                    <span className="sr-only">{t("timeRange", { start: item.time, end: item.end })}</span>
                    <span aria-hidden="true">
                      {item.time} – {item.end}
                    </span>
                  </span>
                  {item.tbc ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[0.7rem] font-bold text-amber-900 normal-case rtl:text-xs">
                      {t("tbc")}
                    </span>
                  ) : null}
                </p>
                <h3 className="mt-1.5 text-lg leading-snug font-bold">{item.title}</h3>
                {item.speaker ? (
                  <p className="mt-1 text-[0.95rem] text-ink">
                    <span className="font-semibold text-navy" dir="auto">
                      {item.speaker}
                    </span>
                    {item.note ? <span className="text-muted"> · {item.note}</span> : null}
                  </p>
                ) : null}
              </article>
            </li>
          );
        })}
      </ol>

      <p className="mt-6 text-sm text-muted">{t("disclaimer")}</p>
    </div>
  );
}
