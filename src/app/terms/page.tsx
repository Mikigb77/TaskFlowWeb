import LegalPage from "../../components/LegalPage";
import { legalMetadata } from "../../content/legal";

export const metadata = legalMetadata("terms");
export default function TermsPage() {
  return <LegalPage document="terms" />;
}
