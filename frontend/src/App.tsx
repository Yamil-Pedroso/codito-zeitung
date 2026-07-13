import { useEffect, useState } from 'react'
import { articles } from './Data/news'
import HomePage from './Pages/HomePage'
import NewsDetailsPage from './Pages/NewsDetailsPage'

function getArticleId() {
  const match = window.location.hash.match(/^#\/nachricht\/(\d+)$/)
  return match ? Number(match[1]) : null
}

export default function App() {
  const [articleId, setArticleId] = useState(getArticleId)

  useEffect(() => {
    const handleRouteChange = () => {
      setArticleId(getArticleId())
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.addEventListener('hashchange', handleRouteChange)
    return () => window.removeEventListener('hashchange', handleRouteChange)
  }, [])

  const article = articleId === null ? undefined : articles.find((item) => item.id === articleId)
  return article ? <NewsDetailsPage article={article} /> : <HomePage />
}
