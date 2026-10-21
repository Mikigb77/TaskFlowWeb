import LegalPage from "../../components/LegalPage";
import { legalMetadata } from "../../content/legal";

export const metadata = legalMetadata("privacy");
export default function PrivacyPage() {
  return <LegalPage document="privacy" />;
}
