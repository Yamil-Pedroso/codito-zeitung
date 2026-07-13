import { useMemo, useState } from 'react'
import Header from '../Components/Header'
import LeadStory from '../Components/LeadStory'
import NewsCard from '../Components/NewsCard'
import SectionTitle from '../Components/SectionTitle'
import SourceCards from '../Components/SourceCards'
import TopicsBar from '../Components/TopicsBar'
import { articles } from '../Data/news'
const filters = [
  'Alle',
  'Politik, Abstimmungen & Recht',
  'Wirtschaft, Arbeit & Unternehmen',
  'Wissenschaft, Technologie & KI',
  'Gesundheit, Bildung & Gesellschaft',
  'Verkehr, SBB & Zürich',
  'Kultur',
  'Sport',
] as const
export default function HomePage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('Alle'); const [query, setQuery] = useState(''); const [saved, setSaved] = useState<number[]>([])
  const visibleArticles = useMemo(() => articles.filter(article => { const matchesFilter = filter === 'Alle' || article.category === filter; const needle = query.toLocaleLowerCase('de-CH'); return matchesFilter && `${article.title} ${article.excerpt} ${article.source}`.toLocaleLowerCase('de-CH').includes(needle) }), [filter, query])
  return <div className="site-shell"><div className="paper"><Header query={query} setQuery={setQuery} /><main><LeadStory /><SourceCards /><TopicsBar /><section className="latest" id="schweiz"><SectionTitle>Die neuesten Nachrichten</SectionTitle><div className="filter-row" aria-label="Nachrichten filtern">{filters.map(item => <button className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div>{visibleArticles.length ? <div className="news-grid">{visibleArticles.map((article, index) => <NewsCard key={article.id} article={article} featured={index === 0 && filter === 'Alle' && !query} saved={saved.includes(article.id)} onSave={() => setSaved(current => current.includes(article.id) ? current.filter(id => id !== article.id) : [...current, article.id])} />)}</div> : <div className="empty-state"><span>⌕</span><h3>Keine passende Nachricht gefunden</h3><p>Versuchen Sie einen anderen Begriff oder wechseln Sie die Rubrik.</p></div>}</section></main><footer><div className="footer-brand"><span>+</span><strong>CODITO ZEITUNG</strong><span>+</span></div><p>Vier Quellen. Ein Land. Alle Perspektiven.</p><div className="footer-links"><a href="#quellen">Quellen</a><a href="#ueber-uns">Über das Projekt</a><a href="#datenschutz">Datenschutz</a></div><small>© 2026 Codito Zeitung · Mit Neugier in der Schweiz gemacht</small></footer></div></div>
}
