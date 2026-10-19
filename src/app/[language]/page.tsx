import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomePage from "../../components/HomePage";
import { homeMetadata } from "../../content/site";

export const dynamicParams = false;
type Props = { params: Promise<{ language: string }> };

function route(language: string) {
  if (language !== "es" && language !== "ca") notFound();
  return language;
}
export function generateStaticParams() {
  return [{ language: "es" }, { language: "ca" }];
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return homeMetadata(route((await params).language));
}
export default async function TranslatedHomePage({ params }: Props) {
  return <HomePage language={route((await params).language)} />;
}
