import { en } from "./en";
import type { SiteCopy } from "./types";

// Each section reuses the English until its own package writes it in this language.
export const es: SiteCopy = {
  hero: {
    title: "Dilo y ya está en ",
    titleAccent: "tu calendario.",
    description:
      "Toca un botón y di lo que tienes que hacer, aunque sean varias cosas a la vez. TaskFlow pone cada una en su día y puede avisarte antes. Una app para móviles Android™.",
    primary: "Pruébalo con tu voz",
    secondary: "Qué hace",
    status: "Muy pronto en Google Play. Todavía no se puede descargar.",
    voiceQuote: "«Mañana, llamar al dentista y comprar pan.»",
    imageAlt:
      "TaskFlow en un móvil Android: el calendario de mañana con dos tareas, Llamar al dentista y Comprar pan, y el botón Añadir tarea.",
  },
  features: {
    title: "Qué hace TaskFlow",
    calendar: {
      title: "Tu día en un calendario",
      body: "Mira tus tareas por día, semana o mes, junto a los eventos de los calendarios del teléfono si quieres. TaskFlow puede recordarte las tareas con fecha: te lo pregunta una vez, la primera vez que añades una.",
      header: "Esta semana",
      weekdays: ["L", "M", "X", "J", "V", "S", "D"],
      events: [
        { title: "Un buen comienzo", detail: "Repasa los planes de la semana" },
        { title: "Un rato al aire libre", detail: "Tu paseo favorito" },
      ],
    },
    voice: {
      title: "Di varias cosas a la vez",
      body: "TaskFlow crea una tarea por cada cosa que dices, con su día y su hora. Revísalas y añádelas todas con un toque.",
      link: "Pruébalo con tu voz",
    },
    details: {
      title: "Notas, listas de pasos y archivos",
      body: "Añade notas, una lista de pasos o archivos a cualquier tarea. Los archivos se guardan en tu cuenta, hasta 6 MB cada uno.",
    },
    offline: {
      title: "Tus tareas, también sin conexión",
      body: "Tus tareas se guardan en el móvil, así puedes consultarlas y añadirlas sin internet. Se guardan en tu cuenta cuando vuelves a tener conexión.",
    },
  },
  // The heading and the answers after the third stay English until WP19.
  faq: {
    ...en.faq,
    items: [
      {
        question: "¿Ya puedo descargar TaskFlow?",
        answer:
          "Todavía no. TaskFlow es una app para móviles Android, en español, catalán e inglés, y llegará pronto a Google Play. Mientras tanto, puedes probarla con tu voz en esta página.",
      },
      {
        question: "¿TaskFlow es gratis?",
        answer:
          "Sí. Tienes 10 dictados gratis al mes, y en un dictado caben varias tareas. Cuando se acaban, sigues añadiendo tareas con un formulario sencillo, sin límite, hasta que vuelven el mes siguiente. TaskFlow Pro, una suscripción mensual que se renueva hasta que la cancelas en Google Play, te da dictado y espacio para archivos ilimitados (con un límite de seguridad de 50 dictados al día), y además convierte en tareas las frases que escribes. Su precio aún no está decidido.",
      },
      {
        question: "¿Necesito una cuenta?",
        answer:
          "Sí. Inicias sesión una vez: toca Continuar con Google, o usa tu correo y una contraseña, y escribe el código de 6 cifras que te enviamos. Tus tareas se guardan en tu cuenta, así no las pierdes si cambias de móvil.",
      },
      ...en.faq.items.slice(3),
    ],
  },
  closing: {
    title: "Muy pronto en Android.",
    body: "TaskFlow todavía no está en Google Play. Mientras tanto, puedes probarlo con tu voz en esta página.",
    button: "Pruébalo con tu voz",
    plans:
      "Gratis con una cuenta: 10 dictados al mes y tareas a mano sin límite. TaskFlow Pro, una suscripción mensual: dictados y espacio para archivos sin límite.",
  },
};
