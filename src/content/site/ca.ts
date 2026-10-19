import { en } from "./en";
import type { SiteCopy } from "./types";

// Each section reuses the English until its own package writes it in this language.
export const ca: SiteCopy = {
  hero: {
    title: "Digues-ho i ja és al ",
    titleAccent: "teu calendari.",
    description:
      "Toca un botó i digues el que has de fer, encara que siguin diverses coses alhora. TaskFlow posa cada una el seu dia i et pot avisar abans. Una aplicació per a mòbils Android™.",
    primary: "Prova-ho amb la teva veu",
    secondary: "Què fa",
    status: "Molt aviat a Google Play. Encara no es pot descarregar.",
    voiceQuote: "«Demà, trucar al dentista i comprar pa.»",
    imageAlt:
      "TaskFlow en un mòbil Android: el calendari de demà amb dues tasques, Trucar al dentista i Comprar pa, i el botó Afegeix una tasca.",
  },
  features: {
    title: "Què fa TaskFlow",
    calendar: {
      title: "El teu dia en un calendari",
      body: "Mira les tasques per dia, setmana o mes, al costat dels esdeveniments dels calendaris del telèfon si vols. TaskFlow et pot recordar les tasques amb data: t’ho pregunta una vegada, la primera vegada que n’afegeixes una.",
      header: "Aquesta setmana",
      weekdays: ["dl", "dt", "dc", "dj", "dv", "ds", "dg"],
      events: [
        {
          title: "Un bon començament",
          detail: "Repassa els plans de la setmana",
        },
        {
          title: "Una estona a l’aire lliure",
          detail: "El teu passeig preferit",
        },
      ],
    },
    voice: {
      title: "Digues diverses coses alhora",
      body: "TaskFlow crea una tasca per cada cosa que dius, amb el dia i l’hora. Revisa-les i afegeix-les totes amb un toc.",
      link: "Prova-ho amb la teva veu",
    },
    details: {
      title: "Notes, llistes de passos i fitxers",
      body: "Afegeix notes, una llista de passos o fitxers a qualsevol tasca. Els fitxers es desen al teu compte, fins a 6 MB cadascun.",
    },
    offline: {
      title: "Les tasques, també sense connexió",
      body: "Les tasques es desen al mòbil, així pots consultar-les i afegir-ne sense internet. Es desen al teu compte quan tornes a tenir connexió.",
    },
  },
  // The heading and the answers after the third stay English until WP19.
  faq: {
    ...en.faq,
    items: [
      {
        question: "Ja puc descarregar TaskFlow?",
        answer:
          "Encara no. TaskFlow és una aplicació per a mòbils Android, en català, castellà i anglès, i arribarà aviat a Google Play. Mentrestant, pots provar-la amb la teva veu en aquesta pàgina.",
      },
      {
        question: "TaskFlow és gratuït?",
        answer:
          "Sí. Tens 10 dictats gratuïts al mes, i en un dictat hi caben diverses tasques. Quan s’acaben, continues afegint tasques amb un formulari senzill, sense límit, fins que tornen el mes següent. TaskFlow Pro, una subscripció mensual que es renova fins que la cancel·les a Google Play, et dona dictat i espai per a fitxers il·limitats (amb un límit de seguretat de 50 dictats al dia), i a més converteix en tasques les frases que escrius. El preu encara no està decidit.",
      },
      {
        question: "Necessito un compte?",
        answer:
          "Sí. Inicies la sessió una vegada: toca Continua amb Google, o fes servir el teu correu i una contrasenya, i escriu el codi de 6 xifres que t’enviem. Les tasques es desen al teu compte, així no les perds si canvies de mòbil.",
      },
      ...en.faq.items.slice(3),
    ],
  },
  closing: {
    title: "Molt aviat a Android.",
    body: "TaskFlow encara no és a Google Play. Mentrestant, el pots provar amb la teva veu en aquesta pàgina.",
    button: "Prova-ho amb la teva veu",
    plans:
      "Gratuït amb un compte: 10 dictats al mes i tasques a mà sense límit. TaskFlow Pro, una subscripció mensual: dictats i espai per a fitxers sense límit.",
  },
};
