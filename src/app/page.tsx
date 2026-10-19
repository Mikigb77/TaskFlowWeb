import type { Metadata } from "next";
import HomePage from "../components/HomePage";
import { homeAlternates } from "../content/site";

export const metadata: Metadata = { alternates: homeAlternates("en") };

export default function EnglishHomePage() {
  return <HomePage language="en" />;
}
