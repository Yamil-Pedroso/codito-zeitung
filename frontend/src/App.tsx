import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import NewsUpdateModal from './Components/NewsUpdateModal'
import WelcomeModal from './Components/WelcomeModal'
import { articles } from './Data/news'
import HomePage from './Pages/HomePage'
import NewsDetailsPage from './Pages/NewsDetailsPage'
import SavedNewsPage from './Pages/SavedNewsPage'
import { getSavedArticles } from './Utils/articleActions'

function getArticleId(hash: string) {
  const match = hash.match(/^#\/nachricht\/(\d+)$/)
  return match ? Number(match[1]) : null
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    const handleRouteChange = () => {
      setHash(window.location.hash)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.addEventListener('hashchange', handleRouteChange)
    return () => window.removeEventListener('hashchange', handleRouteChange)
  }, [])

  const articleId = getArticleId(hash)
  const article = articleId === null
    ? undefined
    : articles.find((item) => item.id === articleId) ?? getSavedArticles().find((item) => item.id === articleId)
  const page = hash === '#/gespeichert'
    ? <SavedNewsPage />
    : article
      ? <NewsDetailsPage article={article} />
      : <HomePage />

  return <>
    <Toaster position="top-right" closeButton toastOptions={{ className: 'vintage-toast' }} />
    <WelcomeModal />
    <NewsUpdateModal />
    {page}
  </>
}
