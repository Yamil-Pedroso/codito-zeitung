import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { HiOutlineCalendar, HiOutlineClock, HiOutlineX } from 'react-icons/hi'
import { articles, newsUpdate } from '../Data/news'
import type { Article } from '../Types/news'

const LAST_SHOWN_KEY = 'codito-zeitung:news-update-modal:last-shown'
const LAST_UPDATE_KEY = 'codito-zeitung:news-update-modal:last-update'
const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000

const sourceAbbreviations: Record<Article['source'], string> = {
  'SRF News': 'SRF',
  'ETH Zürich': 'ETH',
  NZZ: 'NZZ',
  WOZ: 'WOZ',
  'WWF Schweiz': 'WWF',
}

function shouldOpen() {
  try {
    const lastShown = Number(localStorage.getItem(LAST_SHOWN_KEY) ?? 0)
    const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY)
    return lastUpdate !== newsUpdate.updatedAt || Date.now() - lastShown >= SEVENTY_TWO_HOURS
  } catch {
    return true
  }
}

export default function NewsUpdateModal() {
  const [isOpen, setIsOpen] = useState(shouldOpen)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const isWeekly = newsUpdate.mode === 'weekly'

  const updateDate = useMemo(() => new Intl.DateTimeFormat('de-CH', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Zurich',
  }).format(new Date(newsUpdate.updatedAt)), [])

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    try {
      localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()))
      localStorage.setItem(LAST_UPDATE_KEY, newsUpdate.updatedAt)
    } catch {
      // The modal remains usable when local storage is unavailable.
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return <AnimatePresence>
    {isOpen && <motion.div
      className="update-modal__backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0.01 : 0.25 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setIsOpen(false)
      }}
    >
      <motion.section
        className="update-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-modal-title"
        aria-describedby="update-modal-description"
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 35, rotate: -1.5, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 22, scale: 0.96 }}
        transition={{ duration: shouldReduceMotion ? 0.01 : 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <button ref={closeButtonRef} className="update-modal__close" onClick={() => setIsOpen(false)} aria-label="Aktualisierung schließen">
          <HiOutlineX aria-hidden="true" />
        </button>

        <div className="update-modal__edition">{isWeekly ? 'Sonntagsausgabe' : 'Aktualisierte Ausgabe'} · Zürich</div>
        <div className="update-modal__rule"><span>✦</span></div>
        <div className="update-modal__stamp" aria-hidden="true"><span>{isWeekly ? 'SO' : '72H'}</span></div>
        <p className="update-modal__kicker">{isWeekly ? 'Die Auswahl der Woche ist da' : 'Frisch aus den Schweizer Redaktionen'}</p>
        <h2 id="update-modal-title">{isWeekly ? <>Ihre neue<br /><span>Sonntagslektüre</span></> : <>Nachrichten<br /><span>aktualisiert</span></>}</h2>
        <p id="update-modal-description" className="update-modal__description">
          {isWeekly
            ? 'Wir haben die wichtigsten Geschichten der Woche für einen ruhigen Sonntag zusammengestellt.'
            : 'Die jüngsten Meldungen unserer fünf Quellen sind jetzt in der Zeitung verfügbar.'}
        </p>

        <div className="update-modal__date"><HiOutlineCalendar /> Aktualisiert am {updateDate} Uhr</div>
        <div className="update-modal__headlines" tabIndex={0} aria-label={`${articles.length} aktualisierte Nachrichten`}>
          {articles.map((article) => <a href={`#/nachricht/${article.id}`} onClick={() => setIsOpen(false)} key={article.id}>
            <strong title={article.source}>{sourceAbbreviations[article.source]}</strong>
            <span>{article.title}</span>
          </a>)}
        </div>
        <div className="update-modal__footer">
          <span><HiOutlineClock /> Nächste Ausgabe in 72 Stunden</span>
          <button onClick={() => setIsOpen(false)}>Zeitung lesen <i>→</i></button>
        </div>
      </motion.section>
    </motion.div>}
  </AnimatePresence>
}
