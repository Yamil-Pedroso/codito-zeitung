import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { HiOutlineX } from 'react-icons/hi'

const WELCOME_SEEN_KEY = 'codito-zeitung-welcome-seen'

function isFirstVisit() {
  try {
    return localStorage.getItem(WELCOME_SEEN_KEY) !== 'true'
  } catch {
    return true
  }
}

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(isFirstVisit)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    try {
      localStorage.setItem(WELCOME_SEEN_KEY, 'true')
    } catch {
      // The modal still works when storage is unavailable.
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

  const closeModal = () => setIsOpen(false)

  return <AnimatePresence>
    {isOpen && <motion.div
      className="welcome-modal__backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0.01 : 0.35 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal()
      }}
    >
      <motion.section
        className="welcome-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-modal-title"
        aria-describedby="welcome-modal-description"
        initial={shouldReduceMotion
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.08, rotate: -540, y: 50, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, rotate: 0, y: 0, filter: 'blur(0px)' }}
        exit={shouldReduceMotion
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.14, rotate: 270, y: 35, filter: 'blur(6px)' }}
        transition={shouldReduceMotion
          ? { duration: 0.01 }
          : { duration: 0.82, ease: [0.16, 1, 0.3, 1] }}
      >
        <button ref={closeButtonRef} className="welcome-modal__close" onClick={closeModal} aria-label="Willkommensfenster schließen">
          <HiOutlineX aria-hidden="true" />
        </button>

        <div className="welcome-modal__edition">Sonderausgabe · Schweiz · 2026</div>
        <div className="welcome-modal__rule"><span>◆</span></div>

        <div className="welcome-modal__seal" aria-hidden="true"><span /></div>
        <p className="welcome-modal__kicker">Grüezi &amp; herzlich willkommen</p>
        <h2 id="welcome-modal-title">Willkommen bei<br /><span>Codito Zeitung</span></h2>
        <p id="welcome-modal-description" className="welcome-modal__description">
          Entdecken Sie die wichtigsten Geschichten aus der Schweiz – sorgfältig ausgewählt, übersichtlich erzählt und aus verschiedenen Blickwinkeln beleuchtet.
        </p>

        <div className="welcome-modal__motto"><i />Fünf Quellen. Ein Land. Alle Perspektiven.<i /></div>
        <button className="welcome-modal__enter" onClick={closeModal}>Zeitung entdecken <span>→</span></button>
        <small>Mit Neugier in der Schweiz gemacht</small>
      </motion.section>
    </motion.div>}
  </AnimatePresence>
}
