export type SiteLanguage = "en" | "es" | "ca";

// Every visible string of the home, the frame and the 404, one object per language.
export type SiteCopy = {
  // The home's title and link preview (title, description, the preview image's alt).
  meta: {
    title: string;
    description: string;
    imageAlt: string;
  };
  // The 404 page's block in this language.
  notFound: {
    title: string;
    body: string;
    home: string;
    deleteAccount: string;
  };
  // The header and its phone menu, on every page.
  frame: {
    home: string;
    navigation: string;
    voice: string;
    features: string;
    questions: string;
    comingSoon: string;
    menu: string;
    language: string;
    appearance: string;
    light: string;
    dark: string;
    toDark: string;
    toLight: string;
    // The first Tab stop on every page; it moves focus to the main content.
    skipToContent: string;
    // The footer, on every page.
    footer: {
      navigation: string;
      legal: string;
      privacy: string;
      terms: string;
      legalNotice: string;
      deleteAccount: string;
      support: string;
      // `{company}` stands for the operator's name.
      operator: string;
      trademark: string;
      backToTop: string;
    };
  };
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
    title: string;
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
