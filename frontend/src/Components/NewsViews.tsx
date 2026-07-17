import { useState } from 'react'
import { HiBookmark, HiOutlineBookmark, HiOutlineClock, HiOutlineTemplate, HiViewGrid, HiViewList } from 'react-icons/hi'
import type { Article } from '../Types/news'
import NewsCard from './NewsCard'

type ViewMode = 'cards' | 'list' | 'edition'
const VIEW_KEY = 'codito-zeitung:news-view'
const sourceAbbreviations: Record<Article['source'], string> = {
  'SRF News': 'SRF', 'ETH Zürich': 'ETH', NZZ: 'NZZ', WOZ: 'WOZ', 'WWF Schweiz': 'WWF',
}
const views = [
  { mode: 'cards', label: 'Karten', icon: HiViewGrid },
  { mode: 'list', label: 'Liste', icon: HiViewList },
  { mode: 'edition', label: 'Zeitung', icon: HiOutlineTemplate },
] as const

function initialView(): ViewMode {
  try {
    const stored = localStorage.getItem(VIEW_KEY)
    return stored === 'list' || stored === 'edition' ? stored : 'cards'
  } catch {
    return 'cards'
  }
}

export default function NewsViews({ articles, featureFirst, saved, onSave }: {
  articles: Article[]
  featureFirst: boolean
  saved: number[]
  onSave: (article: Article) => void
}) {
  const [view, setView] = useState<ViewMode>(initialView)
  const selectView = (nextView: ViewMode) => {
    setView(nextView)
    try { localStorage.setItem(VIEW_KEY, nextView) } catch { /* The selector still works. */ }
  }

  return <>
    <div className="news-view-switcher">
      <span>Ansicht</span>
      <div role="group" aria-label="Darstellung der Nachrichten auswählen">
        {views.map(({ mode, label, icon: Icon }) => <button className={view === mode ? 'active' : ''} type="button" aria-pressed={view === mode} onClick={() => selectView(mode)} key={mode}>
          <Icon aria-hidden="true" /> {label}
        </button>)}
      </div>
    </div>

    {view === 'cards' && <div className="news-grid">
      {articles.map((article, index) => <NewsCard key={article.id} article={article} featured={index === 0 && featureFirst} saved={saved.includes(article.id)} onSave={() => onSave(article)} />)}
    </div>}

    {view === 'list' && <div className="news-list-view">
      {articles.map((article) => <article className="news-list-item" key={article.id}>
        <strong className="news-list-item__source" title={article.source}>{sourceAbbreviations[article.source]}</strong>
        <div className="news-list-item__copy">
          <span>{article.category}</span>
          <h3><a href={`#/nachricht/${article.id}`}>{article.title}</a></h3>
          <p>{article.excerpt}</p>
        </div>
        <div className="news-list-item__actions">
          <span><HiOutlineClock /> {article.time}</span>
          <button onClick={() => onSave(article)} aria-label={saved.includes(article.id) ? 'Aus den Lesezeichen entfernen' : 'Nachricht speichern'}>{saved.includes(article.id) ? <HiBookmark /> : <HiOutlineBookmark />}</button>
          <a href={`#/nachricht/${article.id}`} aria-label={`${article.title} weiterlesen`}>→</a>
        </div>
      </article>)}
    </div>}

    {view === 'edition' && <div className="news-edition-view">
      {articles.map((article, index) => <article className="news-edition-item" key={article.id}>
        <div className="news-edition-item__number">{String(index + 1).padStart(2, '0')}</div>
        <div className="news-edition-item__meta"><strong>{sourceAbbreviations[article.source]}</strong><span>{article.category}</span></div>
        <h3><a href={`#/nachricht/${article.id}`}>{article.title}</a></h3>
        <p>{article.excerpt}</p>
        <footer>
          <span>{article.time} · {article.readTime}</span>
          <button onClick={() => onSave(article)} aria-label={saved.includes(article.id) ? 'Aus den Lesezeichen entfernen' : 'Nachricht speichern'}>{saved.includes(article.id) ? <HiBookmark /> : <HiOutlineBookmark />}</button>
          <a href={`#/nachricht/${article.id}`}>Lesen →</a>
        </footer>
      </article>)}
    </div>}
  </>
}
