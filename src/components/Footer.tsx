"use client";

import GarbarMark from "./GarbarMark";
import Icon from "./Icon";
import LanguageSwitch from "./LanguageSwitch";
import { useSiteLanguage } from "./useSiteLanguage";
import company from "../content/legal/company.json";
import { legalPath } from "../content/legal/types";
import { copy, homePath } from "../content/site";
import { family, GARBAR_URL, LUCID_SAGA_URL } from "../content/site/family";

export default function Footer() {
  const language = useSiteLanguage();
  const { frame } = copy[language];
  const { footer } = frame;
  const f = family[language];
  const home = homePath(language);
  // "A product by {company}", with GarBar's mark and name linking to garbar.tech, as on Lucid Saga.
  const [byBefore] = footer.operator.split("{company}");
  // GarBar's footer, as Lucid Saga and garbar.tech close: a dark band with the app and its maker,
  // link columns, the fine print, and the name written large at the bottom.
  return (
    <footer className="site-footer">
      <div className="footer-glow" aria-hidden="true"></div>
      <div className="container footer-inner">
        <div className="footer-top">
          <div className="footer-about">
            <a href={home} className="brand" aria-label={frame.home}>
              <span className="brand-mark">
                <Icon name="logo" size={23} />
              </span>
              <span>
                taskflow<span className="brand-period">.</span>
              </span>
            </a>
            <p className="footer-tagline">
              {copy[language].hero.title}
              {copy[language].hero.titleAccent}
            </p>
            <p className="footer-operator">
              {byBefore.trim()}{" "}
              <a href={`${GARBAR_URL}/${language}/`} className="footer-garbar">
                <GarbarMark size={16} />
                GarBar
              </a>
            </p>
            <p className="footer-made">
              <span aria-hidden="true"></span>
              {f.footer.madeIn}
            </p>
          </div>
          <div className="footer-columns">
            <nav aria-label={footer.navigation}>
              <p className="footer-heading">{f.footer.product}</p>
              <a href={`${home}#voice`}>{frame.voice}</a>
              <a href={`${home}#how`}>{f.nav.how}</a>
              <a href={`${home}#features`}>{frame.features}</a>
              <a href={`${home}#plans`}>{f.nav.plans}</a>
              <a href={`${home}#questions`}>{frame.questions}</a>
            </nav>
            <nav aria-label={f.footer.company}>
              <p className="footer-heading">{f.footer.company}</p>
              <a href={`${GARBAR_URL}/${language}/`}>
                {f.footer.garbar} <Icon name="arrowUp" size={14} />
              </a>
              <a href={`${LUCID_SAGA_URL}/${language}`}>
                {f.family.sibling.name} <Icon name="arrowUp" size={14} />
              </a>
            </nav>
            <nav className="footer-legal" aria-label={footer.legal}>
              <p className="footer-heading">{f.footer.legal}</p>
              <a href={legalPath("privacy", language)}>{footer.privacy}</a>
              <a href={legalPath("terms", language)}>{footer.terms}</a>
              <a href={legalPath("legal", language)}>{footer.legalNotice}</a>
              <a href={legalPath("delete-account", language)}>
                {footer.deleteAccount}
              </a>
              <a href={`mailto:${company.contactEmail}`}>{footer.support}</a>
            </nav>
          </div>
        </div>
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
      </div>
      <p className="footer-wordmark" aria-hidden="true">
        taskflow.
      </p>
    </footer>
  );
}
