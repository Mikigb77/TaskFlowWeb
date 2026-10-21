import { readFile } from "node:fs/promises";

const company = JSON.parse(
  await readFile(
    new URL("../../src/content/legal/company.json", import.meta.url),
    "utf8",
  ),
);
const missing = [];
for (const field of [
  "name",
  "taxId",
  "registeredAddress",
  "commercialRegister",
  "generalEmail",
  "contactEmail",
]) {
  if (typeof company[field] !== "string" || !company[field].trim())
    missing.push(field);
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company.contactEmail))
  missing.push("valid contact email");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company.generalEmail))
  missing.push("valid general email");
if (!company.incorporationConfirmed)
  missing.push("company incorporation/operator confirmation");
if (!Number.isInteger(company.minimumAge) || company.minimumAge < 1)
  missing.push("minimum-age decision");
if (!company.contactChannelsVerified) missing.push("working contact addresses");
if (!/^\d{4}-\d{2}-\d{2}$/.test(company.version))
  missing.push("policy version date");
if (company.publicationApproved !== true)
  missing.push("final text review and publication sign-off");
if (missing.length) {
  console.error("Legal document configuration is incomplete:");
  for (const item of missing) console.error(`- ${item}`);
  process.exitCode = 1;
} else {
  console.log(
    `Legal document configuration valid for ${company.name}, effective ${company.version}. This checks identity, contacts and publication status, not legal compliance.`,
  );
}
