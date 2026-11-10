import type { SiteLanguage } from "./types";

// Copy for the exploratory "Nova" home page: only what the app does today, reworded from
// the site's own copy and its FAQ (how to add by voice, Free and Pro).
export type NovaCopy = {
  howTitle: string;
  steps: { title: string; body: string }[];
  plansTitle: string;
  free: { name: string; items: string[] };
  pro: { name: string; items: string[]; note: string };
  questionsLead: string;
  app: { addTask: string; tabs: string[]; greeting: string };
};

export const nova: Record<SiteLanguage, NovaCopy> = {
  en: {
    howTitle: "From a thought to your calendar.",
    steps: [
      { title: "Tap Add a task", body: "One button, right on your calendar." },
      {
        title: "Say it",
        body: "In your own words. Several things at once is fine.",
      },
      {
        title: "Add them",
        body: "TaskFlow shows one task for each thing, with its day and time. Add them all with one tap.",
      },
      {
        title: "See them on your calendar",
        body: "Each one is already on its day.",
      },
    ],
    plansTitle: "Free to start. Pro when you want more.",
    free: {
      name: "Free, with an account",
      items: [
        "10 dictations a month, and one can hold several tasks",
        "Tasks by hand, with no limit",
        "Reminders, more and more often as the day gets closer",
        "200 MB of files in all",
      ],
    },
    pro: {
      name: "TaskFlow Pro",
      items: [
        "Unlimited dictation, with a safety limit of 50 a day",
        "Sentences you type turned into tasks",
        "Reminders asked for in your own words",
        "Notes from your meetings, up to 20 hours a month",
        "500 MB of files a month",
      ],
      note: "A monthly subscription in Google Play. Its price isn’t set yet.",
    },
    questionsLead: "Everything people ask before trying it.",
    app: {
      addTask: "Add a task",
      tabs: ["Calendar", "Tasks", "Notes", "Settings"],
      greeting: "Your week",
    },
  },
  es: {
    howTitle: "De una idea a tu calendario.",
    steps: [
      { title: "Toca Añadir tarea", body: "Un solo botón, en tu calendario." },
      {
        title: "Dilo",
        body: "Con tus palabras. Puedes decir varias cosas a la vez.",
      },
      {
        title: "Añádelas",
        body: "TaskFlow te muestra una tarea por cada cosa, con su día y su hora. Añádelas todas con un toque.",
      },
      {
        title: "Míralas en tu calendario",
        body: "Cada una ya está en su día.",
      },
    ],
    plansTitle: "Gratis para empezar. Pro cuando quieras más.",
    free: {
      name: "Gratis, con una cuenta",
      items: [
        "10 dictados al mes, y cada uno puede tener varias tareas",
        "Tareas a mano, sin límite",
        "Recordatorios, cada vez más seguidos cuando se acerca el día",
        "200 MB de archivos en total",
      ],
    },
    pro: {
      name: "TaskFlow Pro",
      items: [
        "Dictado ilimitado, con un límite de seguridad de 50 al día",
        "Frases que escribes convertidas en tareas",
        "Recordatorios pedidos con tus palabras",
        "Notas de tus reuniones, hasta 20 horas al mes",
        "500 MB de archivos al mes",
      ],
      note: "Una suscripción mensual en Google Play. Su precio aún no está fijado.",
    },
    questionsLead: "Todo lo que se pregunta antes de probarla.",
    app: {
      addTask: "Añadir tarea",
      tabs: ["Calendario", "Tareas", "Notas", "Ajustes"],
      greeting: "Tu semana",
    },
  },
  ca: {
    howTitle: "D’una idea al teu calendari.",
    steps: [
      {
        title: "Toca Afegeix una tasca",
        body: "Un sol botó, al teu calendari.",
      },
      {
        title: "Digues-ho",
        body: "Amb les teves paraules. Pots dir diverses coses alhora.",
      },
      {
        title: "Afegeix-les",
        body: "TaskFlow et mostra una tasca per cada cosa, amb el dia i l’hora. Afegeix-les totes amb un toc.",
      },
      {
        title: "Mira-les al teu calendari",
        body: "Cada una ja és al seu dia.",
      },
    ],
    plansTitle: "Gratuït per començar. Pro quan en vulguis més.",
    free: {
      name: "Gratuït, amb un compte",
      items: [
        "10 dictats al mes, i cadascun pot tenir diverses tasques",
        "Tasques a mà, sense límit",
        "Recordatoris, cada cop més seguits quan s’acosta el dia",
        "200 MB de fitxers en total",
      ],
    },
    pro: {
      name: "TaskFlow Pro",
      items: [
        "Dictat il·limitat, amb un límit de seguretat de 50 al dia",
        "Frases que escrius convertides en tasques",
        "Recordatoris demanats amb les teves paraules",
        "Notes de les teves reunions, fins a 20 hores al mes",
        "500 MB de fitxers al mes",
      ],
      note: "Una subscripció mensual a Google Play. El preu encara no està fixat.",
    },
    questionsLead: "Tot el que es pregunta abans de provar-la.",
    app: {
      addTask: "Afegeix una tasca",
      tabs: ["Calendari", "Tasques", "Notes", "Configuració"],
      greeting: "La teva setmana",
    },
  },
};
