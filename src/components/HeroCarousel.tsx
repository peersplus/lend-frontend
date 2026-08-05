import { useEffect, useMemo, useState } from "react";
import heroHandoff600Jpg from "@/assets/optimized/hero-handoff-600.jpg";
import heroHandoff480Webp from "@/assets/optimized/hero-handoff-480.webp";
import heroHandoff800Webp from "@/assets/optimized/hero-handoff-800.webp";
import heroHospital600Jpg from "@/assets/optimized/hero-hospital-600.jpg";
import heroHospital480Webp from "@/assets/optimized/hero-hospital-480.webp";
import heroHospital800Webp from "@/assets/optimized/hero-hospital-800.webp";
import heroBaby600Jpg from "@/assets/optimized/hero-baby-600.jpg";
import heroBaby480Webp from "@/assets/optimized/hero-baby-480.webp";
import heroBaby800Webp from "@/assets/optimized/hero-baby-800.webp";
import heroKitchen600Jpg from "@/assets/optimized/hero-kitchen-600.jpg";
import heroKitchen480Webp from "@/assets/optimized/hero-kitchen-480.webp";
import heroKitchen800Webp from "@/assets/optimized/hero-kitchen-800.webp";
import heroGarden600Jpg from "@/assets/optimized/hero-garden-600.jpg";
import heroGarden480Webp from "@/assets/optimized/hero-garden-480.webp";
import heroGarden800Webp from "@/assets/optimized/hero-garden-800.webp";
import heroElectronics600Jpg from "@/assets/optimized/hero-electronics-600.jpg";
import heroElectronics480Webp from "@/assets/optimized/hero-electronics-480.webp";
import heroElectronics800Webp from "@/assets/optimized/hero-electronics-800.webp";
import { getFestivalSpotlight } from "@/lib/seasonal";
import { DAY_THEMES } from "@/lib/utils";

type Slide = {
  id: string;
  src: string;
  srcSet: string;
  sizes: string;
  alt: string;
  emoji: string;
  category: string;
  tags: string[];
  dayFocus: number[];
  caption: string;
  target: string;
  ringBadges: Array<{
    kind: "item" | "user";
    label: string;
    emoji: string;
  }>;
};

const HERO_CAROUSEL_SIZES = "(min-width: 1024px) 420px, (min-width: 640px) 380px, 72vw";

const SLIDES: Slide[] = [
  {
    id: "tools",
    src: heroHandoff600Jpg,
    srcSet: `${heroHandoff480Webp} 480w, ${heroHandoff800Webp} 800w`,
    sizes: HERO_CAROUSEL_SIZES,
    alt: "A neighbor handing a toolbox with a drill and hammer to another neighbor on a warm front porch",
    emoji: "🔧",
    category: "Tools",
    tags: ["Tools", "Emergency", "Cleaning"],
    dayFocus: [1, 2, 6],
    caption: "Borrow the ladder you use twice a year.",
    target: "cat-tools",
    ringBadges: [
      { kind: "item", label: "Drill kit", emoji: "🧰" },
      { kind: "user", label: "Ravi", emoji: "🧑" },
      { kind: "item", label: "Ladder", emoji: "🪜" },
      { kind: "user", label: "Maya", emoji: "👩" },
    ],
  },
  {
    id: "medical",
    src: heroHospital600Jpg,
    srcSet: `${heroHospital480Webp} 480w, ${heroHospital800Webp} 800w`,
    sizes: HERO_CAROUSEL_SIZES,
    alt: "A kind neighbor walking with an elderly woman to a community clinic in soft morning light",
    emoji: "🩺",
    category: "Hospital companion",
    tags: ["Medical", "Emergency", "Family"],
    dayFocus: [0, 3],
    caption: "Someone to go with you to the hospital.",
    target: "cat-medical",
    ringBadges: [
      { kind: "user", label: "Aisha", emoji: "👩" },
      { kind: "item", label: "Wheelchair", emoji: "♿" },
      { kind: "user", label: "Noah", emoji: "🧑" },
      { kind: "item", label: "Care bag", emoji: "🎒" },
    ],
  },
  {
    id: "baby",
    src: heroBaby600Jpg,
    srcSet: `${heroBaby480Webp} 480w, ${heroBaby800Webp} 800w`,
    sizes: HERO_CAROUSEL_SIZES,
    alt: "A neighbor handing a stroller and folded baby chair to a young mother on a sunlit porch",
    emoji: "🍼",
    category: "Baby & family",
    tags: ["Baby", "Family", "Furniture"],
    dayFocus: [0, 5],
    caption: "Strollers, cribs & baby gear for the day.",
    target: "cat-baby",
    ringBadges: [
      { kind: "item", label: "Stroller", emoji: "🛒" },
      { kind: "user", label: "Sara", emoji: "👩" },
      { kind: "item", label: "Baby chair", emoji: "🪑" },
      { kind: "user", label: "Arjun", emoji: "🧑" },
    ],
  },
  {
    id: "kitchen",
    src: heroKitchen600Jpg,
    srcSet: `${heroKitchen480Webp} 480w, ${heroKitchen800Webp} 800w`,
    sizes: HERO_CAROUSEL_SIZES,
    alt: "A neighbor lending a stand mixer and blender at a warm home entrance",
    emoji: "🍳",
    category: "Kitchen",
    tags: ["Kitchen", "Party", "Furniture"],
    dayFocus: [4, 5],
    caption: "One mixer. Every birthday cake on the street.",
    target: "cat-kitchen",
    ringBadges: [
      { kind: "item", label: "Mixer", emoji: "🥣" },
      { kind: "user", label: "Lina", emoji: "👩" },
      { kind: "item", label: "Blender", emoji: "🥤" },
      { kind: "user", label: "Kabir", emoji: "🧑" },
    ],
  },
  {
    id: "garden",
    src: heroGarden600Jpg,
    srcSet: `${heroGarden480Webp} 480w, ${heroGarden800Webp} 800w`,
    sizes: HERO_CAROUSEL_SIZES,
    alt: "Neighbors sharing a lawnmower and hedge trimmer on a green front lawn",
    emoji: "🌿",
    category: "Garden",
    tags: ["Garden", "Tools", "Cleaning"],
    dayFocus: [2, 6],
    caption: "Trim the hedge without buying the trimmer.",
    target: "cat-garden",
    ringBadges: [
      { kind: "item", label: "Trimmer", emoji: "✂️" },
      { kind: "user", label: "Aman", emoji: "🧑" },
      { kind: "item", label: "Lawn kit", emoji: "🛠️" },
      { kind: "user", label: "Nora", emoji: "👩" },
    ],
  },
  {
    id: "electronics",
    src: heroElectronics600Jpg,
    srcSet: `${heroElectronics480Webp} 480w, ${heroElectronics800Webp} 800w`,
    sizes: HERO_CAROUSEL_SIZES,
    alt: "A neighbor lending a laptop and projector at an apartment door in warm evening light",
    emoji: "💻",
    category: "Electronics",
    tags: ["Electronics", "Party", "Sports"],
    dayFocus: [1, 5],
    caption: "Movie night gear, from your neighbor's shelf.",
    target: "browse",
    ringBadges: [
      { kind: "item", label: "Projector", emoji: "📽️" },
      { kind: "user", label: "Priya", emoji: "👩" },
      { kind: "item", label: "Laptop", emoji: "💻" },
      { kind: "user", label: "Omar", emoji: "🧑" },
    ],
  },
];

type SeasonalCarouselData = {
  slides: Slide[];
  modeLabel: string;
  modeBadge: string;
  dayLabel: string;
  dayline: string;
  festivalLabel: string | null;
};

const DAYWISE_LINES: Record<number, string> = {
  0: "Sunday: family prep, baby and support essentials.",
  1: "Monday: work and home-start essentials.",
  2: "Tuesday: practical tools and everyday fixes.",
  3: "Wednesday: support and care focused sharing.",
  4: "Thursday: hosting and gathering prep.",
  5: "Friday: social, kitchen, and celebration picks.",
  6: "Saturday: projects, repair, and activity gear.",
};

function getSeasonalSlides(date: Date): SeasonalCarouselData {
  const festival = getFestivalSpotlight(date);
  const day = date.getDay();
  const dayLabel = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
  const dayline = DAYWISE_LINES[day] || DAYWISE_LINES[1];

  const sorted = [...SLIDES].sort((a, b) => {
    const dayScoreA = a.dayFocus.includes(day) ? 2 : 0;
    const dayScoreB = b.dayFocus.includes(day) ? 2 : 0;

    const festScoreA = festival
      ? a.tags.some((tag) => festival.categories.includes(tag) || festival.label.toLowerCase().includes(tag.toLowerCase()))
        ? 4
        : 0
      : 0;
    const festScoreB = festival
      ? b.tags.some((tag) => festival.categories.includes(tag) || festival.label.toLowerCase().includes(tag.toLowerCase()))
        ? 4
        : 0
      : 0;

    return dayScoreB + festScoreB - (dayScoreA + festScoreA);
  });

  if (festival) {
    return {
      slides: sorted,
      modeLabel: festival.label,
      modeBadge: "Festival mode",
      dayLabel,
      dayline,
      festivalLabel: festival.label,
    };
  }

  return {
    slides: sorted,
    modeLabel: dayLabel,
    modeBadge: "Daywise mode",
    dayLabel,
    dayline,
    festivalLabel: null,
  };
}

function scrollToTarget(id: string) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id) ?? document.getElementById("browse");
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.add("ring-2", "ring-leaf", "ring-offset-2", "ring-offset-background", "rounded-2xl");
  window.setTimeout(() => {
    el.classList.remove("ring-2", "ring-leaf", "ring-offset-2", "ring-offset-background", "rounded-2xl");
  }, 1600);
}

export function HeroCarousel() {
  const seasonalData = useMemo(() => getSeasonalSlides(new Date()), []);
  const slides = seasonalData.slides;
  const daywisePreview = useMemo(() => slides.slice(0, 3).map((slide) => slide.category), [slides]);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const active = slides[i];
  const ringPositions = [
    "left-2 top-10 sm:left-4 sm:top-16",
    "right-2 top-14 sm:right-4 sm:top-20",
    "left-8 bottom-10 sm:left-12 sm:bottom-12",
    "right-8 bottom-8 sm:right-12 sm:bottom-10",
  ];
  const today = new Date();
  const dayTheme = DAY_THEMES[today.getDay()] || DAY_THEMES[1];
  const festivalSpotlight = getFestivalSpotlight(today);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  useEffect(() => {
    if (i >= slides.length) {
      setI(0);
    }
  }, [i, slides.length]);

  return (
    <div
      className="relative mx-auto w-full max-w-[560px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Ways neighbors help each other on Peers Plus"
    >
      <div className="relative aspect-square">
        <div className="pointer-events-none absolute inset-6 rounded-full border-[22px] border-clay/70 bg-clay/8 shadow-[0_24px_70px_rgba(180,90,45,0.2)] sm:inset-8" />

        <div className="pointer-events-none absolute inset-0">
          {active.ringBadges.map((badge, idx) => (
            <div
              key={`${active.category}-${badge.label}`}
              className={`absolute ${ringPositions[idx]} orbit-float`}
              style={{ animationDelay: `${idx * 180}ms` }}
            >
              <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-md backdrop-blur sm:text-xs ${
                badge.kind === "user"
                  ? "border-sky-200 bg-white/95 text-sky-700"
                  : "border-leaf/30 bg-white/95 text-bark"
              }`}>
                <span aria-hidden>{badge.emoji}</span>
                <span>{badge.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute inset-14 overflow-hidden rounded-full border-4 border-white/80 ring-1 ring-bark/8 shadow-xl sm:inset-16">
          {slides.map((s, idx) => (
            <img
              key={s.id}
              src={s.src}
              srcSet={s.srcSet}
              sizes={s.sizes}
              alt={s.alt}
              width={1200}
              height={1408}
              loading={idx === 0 ? "eager" : "lazy"}
              fetchPriority={idx === 0 ? "high" : "auto"}
              decoding="async"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
                idx === i ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden={idx !== i}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setI((v) => (v - 1 + slides.length) % slides.length)}
          aria-label="Previous story"
          className="absolute left-0 top-1/2 z-[3] grid size-10 -translate-y-1/2 place-items-center rounded-full bg-card text-bark shadow-md transition hover:bg-muted"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => setI((v) => (v + 1) % slides.length)}
          aria-label="Next story"
          className="absolute right-0 top-1/2 z-[3] grid size-10 -translate-y-1/2 place-items-center rounded-full bg-card text-bark shadow-md transition hover:bg-muted"
        >
          ›
        </button>

      
      </div>
 
      {/* Dots */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setI(idx)}
            aria-label={`Show ${s.category}`}
            aria-current={idx === i}
            className={`h-1.5 rounded-full transition-all ${
              idx === i ? "w-8 bg-leaf" : "w-3 bg-bark/25 hover:bg-bark/40"
            }`}
          />
        ))}
      </div>

     
      <div className="absolute -top-4 left-4 rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent-foreground shadow-lg">
      {festivalSpotlight ? `${festivalSpotlight.label} now live` : "Built for everyday trust and easier sharing"}
      </div>
       <div className=" bottom-0 left-1/2 hidden z-[4] w-[86%] -translate-x-1/2 rounded-2xl border border-border/70 bg-background/88 p-3 backdrop-blur">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              {seasonalData.modeBadge}
            </span>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
              {seasonalData.modeLabel}
            </span>
            <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {seasonalData.dayLabel} lineup
            </span>
          </div>

          <p className="mb-1 text-[11px] font-medium text-muted-foreground">
            {seasonalData.dayline}
          </p>
          <p className="mb-2 text-[11px] text-muted-foreground">
            Today shows: {daywisePreview.join(" → ")}
          </p>

          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <span aria-hidden>{active.emoji}</span>
            Auto loading now
          </div>
          <p className="mt-1 text-sm font-semibold text-foreground sm:text-base">{active.category}</p>
          <p className="text-xs text-muted-foreground sm:text-sm">{active.caption}</p>

          <button
            type="button"
            onClick={() => scrollToTarget(active.target)}
            aria-label={`Jump to ${active.category} in categories`}
            className="mt-2 inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            View {active.category}
          </button>
        </div>
    </div>
  );
}
