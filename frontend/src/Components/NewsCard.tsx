import { HiBookmark, HiOutlineBookmark, HiOutlineClock } from 'react-icons/hi'
import type { Article } from '../Types/news'
import { categoryImages } from '../Data/categoryImages'

export default function NewsCard({ article, featured = false, saved, onSave }: { article: Article; featured?: boolean; saved: boolean; onSave: () => void }) { return <article className={`news-card ${featured ? 'news-card--featured' : ''}`}>
  <div className="news-card__image"><img src={categoryImages[article.category]} alt={`Vintage-Illustration: ${article.category}`} /><span>{article.category}</span><button onClick={onSave} aria-label={saved ? 'Aus den Lesezeichen entfernen' : 'Nachricht speichern'}>{saved ? <HiBookmark /> : <HiOutlineBookmark />}</button></div>
  <div className="news-card__copy"><p className="news-source">{article.source} <i /> {article.time}</p><h3>{article.title}</h3><p className="news-excerpt">{article.excerpt}</p><div className="news-footer"><span><HiOutlineClock /> {article.readTime}</span><a href={`#/nachricht/${article.id}`}>Weiterlesen →</a></div></div>
</article> }
