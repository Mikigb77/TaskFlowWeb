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
    en: "An app for Android™ phones: tap one button and say what you need to do, even several things at once. TaskFlow puts each one on its day and can remind you beforehand.",
    es: "Una app para móviles Android™: toca un botón y di lo que tienes que hacer, aunque sean varias cosas a la vez. TaskFlow pone cada una en su día y puede avisarte antes.",
    ca: "Una aplicació per a mòbils Android™: toca un botó i digues el que has de fer, encara que siguin diverses coses alhora. TaskFlow posa cadascuna al seu dia i et pot avisar abans.",
  } as Copy,
  status: {
    en: "Coming soon to Google Play. You can’t download it yet.",
    es: "Próximamente en Google Play. Todavía no se puede descargar.",
    ca: "Properament a Google Play. Encara no es pot descarregar.",
  } as Copy,
  free: {
    en: "Free with an account: 10 dictations a month, and tasks by hand with no limit.",
    es: "Gratis con una cuenta: 10 dictados al mes y tareas a mano sin límite.",
    ca: "Gratuït amb un compte: 10 dictats al mes i tasques a mà sense límit.",
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
        en: "See your tasks by day, week or month, beside the events from your phone’s calendars if you like. TaskFlow can remind you of tasks with a date, more and more often as the day gets closer.",
        es: "Mira tus tareas por día, semana o mes, junto a los eventos de los calendarios del teléfono si quieres. TaskFlow puede recordarte las tareas con fecha, cada vez más a menudo según se acerca el día.",
        ca: "Mira les tasques per dia, setmana o mes, al costat dels esdeveniments dels calendaris del telèfon si vols. TaskFlow et pot recordar les tasques amb data, cada cop més sovint a mesura que s’acosta el dia.",
      },
    },
    {
      title: {
        en: "Say several things at once",
        es: "Di varias cosas a la vez",
        ca: "Digues diverses coses alhora",
      },
      body: {
        en: "TaskFlow makes one task for each thing you say, with its day and time. Check them, then add them all with one tap. In the app, you can also move all of yesterday’s tasks to tomorrow by voice, or complete many at once.",
        es: "TaskFlow crea una tarea por cada cosa que dices, con su día y su hora. Revísalas y añádelas todas con un toque. En la app, también puedes mover con la voz todas las tareas de ayer a mañana, o completar muchas a la vez.",
        ca: "TaskFlow crea una tasca per cada cosa que dius, amb el dia i l’hora. Revisa-les i afegeix-les totes amb un toc. A l’aplicació, també pots moure amb la veu totes les tasques d’ahir a demà, o completar-ne moltes alhora.",
      },
    },
    {
      title: {
        en: "Notes, checklists and files",
        es: "Notas, listas de pasos y archivos",
        ca: "Notes, llistes de passos i fitxers",
      },
      body: {
        en: "Add notes, a checklist or files to any task. Files are backed up to your account, up to 6 MB each, and deleted 15 days after their task is completed. Without Pro you can upload 200 MB of files in all; with Pro, 500 MB a month.",
        es: "Añade notas, una lista de pasos o archivos a cualquier tarea. Los archivos se guardan en tu cuenta, hasta 6 MB cada uno, y se eliminan 15 días después de completar su tarea. Sin Pro puedes subir 200 MB de archivos en total; con Pro, 500 MB al mes.",
        ca: "Afegeix notes, una llista de passos o fitxers a qualsevol tasca. Els fitxers es desen al teu compte, fins a 6 MB cadascun, i s’eliminen 15 dies després de completar la seva tasca. Sense Pro pots pujar 200 MB de fitxers en total; amb Pro, 500 MB al mes.",
      },
    },
    // WD36: Pro's meeting notes, a whole row before offline.
    {
      title: {
        en: "Your meetings become notes",
        es: "Tus reuniones se convierten en notas",
        ca: "Les teves reunions es converteixen en notes",
      },
      body: {
        en: "With TaskFlow Pro, record a meeting and get its notes: a summary, the to-dos, the decisions and the open questions. Tap Record a meeting in Notes, lock your phone if you like, and press Stop. Create task turns the to-dos into a task with a checklist: check it, then add it. Up to 20 hours of meetings a month.",
        es: "Con TaskFlow Pro, graba una reunión y recibe sus notas: un resumen, las cosas por hacer, las decisiones y las preguntas abiertas. Toca Grabar una reunión en Notas, bloquea el móvil si quieres y pulsa Parar. Crear tarea convierte las cosas por hacer en una tarea con su lista de pasos: revísala y añádela. Hasta 20 horas de reuniones al mes.",
        ca: "Amb TaskFlow Pro, enregistra una reunió i rep-⁠ne les notes: un resum, les coses per fer, les decisions i les preguntes obertes. Toca Enregistra una reunió a Notes, bloqueja el mòbil si vols i prem Atura. El botó Crea una tasca converteix les coses per fer en una tasca amb la seva llista de passos: revisa-⁠la i afegeix-⁠la. Fins a 20 hores de reunions al mes.",
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
    es: "Próximamente en Android.",
    ca: "Properament a Android.",
  } as Copy,
  body: {
    en: "TaskFlow isn’t on Google Play yet. Until then, you can try it with your voice on this page.",
    es: "TaskFlow todavía no está en Google Play. Mientras tanto, puedes probarlo con tu voz en esta página.",
    ca: "TaskFlow encara no és a Google Play. Mentrestant, el pots provar amb la teva veu en aquesta pàgina.",
  } as Copy,
  // WD2's line, fixed wording.
  plans: {
    en: "Free with an account: 10 dictations a month, and tasks by hand with no limit. TaskFlow Pro, a monthly subscription: unlimited dictation and 500 MB of files a month.",
    es: "Gratis con una cuenta: 10 dictados al mes y tareas a mano sin límite. TaskFlow Pro, una suscripción mensual: dictados sin límite y 500 MB de archivos al mes.",
    ca: "Gratuït amb un compte: 10 dictats al mes i tasques a mà sense límit. TaskFlow Pro, una subscripció mensual: dictats sense límit i 500 MB de fitxers al mes.",
  } as Copy,
};

// The FAQ's first three items (WP18). The pricing answer carries WD14's safety-limit
// clause (decided 2026-10-19, after the plan) right after "unlimited dictation".
// WP60 adds the free reminders and Pro's reminders in your own words, and ends the Pro sentence after that clause.
// WP70 (run 2026-10-28-site) splits the pricing answer in two paragraphs, Free then Pro.
export const FAQ_FIRST: { question: Copy; answer: Record<Language, string | string[]> }[] = [
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
      en: [
        "Yes. You get 10 free dictations a month, and one dictation can hold several tasks. When they’re used up, you keep adding tasks with a short form, with no limit, until they come back the next month. Reminders are free too, even the ones that come more and more often as the day gets closer.",
        "TaskFlow Pro is a monthly subscription that renews until you cancel it in Google Play. It gives you unlimited dictation (with a safety limit of 50 dictations a day) and 500 MB of files a month. It also turns sentences you type into tasks, and lets you ask for reminders in your own words. It makes notes from the meetings you record too, up to 20 hours a month. Its price isn’t set yet.",
      ],
      es: [
        "Sí. Tienes 10 dictados gratis al mes, y en un dictado caben varias tareas. Cuando se acaban, sigues añadiendo tareas con un formulario sencillo, sin límite, hasta que vuelven el mes siguiente. Los recordatorios también son gratis, incluso los que llegan cada vez más a menudo según se acerca el día.",
        "TaskFlow Pro es una suscripción mensual que se renueva hasta que la cancelas en Google Play. Te da dictado ilimitado (con un límite de seguridad de 50 dictados al día) y 500 MB de archivos al mes. Además, convierte en tareas las frases que escribes y te deja pedir los recordatorios con tus palabras. También toma notas de las reuniones que grabas, hasta 20 horas al mes. Su precio aún no está decidido.",
      ],
      ca: [
        "Sí. Tens 10 dictats gratuïts al mes, i en un dictat hi caben diverses tasques. Quan s’acaben, continues afegint tasques amb un formulari senzill, sense límit, fins que tornen el mes següent. Els recordatoris també són gratuïts, fins i tot els que arriben cada cop més sovint a mesura que s’acosta el dia.",
        "TaskFlow Pro és una subscripció mensual que es renova fins que la cancel·les a Google Play. Et dona dictat il·limitat (amb un límit de seguretat de 50 dictats al dia) i 500 MB de fitxers al mes. A més, converteix en tasques les frases que escrius i et deixa demanar els recordatoris amb les teves paraules. També pren notes de les reunions que enregistres, fins a 20 hores al mes. El preu encara no està decidit.",
      ],
    },
  },
  {
    question: {
      en: "Do I need an account?",
      es: "¿Necesito una cuenta?",
      ca: "Necessito un compte?",
    },
    answer: {
      en: "Yes. The first time, tap Continue with Google; or tap Continue with email, choose a password and type the 6-digit code we email you. Your tasks are kept in your account, so you don’t lose them if you change phones.",
      es: "Sí. La primera vez, toca Continuar con Google; o toca Continuar con mi correo, elige una contraseña y escribe el código de 6 cifras que te enviamos. Tus tareas se guardan en tu cuenta, así no las pierdes si cambias de móvil.",
      ca: "Sí. La primera vegada, toca Continua amb Google; o toca Continua amb el correu, tria una contrasenya i escriu el codi de 6 xifres que t’enviem. Les tasques es desen al teu compte, així no les perds si canvies de mòbil.",
    },
  },
];

// WP19: the FAQ's heading, and its last six items in the order the plan gives
// (WP264, WD22: the repeat item right after the voice item).
export const FAQ_TITLE: Copy = { en: "Questions", es: "Preguntas", ca: "Preguntes" };
export const FAQ_REST: { question: Copy; answer: Copy }[] = [
  {
    question: {
      en: "How do I add tasks by voice?",
      es: "¿Cómo añado tareas hablando?",
      ca: "Com afegeixo tasques parlant?",
    },
    answer: {
      en: "Tap Add a task and say what you need to do, in your own words; several things at once is fine. Tap Done, and TaskFlow shows one task for each, with its day and time. Add them all with one tap. You can also ask what you have this week, or move, change, complete or delete tasks by voice, even all of yesterday’s at once. TaskFlow shows the change first, and you can undo it. Understanding what you say needs the internet: your words are sent to Google.",
      es: "Toca Añadir tarea y di lo que tienes que hacer, con tus palabras; puedes decir varias cosas a la vez. Toca Listo y TaskFlow te muestra una tarea por cada cosa, con su día y su hora. Añádelas todas con un toque. También puedes preguntar qué tienes esta semana, o mover, cambiar, completar o eliminar tareas hablando, incluso todas las de ayer a la vez. TaskFlow te enseña el cambio antes y puedes deshacerlo. Para entender lo que dices necesita internet: tus palabras se envían a Google.",
      ca: "Toca Afegeix una tasca i digues el que has de fer, amb les teves paraules; pots dir diverses coses alhora. Toca Fet i TaskFlow et mostra una tasca per cada cosa, amb el dia i l’hora. Afegeix-les totes amb un toc. També pots preguntar què tens aquesta setmana, o moure, canviar, completar o suprimir tasques parlant, fins i tot totes les d’ahir alhora. TaskFlow t’ensenya el canvi abans i el pots desfer. Per entendre el que dius necessita internet: les teves paraules s’envien a Google.",
    },
  },
  {
    question: {
      en: "Can I add something that repeats?",
      es: "¿Puedo añadir algo que se repite?",
      ca: "Puc afegir una cosa que es repeteix?",
    },
    answer: {
      en: "Yes. Say “every Monday” or “every day at 9” when you add it, or tap More details and choose Repeat. Each time shows on your calendar, and TaskFlow can remind you.",
      es: "Sí. Di «todos los lunes» o «cada día a las 9» al añadirlo, o toca Más detalles y elige Repetir. Cada vez aparece en tu calendario, y TaskFlow puede recordártelo.",
      ca: "Sí. Digues «cada dilluns» o «cada dia a les 9» quan l’afegeixis, o toca Més detalls i tria Repetició. Cada vegada surt al calendari, i TaskFlow t’ho pot recordar.",
    },
  },
  {
    question: {
      en: "Can I use it offline?",
      es: "¿Puedo usarla sin conexión?",
      ca: "La puc fer servir sense connexió?",
    },
    answer: {
      en: "Yes. Your tasks are saved on your phone, so you can check, add and complete them without internet. Saving to your account, understanding what you say, and uploading files need a connection.",
      es: "Sí. Tus tareas se guardan en el móvil: puedes consultarlas, añadirlas y completarlas sin internet. Guardar en tu cuenta, entender lo que dices y subir archivos necesitan conexión.",
      ca: "Sí. Les tasques es desen al mòbil: pots consultar-les, afegir-ne i completar-les sense internet. Desar al compte, entendre el que dius i pujar fitxers necessiten connexió.",
    },
  },
  {
    question: {
      en: "Can I share tasks with my family?",
      es: "¿Puedo compartir tareas con mi familia?",
      ca: "Puc compartir tasques amb la meva família?",
    },
    answer: {
      en: "Yes. Share a project, such as Home or Shopping: tap Share and invite someone by email. Once they accept, everyone in the project sees its tasks. Each task shows who created it, and you can see just one person’s tasks.",
      es: "Sí. Comparte un proyecto, como Casa o Compras: toca Compartir e invita a alguien por correo. Cuando acepte, todos los miembros ven sus tareas. Cada tarea muestra quién la creó, y puedes ver solo las de una persona.",
      ca: "Sí. Comparteix un projecte, com Casa o Compres: toca Comparteix i convida algú per correu. Quan accepti, tots els membres en veuen les tasques. Cada tasca mostra qui l’ha creada, i pots veure només les d’una persona.",
    },
  },
  {
    question: {
      en: "Can I keep notes as well as tasks?",
      es: "¿Puedo guardar notas además de tareas?",
      ca: "Puc desar notes a més de tasques?",
    },
    answer: {
      en: "Yes. The Notes tab keeps what you want to remember that isn’t a task, like a gift idea. Tap Add a note, then write or dictate it; add links or a checklist if you like.",
      es: "Sí. La pestaña Notas guarda lo que quieres recordar y no es una tarea, como una idea para un regalo. Toca Añadir nota y escríbela o díctala; si quieres, añade enlaces o una lista de pasos.",
      ca: "Sí. La pestanya Notes desa el que vols recordar i no és una tasca, com una idea per a un regal. Toca Afegeix una nota i escriu-la o dicta-la; si vols, afegeix-hi enllaços o una llista de passos.",
    },
  },
  {
    question: {
      en: "Can I add tasks from my home screen or from WhatsApp?",
      es: "¿Puedo añadir tareas desde la pantalla de inicio o desde WhatsApp?",
      ca: "Puc afegir tasques des de la pantalla d’inici o des de WhatsApp?",
    },
    answer: {
      en: "Yes. Use the Dictate a task widget or shortcut, or share a message to TaskFlow from another app, such as WhatsApp.",
      es: "Sí. Usa el widget o el acceso directo Dictar una tarea, o comparte un mensaje con TaskFlow desde otra app, como WhatsApp.",
      ca: "Sí. Fes servir el giny o la drecera Dicta una tasca, o comparteix un missatge amb TaskFlow des d’una altra aplicació, com WhatsApp.",
    },
  },
];

// WP20: the header and the phone menu. One label per destination (plan conventions).
export const FRAME = {
  voice: TRY_VOICE,
  features: WHAT_IT_DOES,
  questions: FAQ_TITLE,
  comingSoon: {
    en: "Coming soon to Android",
    es: "Próximamente en Android",
    ca: "Properament a Android",
  } as Copy,
  menu: { en: "Menu", es: "Menú", ca: "Menú" } as Copy,
  language: { en: "Language", es: "Idioma", ca: "Idioma" } as Copy,
  appearance: { en: "Appearance", es: "Apariencia", ca: "Aparença" } as Copy,
  light: { en: "Light", es: "Claro", ca: "Clar" } as Copy,
  dark: { en: "Dark", es: "Oscuro", ca: "Fosc" } as Copy,
  home: { en: "TaskFlow home", es: "Inicio de TaskFlow", ca: "Inici de TaskFlow" } as Copy,
  navigation: {
    en: "Main navigation",
    es: "Navegación principal",
    ca: "Navegació principal",
  } as Copy,
  toDark: {
    en: "Switch to dark mode",
    es: "Cambiar a modo oscuro",
    ca: "Canvia al mode fosc",
  } as Copy,
  toLight: {
    en: "Switch to light mode",
    es: "Cambiar a modo claro",
    ca: "Canvia al mode clar",
  } as Copy,
};
// Each language's name in its own language, in the switch's order.
export const LANGUAGE_NAMES: Copy = { en: "English", es: "Español", ca: "Català" };

// WP21: the homes' title, description and link preview.
export const META = {
  title: {
    en: "TaskFlow — Say it, and it’s on your calendar",
    es: "TaskFlow — Dilo y ya está en tu calendario",
    ca: "TaskFlow — Digues-ho i ja és al teu calendari",
  } as Copy,
  description: {
    en: "Note down what you need to do, and TaskFlow puts it on your calendar. Say several things at once. For Android phones, coming soon to Google Play.",
    es: "Apunta lo que tienes que hacer y TaskFlow lo pone en tu calendario. Di varias cosas a la vez. Para móviles Android, próximamente en Google Play.",
    ca: "Apunta el que has de fer i TaskFlow ho posa al teu calendari. Digues diverses coses alhora. Per a mòbils Android, properament a Google Play.",
  } as Copy,
  locale: { en: "en_US", es: "es_ES", ca: "ca_ES" } as Copy,
  imageAlt: {
    en: "TaskFlow’s calendar on an Android phone, with “Call the dentist” and “Buy bread” on tomorrow",
    es: "El calendario de TaskFlow en un móvil Android, con «Llamar al dentista» y «Comprar pan» para mañana",
    ca: "El calendari de TaskFlow en un mòbil Android, amb «Trucar al dentista» i «Comprar pa» per a demà",
  } as Copy,
};

// WP21: the 404, one block per language.
export const NOT_FOUND = {
  title: "Page not found · Página no encontrada · No hem trobat aquesta pàgina — TaskFlow",
  heading: {
    en: "Page not found",
    es: "Página no encontrada",
    ca: "No hem trobat aquesta pàgina",
  } as Copy,
  body: {
    en: "This address doesn’t exist on the TaskFlow website.",
    es: "Esta dirección no existe en la web de TaskFlow.",
    ca: "Aquesta adreça no existeix al web de TaskFlow.",
  } as Copy,
  home: {
    en: "Go to the TaskFlow home page",
    es: "Ir al inicio de TaskFlow",
    ca: "Ves a l’inici de TaskFlow",
  } as Copy,
  deleteAccount: { en: "Delete account", es: "Eliminar cuenta", ca: "Suprimeix el compte" } as Copy,
};

// WP22: the skip link.
export const SKIP_LINK: Copy = {
  en: "Skip to content",
  es: "Saltar al contenido",
  ca: "Salta al contingut",
};

// WP23: the footer.
export const FOOTER = {
  navigation: {
    en: "Footer navigation",
    es: "Navegación del pie de página",
    ca: "Navegació del peu de pàgina",
  } as Copy,
  legal: { en: "Legal and privacy", es: "Legal y privacidad", ca: "Legal i privacitat" } as Copy,
  links: [
    { page: "privacy", name: { en: "Privacy Policy", es: "Política de privacidad", ca: "Política de privacitat" } as Copy },
    {
      page: "terms",
      name: {
        en: "Terms and Conditions",
        es: "Términos y condiciones",
        ca: "Termes i condicions",
      } as Copy,
    },
    { page: "legal", name: { en: "Legal Notice", es: "Aviso legal", ca: "Avís legal" } as Copy },
    {
      page: "delete-account",
      name: { en: "Delete account", es: "Eliminar cuenta", ca: "Suprimeix el compte" } as Copy,
    },
  ],
  support: { en: "Email support", es: "Escribir a soporte", ca: "Escriu al suport" } as Copy,
  operator: { en: "A product by ", es: "Un producto de ", ca: "Un producte de " } as Copy,
  trademark: {
    en: "Android and Google Play are trademarks of Google\u00a0LLC.",
    es: "Android y Google Play son marcas comerciales de Google\u00a0LLC.",
    ca: "Android i Google Play són marques comercials de Google\u00a0LLC.",
  } as Copy,
  backToTop: { en: "Back to top", es: "Volver arriba", ca: "Torna a dalt" } as Copy,
};

// Every page the site has: the three homes and the legal pages in each language.
export const LEGAL_PAGES = ["privacy", "terms", "legal", "delete-account"] as const;
