import { useRef, useState } from 'react'
import { HiOutlineBookmark, HiOutlineClipboardCopy, HiOutlineDownload, HiOutlineMail, HiOutlineShare } from 'react-icons/hi'
import type { Article } from '../Types/news'
import { exportArticle, getSavedArticleIds, getShareData, setArticleSaved, shareArticle } from '../Utils/articleActions'

export default function ArticleActions({ article }: { article: Article }) {
  const [saved, setSaved] = useState(() => getSavedArticleIds().includes(article.id))
  const [message, setMessage] = useState('')
  const saveMenu = useRef<HTMLDetailsElement>(null)
  const shareMenu = useRef<HTMLDetailsElement>(null)

  const close = (menu: React.RefObject<HTMLDetailsElement | null>) => {
    if (menu.current) menu.current.open = false
  }

  const notify = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 2200)
  }

  const toggleSaved = () => {
    const next = !saved
    setArticleSaved(article, next)
    setSaved(next)
    close(saveMenu)
  }

  const handleExport = (format: Parameters<typeof exportArticle>[1]) => {
    try {
      exportArticle(article, format)
      notify(format === 'pdf' ? 'Druckdialog für PDF geöffnet' : 'Download gestartet')
    } catch {
      notify('Pop-up wurde vom Browser blockiert')
    }
    close(saveMenu)
  }

  const copyLink = async () => {
    const url = getShareData(article).url
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const input = document.createElement('textarea')
      input.value = url
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      input.remove()
    }
    notify('Link kopiert')
    close(shareMenu)
  }

  const nativeShare = async () => {
    try {
      await navigator.share(getShareData(article))
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') notify('Teilen nicht möglich')
    }
    close(shareMenu)
  }

  return <div className="detail-actions">
    <details className="action-menu" ref={saveMenu}>
      <summary><HiOutlineBookmark /> {saved ? 'Gespeichert' : 'Speichern'}</summary>
      <div className="action-menu__panel action-menu__panel--save">
        <button onClick={toggleSaved}><HiOutlineBookmark /> {saved ? 'Lokal entfernen' : 'Im Browser merken'}</button>
        <span className="action-menu__label">Exportieren</span>
        <button onClick={() => handleExport('pdf')}><HiOutlineDownload /> PDF</button>
        <button onClick={() => handleExport('doc')}><HiOutlineDownload /> Word (.doc)</button>
        <button onClick={() => handleExport('csv')}><HiOutlineDownload /> CSV</button>
        <button onClick={() => handleExport('json')}><HiOutlineDownload /> JSON</button>
        <button onClick={() => handleExport('md')}><HiOutlineDownload /> Markdown</button>
        <button onClick={() => handleExport('txt')}><HiOutlineDownload /> Text</button>
      </div>
    </details>
    <details className="action-menu" ref={shareMenu}>
      <summary><HiOutlineShare /> Teilen</summary>
      <div className="action-menu__panel">
        {'share' in navigator && <button onClick={nativeShare}><HiOutlineShare /> Systemdialog</button>}
        <button onClick={() => { shareArticle(article, 'whatsapp'); close(shareMenu) }}>WhatsApp</button>
        <button onClick={() => { shareArticle(article, 'gmail'); close(shareMenu) }}><HiOutlineMail /> Gmail</button>
        <button onClick={() => { shareArticle(article, 'email'); close(shareMenu) }}><HiOutlineMail /> E-Mail</button>
        <button onClick={copyLink}><HiOutlineClipboardCopy /> Link kopieren</button>
      </div>
    </details>
    {message && <span className="action-feedback" role="status">{message}</span>}
  </div>
}
