const paths: Record<string, string[]> = {
  asterisk: ["M12 2v20M2 12h20M5 5l14 14M5 19 19 5"],
  arrow: ["M4 12h16", "m14 6 6 6-6 6"],
  arrowUp: ["M6 18 18 6", "M6 6h12v12"],
  chevron: ["m9 5 7 7-7 7"],
  check: ["m5 12 4 4L19 6"],
  logo: ["m3 12 5 5L19 6", "m13 14 3 3 7-8"],
  calendar: [
    "M8 2v4M16 2v4",
    "M3 10h18",
    "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2",
    "M7 14h2m6 0h2m-10 4h2m6 0h2",
  ],
  mic: [
    "M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5",
    "M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8",
  ],
  sun: [
    "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8",
    "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5",
  ],
  moon: ["M20.8 14.1A9 9 0 0 1 9.9 3.2a9 9 0 1 0 10.9 10.9Z"],
  plus: ["M12 5v14M5 12h14"],
  play: ["m9 5 11 7-11 7V5Z"],
  notes: [
    "M8 7h8M8 12h8m-8 5h5",
    "M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2",
  ],
  cloud: [
    "M7 18a5 5 0 1 1 .5-10A6 6 0 0 1 19 10a4 4 0 0 1-1 8",
    "m9 16 3-3 3 3M12 13v9",
  ],
  clock: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18", "M12 7v5l3 2"],
  spark: ["m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"],
  leaf: ["M20 3c-9-1-16 2-16 9a7 7 0 0 0 7 7c7 0 10-7 9-16Z", "M3 21 15 9"],
  shield: ["m12 2 8 3v7c0 5-8 10-8 10S4 17 4 12V5l8-3Z", "m8 12 3 3 5-6"],
  wifiOff: [
    "m2 2 20 20",
    "M8.5 16.5a5 5 0 0 1 5.5-1M5 13a10 10 0 0 1 5-2M2 9a16 16 0 0 1 5-3m5-1a16 16 0 0 1 10 4m-7 2a10 10 0 0 1 4 2",
    "M12 20h.01",
  ],
};

export default function Icon({
  name,
  size = 20,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {(paths[name] || paths.spark).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
