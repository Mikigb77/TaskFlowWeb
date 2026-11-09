"use client";

import { useEffect, useRef } from "react";

type Mote = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
  speed: number;
};

/**
 * Motes of light drifting up, like the fireflies around Lucid Saga's gate, in TaskFlow's
 * colours: green on the light page, lime on the dark one and on the closing card. Drawn on a
 * canvas, paused while off screen or in a background tab, and left out entirely under
 * prefers-reduced-motion. Decoration only: hidden from assistive technology and from the mouse.
 */
export default function Motes({
  className,
  tone = "auto",
  density = 15000,
}: {
  className?: string;
  /** "light" draws lime motes for a dark surface; "auto" follows the page's theme. */
  tone?: "auto" | "light";
  /** Square pixels per mote: smaller means more of them. */
  density?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // The colour, read from the theme each time it's drawn, so a theme switch carries over.
    const colour = () => {
      if (tone === "light") return "212, 236, 163";
      const root = document.documentElement;
      const dark =
        root.dataset.theme === "dark" ||
        (root.dataset.theme !== "light" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      return dark ? "212, 236, 163" : "60, 154, 115";
    };

    let width = 0;
    let height = 0;
    let motes: Mote[] = [];
    let frame = 0;
    let visible = true;
    let last = performance.now();

    const spawn = (anywhere: boolean): Mote => ({
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : height + 10,
      r: 1 + Math.random() * 2.4,
      vx: (Math.random() - 0.5) * 6,
      vy: -(5 + Math.random() * 12),
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 1.4,
    });

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(48, Math.round((width * height) / density));
      motes = Array.from({ length: count }, () => spawn(true));
    };

    const draw = (now: number) => {
      frame = 0;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const rgb = colour();
      context.clearRect(0, 0, width, height);
      for (const mote of motes) {
        mote.phase += dt * mote.speed;
        mote.x += (mote.vx + Math.sin(mote.phase * 1.3) * 8) * dt;
        mote.y += mote.vy * dt;
        if (mote.y < -20 || mote.x < -20 || mote.x > width + 20) {
          Object.assign(mote, spawn(false));
        }
        const flicker =
          0.35 + 0.65 * Math.pow(Math.sin(mote.phase) * 0.5 + 0.5, 2);
        const fadeTop = Math.max(0, Math.min(1, mote.y / (height * 0.25)));
        const alpha = flicker * fadeTop;
        const size = mote.r * 4;
        const glow = context.createRadialGradient(
          mote.x,
          mote.y,
          0,
          mote.x,
          mote.y,
          size,
        );
        glow.addColorStop(0, `rgba(${rgb}, ${0.6 * alpha})`);
        glow.addColorStop(0.35, `rgba(${rgb}, ${0.2 * alpha})`);
        glow.addColorStop(1, `rgba(${rgb}, 0)`);
        context.fillStyle = glow;
        context.fillRect(mote.x - size, mote.y - size, size * 2, size * 2);
      }
      if (visible) frame = requestAnimationFrame(draw);
    };

    const start = () => {
      if (!frame && visible && !document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(draw);
      }
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    resize();
    start();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    intersection.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [tone, density]);

  return (
    <canvas
      ref={canvasRef}
      className={className ? `motes ${className}` : "motes"}
      aria-hidden="true"
    />
  );
}
