import type { SiteLanguage } from "./types";

// Extra copy for the "Daybook" and "Pop" explorations. Every fact here is already on the
// site or in the app's docs: the limits come from the FAQ and the feature copy.
export type ExploreCopy = {
  daybook: {
    edition: string;
    tagline: string;
    tomorrow: string;
    todo: string;
    indexTitle: string;
    receiptFree: string;
    receiptPro: string;
    priceLater: string;
    zero: string;
  };
  pop: {
    sticker: string;
    inOut: string;
    inLabel: string;
    outLabel: string;
    numbersTitle: string;
    numbers: { value: string; label: string }[];
    scrollHint: string;
  };
};

export const explore: Record<SiteLanguage, ExploreCopy> = {
  en: {
    daybook: {
      edition: "No. 1 · The daybook that listens",
      tagline: "For Android phones. In English, Spanish and Catalan.",
      tomorrow: "Tomorrow",
      todo: "To do",
      indexTitle: "What’s inside",
      receiptFree: "Free",
      receiptPro: "Pro · monthly",
      priceLater: "Price not set yet",
      zero: "0.00",
    },
    pop: {
      sticker: "Coming soon to Android",
      inOut: "One sentence in. Tasks out.",
      inLabel: "You say",
      outLabel: "TaskFlow adds",
      numbersTitle: "The numbers",
      numbers: [
        { value: "10", label: "free dictations a month" },
        { value: "∞", label: "tasks by hand, free" },
        { value: "20 h", label: "of meetings a month with Pro" },
        { value: "3", label: "languages: English, Spanish, Catalan" },
      ],
      scrollHint: "Scroll for more",
    },
  },
  es: {
    daybook: {
      edition: "N.º 1 · La agenda que escucha",
      tagline: "Para móviles Android. En español, catalán e inglés.",
      tomorrow: "Mañana",
      todo: "Por hacer",
      indexTitle: "Qué hay dentro",
      receiptFree: "Gratis",
      receiptPro: "Pro · mensual",
      priceLater: "Precio aún sin fijar",
      zero: "0,00",
    },
    pop: {
      sticker: "Próximamente en Android",
      inOut: "Entra una frase. Salen tareas.",
      inLabel: "Tú dices",
      outLabel: "TaskFlow añade",
      numbersTitle: "En cifras",
      numbers: [
        { value: "10", label: "dictados gratis al mes" },
        { value: "∞", label: "tareas a mano, gratis" },
        { value: "20 h", label: "de reuniones al mes con Pro" },
        { value: "3", label: "idiomas: español, catalán e inglés" },
      ],
      scrollHint: "Desliza para ver más",
    },
  },
  ca: {
    daybook: {
      edition: "Núm. 1 · L’agenda que escolta",
      tagline: "Per a mòbils Android. En català, castellà i anglès.",
      tomorrow: "Demà",
      todo: "Per fer",
      indexTitle: "Què hi ha a dins",
      receiptFree: "Gratuït",
      receiptPro: "Pro · mensual",
      priceLater: "Preu encara per fixar",
      zero: "0,00",
    },
    pop: {
      sticker: "Aviat a Android",
      inOut: "Hi entra una frase. En surten tasques.",
      inLabel: "Tu dius",
      outLabel: "TaskFlow afegeix",
      numbersTitle: "En xifres",
      numbers: [
        { value: "10", label: "dictats gratuïts al mes" },
        { value: "∞", label: "tasques a mà, gratis" },
        { value: "20 h", label: "de reunions al mes amb Pro" },
        { value: "3", label: "idiomes: català, castellà i anglès" },
      ],
      scrollHint: "Llisca per veure’n més",
    },
  },
};
