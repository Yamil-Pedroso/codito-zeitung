import { useState } from "react";
import { HiOutlineMenuAlt3, HiOutlineX } from "react-icons/hi";
import { categoryNavigation } from "../Data/categoryNavigation";
import type { Category } from "../Types/news";
import Ornament from "./Ornament";

export default function Header({
  activeCategory = null,
}: {
  activeCategory?: Category | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const localDate = new Date().toLocaleDateString("de-CH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <header>
      <div className="utility-bar">
        <span>{localDate}</span>
        <span className="edition">Morgenausgabe · Zürich</span>
        <a className="search-trigger" href="#nachrichten">
          Nachrichten finden
        </a>
      </div>
      <div className="masthead">
        <div className="masthead-kicker">
          <Ornament /> Unabhängige Schweizer Zeitung <Ornament />
        </div>
        <div className="brand-row">
          <span className="swiss-mark" aria-hidden="true" />
          <h1>
            CODITO
            <br className="mobile-break" /> ZEITUNG
          </h1>
          <span className="swiss-mark" aria-hidden="true" />
        </div>
        <p>Nachrichten aus der Schweiz – mit Weitblick erklärt</p>
      </div>
      <nav
        className={menuOpen ? "nav nav--open" : "nav"}
        aria-label="Hauptnavigation"
      >
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menü öffnen"
        >
          {menuOpen ? <HiOutlineX /> : <HiOutlineMenuAlt3 />}
          <span>Rubriken</span>
        </button>
        <div className="nav-links">
          {categoryNavigation.map((item) => (
            <a
              className={item.category === activeCategory ? "active" : ""}
              href={item.category ? `#/rubrik/${item.slug}` : "#/"}
              onClick={() => setMenuOpen(false)}
              key={item.label}
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
