import Image from "next/image";
import { copy, type SiteLanguage } from "../content/site";

// The app's own Calendar in the page's language. Both themes load lazily with a high
// priority, so only the visible one downloads (Next's guidance for a light and dark pair).
export default function Phone({
  language,
  className = "",
}: {
  language: SiteLanguage;
  className?: string;
}) {
  const alt = copy[language].hero.imageAlt;
  return (
    <div className={`phone ${className}`}>
      <div className="phone-camera" aria-hidden="true"></div>
      <div className="phone-screen">
        {(["light", "dark"] as const).map((theme) => (
          <Image
            key={theme}
            className={`${theme}-only`}
            src={`/images/hero-calendar-${language}-${theme}.png`}
            width={780}
            height={1688}
            sizes="(max-width: 580px) 272px, 300px"
            alt={alt}
            fetchPriority="high"
          />
        ))}
      </div>
    </div>
  );
}
