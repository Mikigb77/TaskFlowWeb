import type { Metadata } from "next";
import { copy as siteCopy } from "../site";
import company from "./company.json";
import { en } from "./en";
import { es } from "./es";
import { ca } from "./ca";
import {
  documents,
  languages,
  legalPath,
  type DocumentId,
  type Language,
} from "./types";

export { company, documents, languages, legalPath };
export type { DocumentId, Language };
export const copy = { en, es, ca };
export const languageNames = { en: "English", es: "Español", ca: "Català" };
export const publicationReady =
  company.publicationApproved &&
  company.incorporationConfirmed &&
  !!company.taxId &&
  !!company.registeredAddress &&
  !!company.commercialRegister &&
  !!company.generalEmail &&
  !!company.contactEmail &&
  !!company.minimumAge &&
  company.contactChannelsVerified;

export const ui = {
  en: {
    back: "Back to TaskFlow",
    language: "Document language",
    contents: "On this page",
    documents: "Legal documents",
    updated: "In force since",
    summary: "At a glance",
    pending: "Awaiting confirmation",
    company: "Legal operator",
    taxId: "Tax number (NIF)",
    address: "Registered address",
    register: "Mercantile Registry",
    registration:
      "Registered in the Barcelona Mercantile Registry, volume 49105, folio 130, sheet 607875, entry 1",
    contact: "Support and privacy contact",
    generalContact: "General contact",
    actions: "Contact and account options",
    requestTitle: "In the app or by email",
    requestIntro:
      "With the app: Settings → Account → Delete account. You’ll see what will be deleted before you confirm.",
    requestEmail: "No app, or can’t sign in? Email us:",
    requestHelp:
      "This opens an email draft. Review it and press Send in your email app to submit your request. If nothing opens, copy the address and subject below into your usual email service.",
    recipient: "Send to",
    subject: "Subject",
    deletionBody:
      "Hello TaskFlow,\n\nPlease delete my TaskFlow account and the associated personal data.\n\nAccount email: [enter the email linked to your TaskFlow account]\n\nPlease confirm when this has been completed and explain any data that must be retained and for how long.\n\nThank you.",
    emailPending: "setup pending",
    contactPending:
      "The contact email is temporarily unavailable. Please use the registered address below.",
    write: "Email support",
    deletion: "Write a deletion request",
    withdrawal: "Send a withdrawal request",
    subjects: {
      privacy: "TaskFlow — privacy or support request",
      deletion: "Delete my TaskFlow account",
      withdrawal: "TaskFlow — withdrawal request",
    },
    titles: {
      privacy: "Privacy Policy",
      terms: "Terms and Conditions",
      legal: "Legal Notice",
      "delete-account": "Delete account",
    },
  },
  es: {
    back: "Volver a TaskFlow",
    language: "Idioma del documento",
    contents: "En esta página",
    documents: "Documentos legales",
    updated: "En vigor desde el",
    summary: "De un vistazo",
    pending: "Pendiente de confirmación",
    company: "Entidad legal",
    taxId: "NIF",
    address: "Domicilio social",
    register: "Registro Mercantil",
    registration:
      "Inscrita en el Registro Mercantil de Barcelona, tomo 49105, folio 130, hoja 607875, inscripción 1",
    contact: "Contacto de soporte y privacidad",
    generalContact: "Contacto general",
    actions: "Contacto y opciones de cuenta",
    requestTitle: "Desde la app o por correo",
    requestIntro:
      "Con la app: Ajustes → Cuenta → Eliminar cuenta. Verás lo que se eliminará antes de confirmar.",
    requestEmail: "¿Sin la app o no puedes entrar? Escríbenos:",
    requestHelp:
      "Se abrirá un borrador de correo. Revísalo y pulsa Enviar en tu aplicación de correo para presentar la solicitud. Si no se abre, copia la dirección y el asunto de abajo en tu servicio de correo habitual.",
    recipient: "Destinatario",
    subject: "Asunto",
    deletionBody:
      "Hola, TaskFlow:\n\nSolicito la eliminación de mi cuenta de TaskFlow y de los datos personales asociados.\n\nCorreo de la cuenta: [indica el correo vinculado a tu cuenta de TaskFlow]\n\nPor favor, confirmad cuando se haya completado e indicad qué datos debéis conservar, por qué y durante cuánto tiempo.\n\nGracias.",
    emailPending: "configuración pendiente",
    contactPending:
      "El correo de contacto no está disponible temporalmente. Utiliza el domicilio social indicado abajo.",
    write: "Escribir a soporte",
    deletion: "Escribir solicitud de eliminación",
    withdrawal: "Enviar un desistimiento",
    subjects: {
      privacy: "TaskFlow — consulta de privacidad o soporte",
      deletion: "Eliminar mi cuenta de TaskFlow",
      withdrawal: "TaskFlow — desistimiento",
    },
    titles: {
      privacy: "Política de privacidad",
      terms: "Términos y condiciones",
      legal: "Aviso legal",
      "delete-account": "Eliminar cuenta",
    },
  },
  ca: {
    back: "Tornar a TaskFlow",
    language: "Idioma del document",
    contents: "En aquesta pàgina",
    documents: "Documents legals",
    updated: "En vigor des del",
    summary: "D’un cop d’ull",
    pending: "Pendent de confirmació",
    company: "Entitat legal",
    taxId: "NIF",
    address: "Domicili social",
    register: "Registre Mercantil",
    registration: company.commercialRegister,
    contact: "Contacte de suport i privacitat",
    generalContact: "Contacte general",
    actions: "Contacte i opcions del compte",
    requestTitle: "Des de l’app o per correu",
    requestIntro:
      "Amb l’app: Configuració → Compte → Suprimeix el compte. Veuràs el que es suprimirà abans de confirmar.",
    requestEmail: "Sense l’app o no pots entrar? Escriu-nos:",
    requestHelp:
      "S’obrirà un esborrany de correu. Revisa’l i prem Envia a l’aplicació de correu per presentar la sol·licitud. Si no s’obre, copia l’adreça i l’assumpte de sota al servei de correu habitual.",
    recipient: "Destinatari",
    subject: "Assumpte",
    deletionBody:
      "Hola, TaskFlow:\n\nSol·licito la supressió del meu compte de TaskFlow i de les dades personals associades.\n\nCorreu del compte: [indica el correu vinculat al compte de TaskFlow]\n\nSi us plau, confirmeu quan s’hagi completat i indiqueu quines dades heu de conservar, per què i durant quant de temps.\n\nGràcies.",
    emailPending: "configuració pendent",
    contactPending:
      "El correu de contacte no està disponible temporalment. Utilitza el domicili social indicat a continuació.",
    write: "Escriu al suport",
    deletion: "Escriu la sol·licitud de supressió",
    withdrawal: "Enviar un desistiment",
    subjects: {
      privacy: "TaskFlow — consulta de privacitat o suport",
      deletion: "Suprimir el meu compte de TaskFlow",
      withdrawal: "TaskFlow — desistiment",
    },
    titles: {
      privacy: "Política de privacitat",
      terms: "Termes i condicions",
      legal: "Avís legal",
      "delete-account": "Suprimeix el compte",
    },
  },
};

export function legalContactHref(
  purpose: "privacy" | "deletion" | "withdrawal",
  language: Language,
) {
  const t = ui[language];
  const subject = encodeURIComponent(t.subjects[purpose]);
  const body =
    purpose === "deletion" ? `&body=${encodeURIComponent(t.deletionBody)}` : "";
  return `mailto:${company.contactEmail}?subject=${subject}${body}`;
}

// The date the documents are in force from, written out in the page's language.
const dateLocales: Record<Language, string> = {
  en: "en-GB",
  es: "es",
  ca: "ca",
};
export function legalVersionDate(language: Language) {
  return new Intl.DateTimeFormat(dateLocales[language], {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${company.version}T00:00:00Z`));
}

// Open Graph locales, as on the home.
const locales: Record<Language, string> = {
  en: "en_US",
  es: "es_ES",
  ca: "ca_ES",
};

// The home's link preview in the page's language: the files src/app/opengraph-image.tsx
// and src/app/[language]/opengraph-image.tsx, drawn at src/og/preview.tsx's size.
function previewImage(language: Language) {
  return {
    url:
      language === "en"
        ? "/opengraph-image"
        : `/${language}/opengraph-image/preview`,
    width: 1200,
    height: 630,
    alt: siteCopy[language].meta.imageAlt,
    type: "image/png",
  };
}

export function legalMetadata(
  document: DocumentId,
  language: Language = "en",
): Metadata {
  const path = legalPath(document, language);
  const title = `${ui[language].titles[document]} — TaskFlow`;
  const description = copy[language][document].description;
  return {
    title: `${ui[language].titles[document]} — TaskFlow · ${company.name}`,
    description,
    robots: !publicationReady ? { index: false, follow: false } : undefined,
    alternates: process.env.SITE_URL
      ? {
          canonical: path,
          languages: Object.fromEntries([
            ...languages.map((locale) => [locale, legalPath(document, locale)]),
            ["x-default", legalPath(document)],
          ]),
        }
      : undefined,
    openGraph: {
      type: "website",
      siteName: "TaskFlow",
      title,
      description,
      ...(process.env.SITE_URL ? { url: path } : {}),
      locale: locales[language],
      alternateLocale: languages
        .filter((code) => code !== language)
        .map((code) => locales[code]),
      images: [previewImage(language)],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export function localiseLegalLink(href: string, language: Language) {
  const document = documents.find((id) => href.startsWith(`/${id}/`));
  return document
    ? href.replace(`/${document}/`, legalPath(document, language))
    : href;
}
