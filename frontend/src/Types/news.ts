export type Source = 'SRF News' | 'ETH Zürich' | 'NZZ' | 'WOZ' | 'WWF Schweiz'
export type Category =
  | 'Politik, Abstimmungen & Recht'
  | 'Wirtschaft, Arbeit & Unternehmen'
  | 'Umwelt, Klima & Biodiversität'
  | 'Wissenschaft, Technologie & KI'
  | 'Gesundheit, Bildung & Gesellschaft'
  | 'Verkehr, SBB & Zürich'
  | 'Kultur'
  | 'Sport'
export interface Article {
  id: number
  source: Source
  category: Category
  title: string
  excerpt: string
  content?: string[]
  url?: string
  time: string
  readTime: string
  imagePosition: string
}
