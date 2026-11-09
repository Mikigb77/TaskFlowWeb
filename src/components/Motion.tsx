"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * The site's scroll and pointer motion, in one place, mounted once in the layout and run again
 * on every page (after a language switch, say), the way garbar.tech moves:
 *
 * - `[data-reveal]` elements get `data-visible` the first time they scroll into view, which plays
 *   their entrance (global.css, "Motion").
 * - `<html>` gets `data-scrolled` once the page leaves the top, and `--scroll` (0 to 1) for the
 *   reading progress bar.
 * - `[data-pointer]` elements get `--mx` and `--my` (0 to 1) as a mouse moves over them, for the
 *   soft lights on the cards and the phone's gentle tilt. Touch never moves anything.
 *
 * Nothing is hidden until this runs and sets `data-motion="full"` on `<html>`, so without
 * JavaScript every part of the page is simply there. Under `prefers-reduced-motion: reduce`,
 * everything is shown at once and nothing follows the pointer or the scroll position.
 */
export default function Motion() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const observing = !reduced && "IntersectionObserver" in window;
    root.dataset.motion = observing ? "full" : "reduced";

    const reveal = (element: Element) =>
      element.setAttribute("data-visible", "");
    const hidden = document.querySelectorAll(
      "[data-reveal]:not([data-visible])",
    );
    const observer = observing
      ? new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                reveal(entry.target);
                observer?.unobserve(entry.target);
              }
            }
          },
          { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
        )
      : null;
    hidden.forEach((element) =>
      observer ? observer.observe(element) : reveal(element),
    );

    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const max = root.scrollHeight - window.innerHeight;
      root.toggleAttribute("data-scrolled", y > 12);
      root.style.setProperty(
        "--scroll",
        max > 0 ? Math.min(1, y / max).toFixed(4) : "0",
      );
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const pointerTargets = reduced
      ? []
      : Array.from(document.querySelectorAll<HTMLElement>("[data-pointer]"));
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const target = event.currentTarget as HTMLElement;
      const box = target.getBoundingClientRect();
      target.style.setProperty(
        "--mx",
        ((event.clientX - box.left) / box.width).toFixed(3),
      );
      target.style.setProperty(
        "--my",
        ((event.clientY - box.top) / box.height).toFixed(3),
      );
      target.setAttribute("data-hover", "");
    };
    const onLeave = (event: PointerEvent) => {
      const target = event.currentTarget as HTMLElement;
      target.style.removeProperty("--mx");
      target.style.removeProperty("--my");
      target.removeAttribute("data-hover");
    };
    for (const target of pointerTargets) {
      target.addEventListener("pointermove", onPointer);
      target.addEventListener("pointerleave", onLeave);
    }

    return () => {
      observer?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      for (const target of pointerTargets) {
        target.removeEventListener("pointermove", onPointer);
        target.removeEventListener("pointerleave", onLeave);
      }
    };
  }, [pathname]);

  return <div className="scroll-progress" aria-hidden="true" />;
}
