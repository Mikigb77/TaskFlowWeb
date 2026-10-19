// The exact copy the UX web loop's plan (run 2026-10-18-site) gives for the home, for the
// acceptance checks that are about the wording itself. Everything else reads the site's
// own content modules (src/content/site/), so a correct rewording never breaks a test.
import type { Language } from "./ux-web";

type Copy = Record<Language, string>;

// One label per destination (plan conventions).
export const TRY_VOICE: Copy = {
  en: "Try it with your voice",
  es: "Pruébalo con tu voz",
  ca: "Prova-ho amb la teva veu",
};
export const WHAT_IT_DOES: Copy = { en: "What it does", es: "Qué hace", ca: "Què fa" };

// WP16
export const HERO = {
  title: {
    en: "Say it, and it’s on your calendar.",
    es: "Dilo y ya está en tu calendario.",
    ca: "Digues-ho i ja és al teu calendari.",
  } as Copy,
  calendarWord: { en: "calendar", es: "calendario", ca: "calendari" } as Copy,
  description: {
    en: "Tap one button and say what you need to do, even several things at once. TaskFlow puts each one on its day and can remind you before it. An app for Android™ phones.",
    es: "Toca un botón y di lo que tienes que hacer, aunque sean varias cosas a la vez. TaskFlow pone cada una en su día y puede avisarte antes. Una app para móviles Android™.",
    ca: "Toca un botó i digues el que has de fer, encara que siguin diverses coses alhora. TaskFlow posa cada una el seu dia i et pot avisar abans. Una aplicació per a mòbils Android™.",
  } as Copy,
  status: {
    en: "Coming soon to Google Play. You can’t download it yet.",
    es: "Muy pronto en Google Play. Todavía no se puede descargar.",
    ca: "Molt aviat a Google Play. Encara no es pot descarregar.",
  } as Copy,
  altWord: { en: "dentist", es: "dentista", ca: "dentista" } as Copy,
};

// WP17
export const FEATURES = {
  title: { en: "What TaskFlow does", es: "Qué hace TaskFlow", ca: "Què fa TaskFlow" } as Copy,
  cards: [
    {
      title: {
        en: "Your day on one calendar",
        es: "Tu día en un calendario",
        ca: "El teu dia en un calendari",
      },
      body: {
        en: "See your tasks by day, week or month, beside the events from your phone’s calendars if you like. TaskFlow can remind you of tasks with a date: it asks once, the first time you add one.",
        es: "Mira tus tareas por día, semana o mes, junto a los eventos de los calendarios del teléfono si quieres. TaskFlow puede recordarte las tareas con fecha: te lo pregunta una vez, la primera vez que añades una.",
        ca: "Mira les tasques per dia, setmana o mes, al costat dels esdeveniments dels calendaris del telèfon si vols. TaskFlow et pot recordar les tasques amb data: t’ho pregunta una vegada, la primera vegada que n’afegeixes una.",
      },
    },
    {
      title: {
        en: "Say several things at once",
        es: "Di varias cosas a la vez",
        ca: "Digues diverses coses alhora",
      },
      body: {
        en: "TaskFlow makes one task for each thing you say, with its day and time. Check them, then add them all with one tap.",
        es: "TaskFlow crea una tarea por cada cosa que dices, con su día y su hora. Revísalas y añádelas todas con un toque.",
        ca: "TaskFlow crea una tasca per cada cosa que dius, amb el dia i l’hora. Revisa-les i afegeix-les totes amb un toc.",
      },
    },
    {
      title: {
        en: "Notes, checklists and files",
        es: "Notas, listas de pasos y archivos",
        ca: "Notes, llistes de passos i fitxers",
      },
      body: {
        en: "Add notes, a checklist or files to any task. Files are backed up to your account, up to 6 MB each.",
        es: "Añade notas, una lista de pasos o archivos a cualquier tarea. Los archivos se guardan en tu cuenta, hasta 6 MB cada uno.",
        ca: "Afegeix notes, una llista de passos o fitxers a qualsevol tasca. Els fitxers es desen al teu compte, fins a 6 MB cadascun.",
      },
    },
    {
      title: {
        en: "Your tasks, even offline",
        es: "Tus tareas, también sin conexión",
        ca: "Les tasques, també sense connexió",
      },
      body: {
        en: "Your tasks are saved on your phone, so you can check and add them without internet. They’re saved to your account when you’re back online.",
        es: "Tus tareas se guardan en el móvil, así puedes consultarlas y añadirlas sin internet. Se guardan en tu cuenta cuando vuelves a tener conexión.",
        ca: "Les tasques es desen al mòbil, així pots consultar-les i afegir-ne sense internet. Es desen al teu compte quan tornes a tenir connexió.",
      },
    },
  ] as { title: Copy; body: Copy }[],
};

// WP18
export const CLOSING = {
  title: {
    en: "Coming soon to Android.",
    es: "Muy pronto en Android.",
    ca: "Molt aviat a Android.",
  } as Copy,
  body: {
    en: "TaskFlow isn’t on Google Play yet. Until then, you can try it with your voice on this page.",
    es: "TaskFlow todavía no está en Google Play. Mientras tanto, puedes probarlo con tu voz en esta página.",
    ca: "TaskFlow encara no és a Google Play. Mentrestant, el pots provar amb la teva veu en aquesta pàgina.",
  } as Copy,
  // WD2's line, fixed wording.
  plans: {
    en: "Free with an account: 10 dictations a month, and tasks by hand with no limit. TaskFlow Pro, a monthly subscription: unlimited dictation and file space.",
    es: "Gratis con una cuenta: 10 dictados al mes y tareas a mano sin límite. TaskFlow Pro, una suscripción mensual: dictados y espacio para archivos sin límite.",
    ca: "Gratuït amb un compte: 10 dictats al mes i tasques a mà sense límit. TaskFlow Pro, una subscripció mensual: dictats i espai per a fitxers sense límit.",
  } as Copy,
};

// The FAQ's first three items (WP18). The pricing answer carries WD14's safety-limit
// clause (decided 2026-10-19, after the plan) right after "unlimited dictation and file space".
export const FAQ_FIRST: { question: Copy; answer: Copy }[] = [
  {
    question: {
      en: "Can I download TaskFlow yet?",
      es: "¿Ya puedo descargar TaskFlow?",
      ca: "Ja puc descarregar TaskFlow?",
    },
    answer: {
      en: "Not yet. TaskFlow is an app for Android phones, in Spanish, Catalan and English, coming soon to Google Play. Until then, you can try it with your voice on this page.",
      es: "Todavía no. TaskFlow es una app para móviles Android, en español, catalán e inglés, y llegará pronto a Google Play. Mientras tanto, puedes probarla con tu voz en esta página.",
      ca: "Encara no. TaskFlow és una aplicació per a mòbils Android, en català, castellà i anglès, i arribarà aviat a Google Play. Mentrestant, pots provar-la amb la teva veu en aquesta pàgina.",
    },
  },
  {
    question: {
      en: "Is TaskFlow free?",
      es: "¿TaskFlow es gratis?",
      ca: "TaskFlow és gratuït?",
    },
    answer: {
      en: "Yes. You get 10 free dictations a month, and one dictation can hold several tasks. When they’re used up, you keep adding tasks with a short form, with no limit, until they come back the next month. TaskFlow Pro, a monthly subscription that renews until you cancel it in Google Play, gives you unlimited dictation and file space (with a safety limit of 50 dictations a day), and also turns sentences you type into tasks. Its price isn’t set yet.",
      es: "Sí. Tienes 10 dictados gratis al mes, y en un dictado caben varias tareas. Cuando se acaban, sigues añadiendo tareas con un formulario sencillo, sin límite, hasta que vuelven el mes siguiente. TaskFlow Pro, una suscripción mensual que se renueva hasta que la cancelas en Google Play, te da dictado y espacio para archivos ilimitados (con un límite de seguridad de 50 dictados al día), y además convierte en tareas las frases que escribes. Su precio aún no está decidido.",
      ca: "Sí. Tens 10 dictats gratuïts al mes, i en un dictat hi caben diverses tasques. Quan s’acaben, continues afegint tasques amb un formulari senzill, sense límit, fins que tornen el mes següent. TaskFlow Pro, una subscripció mensual que es renova fins que la cancel·les a Google Play, et dona dictat i espai per a fitxers il·limitats (amb un límit de seguretat de 50 dictats al dia), i a més converteix en tasques les frases que escrius. El preu encara no està decidit.",
    },
  },
  {
    question: {
      en: "Do I need an account?",
      es: "¿Necesito una cuenta?",
      ca: "Necessito un compte?",
    },
    answer: {
      en: "Yes. You sign in once: tap Continue with Google, or use your email and a password, then type the 6-digit code we email you. Your tasks are kept in your account, so you don’t lose them if you change phones.",
      es: "Sí. Inicias sesión una vez: toca Continuar con Google, o usa tu correo y una contraseña, y escribe el código de 6 cifras que te enviamos. Tus tareas se guardan en tu cuenta, así no las pierdes si cambias de móvil.",
      ca: "Sí. Inicies la sessió una vegada: toca Continua amb Google, o fes servir el teu correu i una contrasenya, i escriu el codi de 6 xifres que t’enviem. Les tasques es desen al teu compte, així no les perds si canvies de mòbil.",
    },
  },
];
