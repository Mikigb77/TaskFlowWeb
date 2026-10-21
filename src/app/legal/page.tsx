import LegalPage from "../../components/LegalPage";
import { legalMetadata } from "../../content/legal";

export const metadata = legalMetadata("legal");
export default function OperatorPage() {
  return <LegalPage document="legal" />;
}
