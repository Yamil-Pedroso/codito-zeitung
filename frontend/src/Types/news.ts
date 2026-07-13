export type Source = 'SRF News' | 'ETH Zürich' | 'NZZ' | 'WOZ'
export type Category =
  | 'Politik, Abstimmungen & Recht'
  | 'Wirtschaft, Arbeit & Unternehmen'
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
  time: string
  readTime: string
  imagePosition: string
}
