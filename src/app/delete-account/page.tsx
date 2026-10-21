import LegalPage from "../../components/LegalPage";
import { legalMetadata } from "../../content/legal";

export const metadata = legalMetadata("delete-account");
export default function DeletionPage() {
  return <LegalPage document="delete-account" />;
}
