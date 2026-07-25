import { useEffect } from "react";

/**
 * Scroll reveal: elements with [data-reveal] fade+slide in when they enter view.
 * Optional data-reveal-delay="120" (ms).
 */
export function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!els.length) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      els.forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    els.forEach((el) => {
      el.classList.add("reveal-init");
      const d = el.dataset.revealDelay;
      if (d) el.style.transitionDelay = `${d}ms`;
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-revealed");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
