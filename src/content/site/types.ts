export type SiteLanguage = "en" | "es" | "ca";

// Every visible string of the home, one object per language. A string in a list renders as
// its own line.
export type SiteCopy = {
  hero: {
    // `title` ends with the space before `titleAccent`, so the heading's name keeps it.
    title: string;
    titleAccent: string;
    description: string;
    primary: string;
    secondary: string;
    status: string;
    voiceQuote: string;
    imageAlt: string;
  };
  features: {
    title: string;
    calendar: {
      title: string;
      body: string;
      header: string;
      weekdays: string[];
      events: { title: string; detail: string }[];
    };
    voice: { title: string; body: string; link: string };
    details: { title: string; body: string };
    offline: { title: string; body: string };
  };
  faq: {
    eyebrow: string;
    title: string;
    intro: string[];
    doodle: string[];
    items: { question: string; answer: string }[];
  };
  closing: {
    title: string;
    body: string;
    button: string;
    // WD2's free-plan line, worded as decided.
    plans: string;
  };
};
