import Icon from "./Icon";

export default function Footer() {
  return (
    <footer className="site-footer container">
      <div className="footer-top">
        <div>
          <a href="/" className="brand" aria-label="TaskFlow home">
            <span className="brand-mark">
              <Icon name="logo" size={23} />
            </span>
            <span>
              taskflow<span className="brand-period">.</span>
            </span>
          </a>
          <p>A little focus. A little flow.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href={`/#features`}>Features</a>
          <a href={`/#demo`}>Try the demo</a>
          <a href={`/#questions`}>Questions</a>
          <a href="/privacy/">Privacy</a>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} TaskFlow</span>
        <span className="footer-note">
          <span className="tiny-spark">
            <Icon name="asterisk" size={16} />
          </span>{" "}
          Made for a little more headspace.
        </span>
        <a href="#main-content">Back to top ↑</a>
      </div>
    </footer>
  );
}
