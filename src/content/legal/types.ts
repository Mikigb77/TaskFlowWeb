export const languages = ["en", "es", "ca"] as const;
export type Language = (typeof languages)[number];
export const documents = [
  "privacy",
  "terms",
  "legal",
  "delete-account",
] as const;
export type DocumentId = (typeof documents)[number];

export type Section = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  links?: { label: string; href: string }[];
  contact?: "privacy" | "deletion" | "withdrawal";
  company?: boolean;
};
export type LegalDocument = {
  title: string;
  description: string;
  summary: string[];
  sections: Section[];
};
export type LegalCopy = Record<DocumentId, LegalDocument>;

export function legalPath(document: DocumentId, language: Language = "en") {
  return `${language === "en" ? "" : `/${language}`}/${document}/`;
}
