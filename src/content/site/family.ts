import type { SiteLanguage } from "./types";

// Copy for the product-facing refinement: TaskFlow as one of GarBar's two apps, beside
// Lucid Saga (garbar.tech, lucidsaga.garbar.tech). The section labels, the store badge,
// the real app screens in How it works, and the family band and footer.
export type FamilyCopy = {
  eyebrow: string;
  // A badge, not a link: the app isn't on Google Play yet.
  store: { top: string; name: string; label: string };
  languages: string;
  nav: { how: string; plans: string; cta: string };
  kickers: {
    how: string;
    features: string;
    plans: string;
    questions: string;
  };
  // What each How it works screen shows, in the step's order.
  screens: string[];
  // The phones' row of the four screens, scrolled sideways.
  family: {
    kicker: string;
    title: string;
    titleAccent: string;
    body: string;
    garbar: string;
    sibling: {
      label: string;
      name: string;
      tagline: string;
      body: string;
      link: string;
    };
  };
  footer: {
    product: string;
    company: string;
    legal: string;
    garbar: string;
    madeIn: string;
  };
};

export const GARBAR_URL = "https://garbar.tech";
export const LUCID_SAGA_URL = "https://lucidsaga.garbar.tech";

export const family: Record<SiteLanguage, FamilyCopy> = {
  en: {
    eyebrow: "Tasks by voice, for Android",
    store: {
      top: "Coming soon to",
      name: "Google Play",
      label: "Coming soon to Google Play",
    },
    languages: "English · Español · Català",
    nav: { how: "How it works", plans: "Plans", cta: "Try it" },
    kickers: {
      how: "How it works",
      features: "What it does",
      plans: "Plans",
      questions: "Questions",
    },
    screens: [
      "TaskFlow’s calendar, with the Add a task button at the bottom.",
      "TaskFlow listening to “Tomorrow, call the dentist and buy bread.”",
      "TaskFlow’s two things to add: Call the dentist and Buy bread, both for tomorrow.",
      "Tomorrow on TaskFlow’s calendar, with Call the dentist and Buy bread.",
    ],
    family: {
      kicker: "From GarBar",
      title: "Made in Barcelona,",
      titleAccent: "by GarBar.",
      body: "TaskFlow is one of GarBar’s own apps. GarBar is a technology company in Barcelona that builds its apps with AI and a lot of care for design.",
      garbar: "Visit garbar.tech",
      sibling: {
        label: "Also from GarBar",
        name: "Lucid Saga",
        tagline: "The story that remembers.",
        body: "An endless AI story game. Pick a world or dream up your own in one line, and the story remembers everything you do.",
        link: "Explore Lucid Saga",
      },
    },
    footer: {
      product: "TaskFlow",
      company: "GarBar",
      legal: "Legal",
      garbar: "garbar.tech",
      madeIn: "Made in Barcelona.",
    },
  },
  es: {
    eyebrow: "Tareas con la voz, para Android",
    store: {
      top: "Próximamente en",
      name: "Google Play",
      label: "Próximamente en Google Play",
    },
    languages: "English · Español · Català",
    nav: { how: "Cómo funciona", plans: "Planes", cta: "Pruébala" },
    kickers: {
      how: "Cómo funciona",
      features: "Qué hace",
      plans: "Planes",
      questions: "Preguntas",
    },
    screens: [
      "El calendario de TaskFlow, con el botón Añadir tarea abajo.",
      "TaskFlow escuchando «Mañana, llamar al dentista y comprar pan.»",
      "Las dos cosas para añadir en TaskFlow: Llamar al dentista y Comprar pan, las dos para mañana.",
      "Mañana en el calendario de TaskFlow, con Llamar al dentista y Comprar pan.",
    ],
    family: {
      kicker: "De GarBar",
      title: "Hecha en Barcelona,",
      titleAccent: "por GarBar.",
      body: "TaskFlow es una de las apps propias de GarBar, una empresa tecnológica de Barcelona que crea sus apps con IA y mucho cuidado por el diseño.",
      garbar: "Visita garbar.tech",
      sibling: {
        label: "También de GarBar",
        name: "Lucid Saga",
        tagline: "La historia que recuerda.",
        body: "Un juego de historias sin fin con IA. Elige un mundo o imagina el tuyo en una frase, y la historia recuerda todo lo que haces.",
        link: "Descubre Lucid Saga",
      },
    },
    footer: {
      product: "TaskFlow",
      company: "GarBar",
      legal: "Legal",
      garbar: "garbar.tech",
      madeIn: "Hecha en Barcelona.",
    },
  },
  ca: {
    eyebrow: "Tasques amb la veu, per a Android",
    store: {
      top: "Aviat a",
      name: "Google Play",
      label: "Aviat a Google Play",
    },
    languages: "English · Español · Català",
    nav: { how: "Com funciona", plans: "Plans", cta: "Prova-la" },
    kickers: {
      how: "Com funciona",
      features: "Què fa",
      plans: "Plans",
      questions: "Preguntes",
    },
    screens: [
      "El calendari de TaskFlow, amb el botó Afegeix una tasca a baix.",
      "TaskFlow escoltant «Demà, trucar al dentista i comprar pa.»",
      "Les dues coses per afegir a TaskFlow: Trucar al dentista i Comprar pa, totes dues per a demà.",
      "Demà al calendari de TaskFlow, amb Trucar al dentista i Comprar pa.",
    ],
    family: {
      kicker: "De GarBar",
      title: "Feta a Barcelona,",
      titleAccent: "per GarBar.",
      body: "TaskFlow és una de les apps pròpies de GarBar, una empresa tecnològica de Barcelona que crea les seves apps amb IA i molta cura pel disseny.",
      garbar: "Visita garbar.tech",
      sibling: {
        label: "També de GarBar",
        name: "Lucid Saga",
        tagline: "La història que recorda.",
        body: "Un joc d’històries sense fi amb IA. Tria un món o imagina’n un en una frase, i la història recorda tot el que fas.",
        link: "Descobreix Lucid Saga",
      },
    },
    footer: {
      product: "TaskFlow",
      company: "GarBar",
      legal: "Legal",
      garbar: "garbar.tech",
      madeIn: "Feta a Barcelona.",
    },
  },
};
