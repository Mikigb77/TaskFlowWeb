import { notFound } from "next/navigation";
import LegalPage from "../../../components/LegalPage";
import {
  documents,
  legalMetadata,
  type DocumentId,
} from "../../../content/legal";

export const dynamicParams = false;
type Params = { language: string; document: string };
type Props = { params: Promise<Params> };

function route(params: Params) {
  if (
    (params.language !== "es" && params.language !== "ca") ||
    !documents.includes(params.document as DocumentId)
  )
    notFound();
  return {
    language: params.language,
    document: params.document as DocumentId,
  } as const;
}
export function generateStaticParams() {
  return ["es", "ca"].flatMap((language) =>
    documents.map((document) => ({ language, document })),
  );
}
export async function generateMetadata({ params }: Props) {
  const value = route(await params);
  return legalMetadata(value.document, value.language);
}
export default async function TranslatedLegalPage({ params }: Props) {
  return <LegalPage {...route(await params)} />;
}
