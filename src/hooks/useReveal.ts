import { useEffect } from "react";

/**
 * Bidirectional scroll reveal + scrub.
 * - [data-reveal] elements fade/slide in when entering view and reverse when leaving.
 * - [data-scrub] elements get a live --scrub CSS var (0 → 1) tied to their viewport progress,
 *   which components can use for translate / scale / opacity effects.
 * Optional data-reveal-delay="120" (ms).
 */
export function useReveal() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const revealEls = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const scrubEls = Array.from(document.querySelectorAll<HTMLElement>("[data-scrub]"));

    if (reduce) {
      revealEls.forEach((el) => el.classList.add("is-revealed"));
      scrubEls.forEach((el) => el.style.setProperty("--scrub", "1"));
      return;
    }

    revealEls.forEach((el) => {
      el.classList.add("reveal-init");
      const d = el.dataset.revealDelay;
      if (d) el.style.transitionDelay = `${d}ms`;
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const target = e.target as HTMLElement;
          if (e.isIntersecting) {
            target.classList.add("is-revealed");
          } else {
            // Only reverse when the element is clearly out of view (avoids flicker at edges).
            if (e.intersectionRatio === 0) target.classList.remove("is-revealed");
          }
        });
      },
      { threshold: [0, 0.12, 0.5], rootMargin: "0px 0px -60px 0px" },
    );
    revealEls.forEach((el) => io.observe(el));

    // Scrub: update a --scrub custom prop based on element position in viewport.
    let raf = 0;
    const updateScrub = () => {
      const vh = window.innerHeight || 1;
      // Global page scroll progress (0 at top → 1 after ~600px).
      const pageP = Math.max(0, Math.min(1, window.scrollY / 600));
      document.documentElement.style.setProperty("--page-scrub", pageP.toFixed(3));
      scrubEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        // Progress: 0 when element top is at bottom of viewport, 1 when it has scrolled past top.
        const p = 1 - (r.top + r.height * 0.3) / vh;
        const clamped = Math.max(0, Math.min(1, p));
        el.style.setProperty("--scrub", clamped.toFixed(3));
      });
      raf = 0;
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(updateScrub);
    };
    updateScrub();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}
