import assets from '../assets'
import type { Category } from '../Types/news'

export const categoryImages: Record<Category, string> = {
  'Politik, Abstimmungen & Recht': assets.politik,
  'Wirtschaft, Arbeit & Unternehmen': assets.wirtschaft,
  'Wissenschaft, Technologie & KI': assets.wissenschaft,
  'Gesundheit, Bildung & Gesellschaft': assets.gesundheit,
  'Verkehr, SBB & Zürich': assets.transport,
  'Kultur': assets.kultur,
  'Sport': assets.sport,
}
