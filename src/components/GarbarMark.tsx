// GarBar's mark, as garbar.tech and Lucid Saga draw it: a G and a B sharing one stroke.
export default function GarbarMark({ size = 18 }: { size?: number }) {
  return (
    <svg
      className="garbar-mark"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d="M20 11H16C9.373 11 4 16.373 4 23S9.373 35 16 35H26V23H17"
        stroke="currentColor"
      />
      <path
        d="M26 11H34A6 6 0 0 1 34 23H26M26 23H35A6 6 0 0 1 35 35H26V11"
        stroke="#ff5b35"
      />
    </svg>
  );
}
