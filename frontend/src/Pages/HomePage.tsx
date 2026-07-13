import { useEffect, useMemo, useState } from 'react'
import { HiOutlineSearch, HiOutlineX } from 'react-icons/hi'
import Header from '../Components/Header'
import LeadStory from '../Components/LeadStory'
import NewsCard from '../Components/NewsCard'
import SectionTitle from '../Components/SectionTitle'
import SourceCards from '../Components/SourceCards'
import TopicsBar from '../Components/TopicsBar'
import { categoryFromHash } from '../Data/categoryNavigation'
import { articles } from '../Data/news'
import { getSavedArticleIds, setArticleSaved } from '../Utils/articleActions'

const filters = [
  'Alle',
  'Politik, Abstimmungen & Recht',
  'Wirtschaft, Arbeit & Unternehmen',
  'Umwelt, Klima & Biodiversität',
  'Wissenschaft, Technologie & KI',
  'Gesundheit, Bildung & Gesellschaft',
  'Verkehr, SBB & Zürich',
  'Kultur',
  'Sport',
] as const

const PAGE_SIZE = 9
type Filter = (typeof filters)[number]

export default function HomePage() {
  const [filter, setFilter] = useState<Filter>(() => categoryFromHash(window.location.hash) ?? 'Alle')
  const [query, setQuery] = useState('')
  const [saved, setSaved] = useState<number[]>(getSavedArticleIds)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    const syncNavigation = () => {
      const category = categoryFromHash(window.location.hash)
      if (category === undefined) return
      setFilter(category ?? 'Alle')
      setQuery('')
      setVisibleCount(PAGE_SIZE)
      window.setTimeout(() => {
        if (category) document.getElementById('nachrichten')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        else window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 0)
    }
    syncNavigation()
    window.addEventListener('hashchange', syncNavigation)
    return () => window.removeEventListener('hashchange', syncNavigation)
  }, [])

  const matchingArticles = useMemo(() => articles.filter((article) => {
    const matchesFilter = filter === 'Alle' || article.category === filter
    const needle = query.trim().toLocaleLowerCase('de-CH')
    const searchableText = `${article.title} ${article.excerpt} ${article.source} ${article.category}`.toLocaleLowerCase('de-CH')
    return matchesFilter && searchableText.includes(needle)
  }), [filter, query])

  const visibleArticles = matchingArticles.slice(0, visibleCount)
  const hasMore = visibleCount < matchingArticles.length

  const updateFilter = (nextFilter: Filter) => {
    setFilter(nextFilter)
    setVisibleCount(PAGE_SIZE)
  }

  const updateQuery = (nextQuery: string) => {
    setQuery(nextQuery)
    setVisibleCount(PAGE_SIZE)
  }

  const resetSearch = () => {
    setQuery('')
    setFilter('Alle')
    setVisibleCount(PAGE_SIZE)
  }

  return <div className="site-shell"><div className="paper">
    <Header activeCategory={filter === 'Alle' ? null : filter} />
    <main>
      <LeadStory />
      <SourceCards />
      <TopicsBar />
      <section className="latest" id="nachrichten">
        <SectionTitle>Die neuesten Nachrichten</SectionTitle>
        <div className="news-finder">
          <label className="news-search">
            <HiOutlineSearch />
            <span className="sr-only">Nachrichten suchen</span>
            <input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Titel, Thema oder Quelle suchen…" />
            {query && <button onClick={() => updateQuery('')} aria-label="Suche löschen"><HiOutlineX /></button>}
          </label>
          <label className="category-select">
            <span>Rubrik</span>
            <select value={filter} onChange={(event) => updateFilter(event.target.value as Filter)}>
              {filters.map((item) => <option value={item} key={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <div className="filter-row" aria-label="Nachrichten nach Rubrik filtern">
          {filters.map((item) => <button className={filter === item ? 'selected' : ''} onClick={() => updateFilter(item)} key={item}>{item}</button>)}
        </div>
        <p className="result-count" aria-live="polite">{matchingArticles.length} {matchingArticles.length === 1 ? 'Nachricht gefunden' : 'Nachrichten gefunden'}</p>
        {visibleArticles.length ? <>
          <div className="news-grid">
            {visibleArticles.map((article, index) => <NewsCard key={article.id} article={article} featured={index === 0 && filter === 'Alle' && !query} saved={saved.includes(article.id)} onSave={() => { const nextSaved = !saved.includes(article.id); setSaved(setArticleSaved(article.id, nextSaved)) }} />)}
          </div>
          {hasMore && <div className="load-more"><button onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>Mehr Nachrichten laden<span>Noch {matchingArticles.length - visibleArticles.length} verfügbar</span></button></div>}
        </> : <div className="empty-state"><span>⌕</span><h3>Keine passende Nachricht gefunden</h3><p>Versuchen Sie einen anderen Begriff oder wechseln Sie die Rubrik.</p><button onClick={resetSearch}>Alle Nachrichten anzeigen</button></div>}
      </section>
    </main>
    <footer><div className="footer-brand"><span>+</span><strong>CODITO ZEITUNG</strong><span>+</span></div><p>Fünf Quellen. Ein Land. Alle Perspektiven.</p><div className="footer-links"><a href="#quellen">Quellen</a><a href="#ueber-uns">Über das Projekt</a><a href="#datenschutz">Datenschutz</a></div><small>© 2026 Codito Zeitung · Mit Neugier in der Schweiz gemacht</small></footer>
  </div></div>
}
