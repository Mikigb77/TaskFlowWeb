"use client";

import { useEffect, useRef } from "react";

// A soft green glow that follows the mouse across the page, as on garbar.tech. Only for a
// fine pointer that hovers (not touch), and left out under prefers-reduced-motion.
// Decoration only: hidden from assistive technology and from the mouse.
export default function CursorGlow() {
  const glow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = glow.current;
    if (!element) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || still.matches) return;
    let frame = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      frame = 0;
      element.style.setProperty("--glow-x", `${x}px`);
      element.style.setProperty("--glow-y", `${y}px`);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x = event.clientX;
      y = event.clientY;
      element.classList.add("is-on");
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const leave = () => element.classList.remove("is-on");
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);
  return <div ref={glow} className="cursor-glow" aria-hidden="true" />;
}
