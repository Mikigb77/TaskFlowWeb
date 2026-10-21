import {
  company,
  copy,
  documents,
  legalContactHref,
  legalPath,
  legalVersionDate,
  localiseLegalLink,
  ui,
  type DocumentId,
  type Language,
} from "../content/legal";
import { homePath } from "../content/site";
import Icon from "./Icon";
import LanguageSwitch from "./LanguageSwitch";

function CompanyDetails({ language }: { language: Language }) {
  const t = ui[language];
  const fields = [
    [t.company, company.name],
    [t.taxId, company.taxId],
    [t.address, company.registeredAddress],
    [t.register, t.registration],
    [t.generalContact, company.generalEmail],
    [t.contact, company.contactEmail],
  ];
  return (
    <dl className="legal-company">
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>
            {value ? (
              (label === t.contact || label === t.generalContact) &&
              company.contactChannelsVerified ? (
                <a href={`mailto:${value}`}>{value}</a>
              ) : (
                value
              )
            ) : (
              <span className="legal-pending">{t.pending}</span>
            )}
            {(label === t.contact || label === t.generalContact) &&
              !company.contactChannelsVerified && (
                <span className="legal-pending"> · {t.emailPending}</span>
              )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Contact({
  language,
  purpose,
  lead,
}: {
  language: Language;
  purpose: "privacy" | "deletion" | "withdrawal";
  lead?: string;
}) {
  const t = ui[language];
  if (!company.contactEmail || !company.contactChannelsVerified)
    return <p className="legal-contact-pending">{t.contactPending}</p>;
  const label =
    purpose === "deletion"
      ? t.deletion
      : purpose === "withdrawal"
        ? t.withdrawal
        : t.write;
  const at = company.contactEmail.indexOf("@");
  return (
    <div className="legal-contact">
      {lead && <p className="legal-contact-lead">{lead}</p>}
      <a className="button" href={legalContactHref(purpose, language)}>
        {label}
      </a>
      {purpose === "deletion" ? (
        <>
          <p className="legal-contact-help">{t.requestHelp}</p>
          <dl className="legal-mail-details">
            <div>
              <dt>{t.recipient}</dt>
              <dd>
                {at > 0 ? (
                  <>
                    {company.contactEmail.slice(0, at)}
                    <wbr />
                    {company.contactEmail.slice(at)}
                  </>
                ) : (
                  company.contactEmail
                )}
              </dd>
            </div>
            <div>
              <dt>{t.subject}</dt>
              <dd>{t.subjects.deletion}</dd>
            </div>
          </dl>
        </>
      ) : (
        <span>{company.contactEmail}</span>
      )}
    </div>
  );
}

export default function LegalPage({
  document,
  language = "en",
}: {
  document: DocumentId;
  language?: Language;
}) {
  const t = ui[language];
  const content = copy[language][document];
  return (
    <article
      className={`legal-page container${document === "delete-account" ? " legal-page--deletion" : ""}`}
      lang={language}
    >
      <div className="legal-utility">
        <a href={homePath(language)} className="inline-link">
          <Icon name="back" size={16} /> {t.back}
        </a>
        {document !== "delete-account" && (
          <LanguageSwitch className="legal-languages" label={t.language} />
        )}
      </div>
      <header className="legal-hero">
        <h1>{content.title}</h1>
        <p className="legal-version">
          <span>
            {t.updated}{" "}
            <time dateTime={company.version}>{legalVersionDate(language)}</time>
          </span>
        </p>
        {document !== "delete-account" && (
          <nav className="legal-actions" aria-label={t.actions}>
            <a href={legalPath("delete-account", language)}>
              {t.titles["delete-account"]}{" "}
              <Icon name="arrow" size={16} className="legal-arrow" />
            </a>
            {company.contactChannelsVerified && (
              <a href={legalContactHref("privacy", language)}>{t.write}</a>
            )}
          </nav>
        )}
      </header>
      {document === "delete-account" && (
        <section
          className="legal-request"
          aria-labelledby="request-start-title"
        >
          <div>
            <h2 id="request-start-title">{t.requestTitle}</h2>
            <p>{t.requestIntro}</p>
          </div>
          <Contact
            language={language}
            purpose="deletion"
            lead={t.requestEmail}
          />
        </section>
      )}
      {document === "delete-account" && (
        <div className="legal-utility legal-utility--languages">
          <LanguageSwitch className="legal-languages" label={t.language} />
        </div>
      )}
      <ul className="legal-summary" aria-label={t.summary}>
        {content.summary.map((line, index) => (
          <li key={line}>
            <span aria-hidden="true">0{index + 1}</span>
            <p>{line}</p>
          </li>
        ))}
      </ul>
      <div className="legal-layout">
        <aside className="legal-sidebar">
          <nav className="legal-toc" aria-label={t.contents}>
            <p>{t.contents}</p>
            {content.sections.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                {section.title}
              </a>
            ))}
          </nav>
          <nav className="legal-related" aria-label={t.documents}>
            <p>{t.documents}</p>
            {documents.map((id) => (
              <a
                key={id}
                href={legalPath(id, language)}
                aria-current={id === document ? "page" : undefined}
              >
                {t.titles[id]}{" "}
                <Icon name="arrow" size={16} className="legal-arrow" />
              </a>
            ))}
          </nav>
        </aside>
        <div className="legal-body">
          {content.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-title`}
            >
              <h2 id={`${section.id}-title`}>{section.title}</h2>
              {section.company && <CompanyDetails language={language} />}
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets && (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
              {section.contact && (
                <Contact language={language} purpose={section.contact} />
              )}
              {section.links && (
                <ul className="legal-links">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <a href={localiseLegalLink(link.href, language)}>
                        {link.label}{" "}
                        <Icon
                          name={
                            link.href.startsWith("http") ? "arrowUp" : "arrow"
                          }
                          size={16}
                          className="legal-arrow"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
