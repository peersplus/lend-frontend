import { useEffect, useState } from "react";
import heroHandoff from "@/assets/hero-handoff.jpg";
import heroHospital from "@/assets/hero-hospital.jpg";
import heroBaby from "@/assets/hero-baby.jpg";
import heroKitchen from "@/assets/hero-kitchen.jpg";
import heroGarden from "@/assets/hero-garden.jpg";
import heroElectronics from "@/assets/hero-electronics.jpg";

type Slide = {
  src: string;
  alt: string;
  emoji: string;
  category: string;
  caption: string;
  target: string;
};

const SLIDES: Slide[] = [
  {
    src: heroHandoff,
    alt: "A neighbor handing a toolbox with a drill and hammer to another neighbor on a warm front porch",
    emoji: "🔧",
    category: "Tools",
    caption: "Borrow the ladder you use twice a year.",
    target: "cat-tools",
  },
  {
    src: heroHospital,
    alt: "A kind neighbor walking with an elderly woman to a community clinic in soft morning light",
    emoji: "🩺",
    category: "Hospital companion",
    caption: "Someone to go with you to the hospital.",
    target: "cat-medical",
  },
  {
    src: heroBaby,
    alt: "A neighbor handing a stroller and folded baby chair to a young mother on a sunlit porch",
    emoji: "🍼",
    category: "Baby & family",
    caption: "Strollers, cribs & baby gear for the day.",
    target: "cat-baby",
  },
  {
    src: heroKitchen,
    alt: "A neighbor lending a stand mixer and blender at a warm home entrance",
    emoji: "🍳",
    category: "Kitchen",
    caption: "One mixer. Every birthday cake on the street.",
    target: "cat-kitchen",
  },
  {
    src: heroGarden,
    alt: "Neighbors sharing a lawnmower and hedge trimmer on a green front lawn",
    emoji: "🌿",
    category: "Garden",
    caption: "Trim the hedge without buying the trimmer.",
    target: "cat-garden",
  },
  {
    src: heroElectronics,
    alt: "A neighbor lending a laptop and projector at an apartment door in warm evening light",
    emoji: "💻",
    category: "Electronics",
    caption: "Movie night gear, from your neighbor's shelf.",
    target: "browse",
  },
];

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
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 4500);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Ways neighbors help each other on Peers Plus"
    >
      <div className="relative overflow-hidden rounded-[2rem] ring-1 ring-black/5 shadow-2xl shadow-bark/10">
        <div className="relative aspect-[1200/1408] w-full">
          {SLIDES.map((s, idx) => (
            <img
              key={s.src}
              src={s.src}
              alt={s.alt}
              width={1200}
              height={1408}
              loading={idx === 0 ? "eager" : "lazy"}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
                idx === i ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden={idx !== i}
            />
          ))}

          {/* Bottom gradient + caption */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-bark/85 via-bark/40 to-transparent p-6 pt-24 text-cream">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/80">
              <span aria-hidden className="text-base">
                {SLIDES[i].emoji}
              </span>
              {SLIDES[i].category}
            </div>
            <p className="mt-1 font-display text-xl italic leading-snug md:text-2xl">
              "{SLIDES[i].caption}"
            </p>
          </div>

          {/* Prev / next */}
          <button
            type="button"
            onClick={() => setI((v) => (v - 1 + SLIDES.length) % SLIDES.length)}
            aria-label="Previous story"
            className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-cream/85 text-bark shadow-md backdrop-blur transition hover:bg-cream"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setI((v) => (v + 1) % SLIDES.length)}
            aria-label="Next story"
            className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-cream/85 text-bark shadow-md backdrop-blur transition hover:bg-cream"
          >
            ›
          </button>
        </div>
      </div>

      {/* Dots */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {SLIDES.map((s, idx) => (
          <button
            key={s.category}
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

      {/* Floating card */}
      <div className="absolute -bottom-6 -left-6 hidden max-w-[260px] rounded-2xl border border-border bg-card p-4 shadow-xl md:block">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full bg-leaf/15 font-display italic text-leaf">
            P
          </div>
          <div>
            <p className="text-sm font-semibold">Peers Plus</p>
            <p className="text-[11px] text-muted-foreground">New on your block</p>
          </div>
        </div>
        <p className="text-xs leading-relaxed italic text-muted-foreground">
          "Start a sharing circle on your street. List one item — or offer to walk a neighbor to a checkup."
        </p>
      </div>
      <div className="absolute -top-4 right-4 rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent-foreground shadow-lg">
        🚨 Post the first urgent request
      </div>
    </div>
  );
}
