import { useState } from 'react'
import { HiOutlineArrowLeft, HiOutlineBookmark, HiOutlineClock, HiOutlineExternalLink, HiOutlineShare } from 'react-icons/hi'
import Header from '../Components/Header'
import NewsCard from '../Components/NewsCard'
import Ornament from '../Components/Ornament'
import { categoryImages } from '../Data/categoryImages'
import { articles } from '../Data/news'
import type { Article } from '../Types/news'

const placeholderContent = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Viverra aliquet eget sit amet tellus cras adipiscing enim eu turpis.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Praesent elementum facilisis leo vel fringilla est ullamcorper eget nulla facilisi etiam dignissim.',
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Integer malesuada nunc vel risus commodo viverra maecenas accumsan lacus vel facilisis.',
]

export default function NewsDetailsPage({ article }: { article: Article }) {
  const [query, setQuery] = useState('')
  const [saved, setSaved] = useState(false)
  const related = articles.filter((item) => item.id !== article.id).slice(0, 3)
  const paragraphs = article.content?.length ? article.content : placeholderContent

  return <div className="site-shell"><div className="paper detail-paper">
    <Header query={query} setQuery={setQuery} />
    <main className="detail-main">
      <a className="back-link" href="#/"><HiOutlineArrowLeft /> Zurück zur Titelseite</a>
      <article className="article-detail">
        <header className="article-detail__header">
          <span className="detail-category">{article.category}</span>
          <h2>{article.title}</h2>
          <p className="detail-deck">{article.excerpt}</p>
          <div className="detail-byline">
            <div><strong>{article.source}</strong><span>Redaktion Codito Zeitung</span></div>
            <span><HiOutlineClock /> {article.time} · {article.readTime} Lesezeit</span>
            <div className="detail-actions">
              <button onClick={() => setSaved(!saved)} aria-label="Nachricht speichern"><HiOutlineBookmark /> {saved ? 'Gespeichert' : 'Speichern'}</button>
              <button aria-label="Nachricht teilen"><HiOutlineShare /> Teilen</button>
            </div>
          </div>
        </header>

        <figure className="detail-figure">
          <img src={categoryImages[article.category]} alt={`Vintage-Illustration: ${article.category}`} />
          <figcaption><span>Codito Zeitung · Archivillustration</span><span>{article.category}</span></figcaption>
        </figure>

        <div className="article-layout">
          <aside className="article-aside">
            <Ornament compact />
            <span>Das Wichtigste</span>
            <p>{article.excerpt}</p>
          </aside>
          <div className="article-body">
            {paragraphs.map((paragraph, index) => <p className={index === 0 ? 'drop-cap' : ''} key={index}>{paragraph}</p>)}
            <blockquote>«Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.»</blockquote>
            <p>{placeholderContent[1]}</p>
          </div>
          <aside className="source-box">
            <span>Quelle</span>
            <strong>{article.source}</strong>
            <p>Dieser Beitrag wird künftig automatisch mit der Originalquelle verknüpft.</p>
            <a href={`#/nachricht/${article.id}`} aria-disabled="true">Originalbeitrag <HiOutlineExternalLink /></a>
          </aside>
        </div>
      </article>

      <section className="related-news">
        <div className="related-heading"><Ornament compact /><h2>Weitere Nachrichten</h2><Ornament compact /></div>
        <div className="news-grid">
          {related.map((item) => <NewsCard key={item.id} article={item} saved={false} onSave={() => undefined} />)}
        </div>
      </section>
    </main>
    <footer className="detail-footer"><div className="footer-brand"><span>+</span><strong>CODITO ZEITUNG</strong><span>+</span></div><p>Vier Quellen. Ein Land. Alle Perspektiven.</p><small>© 2026 Codito Zeitung · Mit Neugier in der Schweiz gemacht</small></footer>
  </div></div>
}
