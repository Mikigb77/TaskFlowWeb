"use client";

import Icon from "./Icon";
import LanguageSwitch from "./LanguageSwitch";
import { useSiteLanguage } from "./useSiteLanguage";
import company from "../content/legal/company.json";
import { legalPath } from "../content/legal/types";
import { copy, homePath } from "../content/site";

export default function Footer() {
  const language = useSiteLanguage();
  const { frame } = copy[language];
  const { footer } = frame;
  const home = homePath(language);
  return (
    <footer className="site-footer container">
      <div className="footer-top">
        <div>
          <a href={home} className="brand" aria-label={frame.home}>
            <span className="brand-mark">
              <Icon name="logo" size={23} />
            </span>
            <span>
              taskflow<span className="brand-period">.</span>
            </span>
          </a>
          <p className="footer-operator">
            {footer.operator.replace("{company}", company.name)}
          </p>
        </div>
        <nav aria-label={footer.navigation}>
          <a href={`${home}#voice`}>{frame.voice}</a>
          <a href={`${home}#features`}>{frame.features}</a>
          <a href={`${home}#questions`}>{frame.questions}</a>
        </nav>
      </div>
      <nav className="footer-legal" aria-label={footer.legal}>
        <a href={legalPath("privacy", language)}>{footer.privacy}</a>
        <a href={legalPath("terms", language)}>{footer.terms}</a>
        <a href={legalPath("legal", language)}>{footer.legalNotice}</a>
        <a href={legalPath("delete-account", language)}>
          {footer.deleteAccount}
        </a>
        <a href={`mailto:${company.contactEmail}`}>{footer.support}</a>
      </nav>
      <div className="footer-bottom">
        <div className="footer-fine">
          {/* The year is the build's; a visit in a later year mustn't fail hydration. */}
          <p suppressHydrationWarning>
            © {new Date().getFullYear()} {company.name}
          </p>
          <p>{footer.trademark}</p>
        </div>
        <LanguageSwitch
          className="footer-languages"
          label={frame.language}
          as="group"
        />
        <a href="#main-content" className="footer-back">
          {footer.backToTop}
          <span aria-hidden="true">
            <Icon name="up" size={16} />
          </span>
        </a>
      </div>
    </footer>
  );
}
