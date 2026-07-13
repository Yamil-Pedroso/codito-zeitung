import { useState } from 'react'
import { HiChevronDown, HiOutlineGlobeAlt } from 'react-icons/hi'

const languages = [
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
] as const

export default function LanguageSelector() {
  const [language, setLanguage] = useState('de')
  const selectedLanguage = languages.find((item) => item.code === language) ?? languages[0]

  return <label className="language-selector">
    <HiOutlineGlobeAlt className="language-selector__globe" aria-hidden="true" />
    <span className="sr-only">Sprache auswählen</span>
    <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Sprache auswählen">
      {languages.map((item) => <option value={item.code} key={item.code}>{item.label}</option>)}
    </select>
    <span className="language-selector__code" aria-hidden="true">{selectedLanguage.code.toUpperCase()}</span>
    <HiChevronDown className="language-selector__chevron" aria-hidden="true" />
  </label>
}
