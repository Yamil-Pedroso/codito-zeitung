import type { Category } from '../Types/news'

export const categoryNavigation: { label: string; slug: string; category: Category | null }[] = [
  { label: 'Titelseite', slug: '', category: null },
  { label: 'Politik', slug: 'politik', category: 'Politik, Abstimmungen & Recht' },
  { label: 'Wirtschaft', slug: 'wirtschaft', category: 'Wirtschaft, Arbeit & Unternehmen' },
  { label: 'Wissenschaft', slug: 'wissenschaft', category: 'Wissenschaft, Technologie & KI' },
  { label: 'Gesellschaft', slug: 'gesellschaft', category: 'Gesundheit, Bildung & Gesellschaft' },
  { label: 'Verkehr', slug: 'verkehr', category: 'Verkehr, SBB & Zürich' },
  { label: 'Kultur', slug: 'kultur', category: 'Kultur' },
  { label: 'Sport', slug: 'sport', category: 'Sport' },
]

export function categoryFromHash(hash: string): Category | null | undefined {
  if (!hash || hash === '#/' || hash === '#') return null
  const slug = hash.match(/^#\/rubrik\/([^/]+)$/)?.[1]
  if (!slug) return undefined
  return categoryNavigation.find((item) => item.slug === slug)?.category
}
