import { HiOutlineArrowLeft, HiOutlineClock, HiOutlineExternalLink } from 'react-icons/hi'
import ArticleActions from '../Components/ArticleActions'
import Header from '../Components/Header'
import NewsCard from '../Components/NewsCard'
import Ornament from '../Components/Ornament'
import { categoryImages } from '../Data/categoryImages'
import { articles } from '../Data/news'
import type { Article } from '../Types/news'

export default function NewsDetailsPage({ article }: { article: Article }) {
  const related = articles.filter((item) => item.id !== article.id).slice(0, 3)
  const paragraphs = article.content?.length ? article.content : [article.excerpt]

  return <div className="site-shell"><div className="paper detail-paper">
    <Header />
    <main className="detail-main">
      <a className="back-link" href="#/"><HiOutlineArrowLeft /> Zurück zur Titelseite</a>
      <article className="article-detail">
        <header className="article-detail__header">
          <span className="detail-category">{article.category}</span>
          <h2>{article.title}</h2>
          <p className="detail-deck">{article.excerpt}</p>
          {article.url && <a className="original-source-link" href={article.url} target="_blank" rel="noreferrer">
            Originalartikel bei {article.source} lesen <HiOutlineExternalLink />
          </a>}
          <div className="detail-byline">
            <div><strong>{article.source}</strong><span>Redaktion Codito Zeitung</span></div>
            <span><HiOutlineClock /> {article.time} · {article.readTime} Lesezeit</span>
            <ArticleActions article={article} />
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
          </div>
          <aside className="source-box">
            <span>Quelle</span>
            <strong>{article.source}</strong>
            <p>Die Zusammenfassung basiert auf den Angaben der Originalquelle.</p>
            {article.url && <a href={article.url} target="_blank" rel="noreferrer">Bei {article.source} weiterlesen <HiOutlineExternalLink /></a>}
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
    <footer className="detail-footer"><div className="footer-brand"><span>+</span><strong>CODITO ZEITUNG</strong><span>+</span></div><p>Fünf Quellen. Ein Land. Alle Perspektiven.</p><small>© 2026 Codito Zeitung · Mit Neugier in der Schweiz gemacht</small></footer>
  </div></div>
}
