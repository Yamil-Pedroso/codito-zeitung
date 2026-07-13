import { useState } from 'react'
import { HiOutlineMenuAlt3, HiOutlineSearch, HiOutlineX } from 'react-icons/hi'
import Ornament from './Ornament'

export default function Header({ query, setQuery }: { query: string; setQuery: (value: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const nav = ['Titelseite', 'Politik', 'Wirtschaft', 'Wissenschaft', 'Gesellschaft', 'Verkehr', 'Kultur', 'Sport']
  return <header>
    <div className="utility-bar"><span>Montag, 13. Juli 2026</span><span className="edition">Morgenausgabe · Zürich</span><button className="search-trigger" onClick={() => setSearchOpen(!searchOpen)} aria-label="Nachrichten suchen"><HiOutlineSearch /> Suchen</button></div>
    <div className="masthead">
      <div className="masthead-kicker"><Ornament /> Unabhängige Schweizer Zeitung <Ornament /></div>
      <div className="brand-row"><span className="swiss-mark" aria-hidden="true">+</span><h1>CODITO<br className="mobile-break" /> ZEITUNG</h1><span className="swiss-mark" aria-hidden="true">+</span></div>
      <p>Nachrichten aus der Schweiz – mit Weitblick erklärt</p>
    </div>
    <nav className={menuOpen ? 'nav nav--open' : 'nav'} aria-label="Hauptnavigation">
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menü öffnen">{menuOpen ? <HiOutlineX /> : <HiOutlineMenuAlt3 />}<span>Rubriken</span></button>
      <div className="nav-links">{nav.map((item, index) => <a className={index === 0 ? 'active' : ''} href={`#${item.toLowerCase()}`} key={item}>{item}</a>)}</div>
    </nav>
    {searchOpen && <div className="search-panel"><HiOutlineSearch /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Alle Quellen durchsuchen…" /><button onClick={() => { setQuery(''); setSearchOpen(false) }} aria-label="Suche schliessen"><HiOutlineX /></button></div>}
  </header>
}
