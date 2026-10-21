import type { Metadata } from "next";
import HomePage from "../components/HomePage";
import { homeMetadata } from "../content/site";

export const metadata: Metadata = homeMetadata("en");

export default function EnglishHomePage() {
  return <HomePage language="en" />;
}
