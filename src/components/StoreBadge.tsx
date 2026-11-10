import { family } from "../content/site/family";
import type { SiteLanguage } from "../content/site/types";

// "Coming soon to Google Play", drawn as a store badge the way Lucid Saga draws its own. Not a
// link: TaskFlow isn't on Google Play yet.
export default function StoreBadge({
  language,
  className = "",
}: {
  language: SiteLanguage;
  className?: string;
}) {
  const { store } = family[language];
  return (
    <p className={`store-badge ${className}`}>
      <svg
        className="store-badge-play"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M6 3.8v16.4c0 .8.9 1.3 1.6.9l13.3-8.2c.6-.4.6-1.3 0-1.7L7.6 2.9C6.9 2.5 6 3 6 3.8Z" />
      </svg>
      <span className="store-badge-text">
        <small>{store.top}</small>
        <strong>{store.name}</strong>
      </span>
    </p>
  );
}
