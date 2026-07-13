import { useState } from 'react'
import { HiOutlineBookmark, HiOutlineHome } from 'react-icons/hi'
import Header from '../Components/Header'
import NewsCard from '../Components/NewsCard'
import Ornament from '../Components/Ornament'
import { articles } from '../Data/news'
import type { Article } from '../Types/news'
import { getSavedArticleIds, getSavedArticles, setArticleSaved } from '../Utils/articleActions'

function loadSavedNews(): Article[] {
  const ids = getSavedArticleIds()
  const snapshots = getSavedArticles()
  return ids
    .map((id) => snapshots.find((article) => article.id === id) ?? articles.find((article) => article.id === id))
    .filter((article): article is Article => Boolean(article))
}

export default function SavedNewsPage() {
  const [savedArticles, setSavedArticles] = useState(loadSavedNews)

  const removeArticle = (article: Article) => {
    setArticleSaved(article, false)
    setSavedArticles(loadSavedNews())
  }

  return <div className="site-shell"><div className="paper saved-paper">
    <Header />
    <main className="saved-main">
      <section className="saved-hero">
        <div className="saved-hero__seal"><HiOutlineBookmark /></div>
        <Ornament />
        <span>Ihre persönliche Leseliste</span>
        <h2>Gespeicherte Nachrichten</h2>
        <p>Beiträge, die Sie später in Ruhe lesen möchten, bleiben in diesem Browser gespeichert.</p>
        <strong>{savedArticles.length} {savedArticles.length === 1 ? 'gespeicherter Beitrag' : 'gespeicherte Beiträge'}</strong>
      </section>

      {savedArticles.length ? <div className="saved-news-grid news-grid">
        {savedArticles.map((article) => <NewsCard key={article.id} article={article} saved onSave={() => removeArticle(article)} />)}
      </div> : <div className="saved-empty">
        <HiOutlineBookmark />
        <h3>Ihre Merkliste ist noch leer</h3>
        <p>Klicken Sie bei einer Nachricht auf das Lesezeichen, um sie hier für später aufzubewahren.</p>
        <a href="#/"><HiOutlineHome /> Zur Titelseite</a>
      </div>}
    </main>
    <footer><div className="footer-brand"><span>+</span><strong>CODITO ZEITUNG</strong><span>+</span></div><p>Fünf Quellen. Ein Land. Alle Perspektiven.</p><small>© 2026 Codito Zeitung · Mit Neugier in der Schweiz gemacht</small></footer>
  </div></div>
}
