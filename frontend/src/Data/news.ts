import type { Article } from '../Types/news'

export const articles: Article[] = [
  { id: 1, source: 'SRF News', category: 'Verkehr, SBB & Zürich', title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit', excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae justo eget magna fermentum iaculis eu non diam.', time: '08:42', readTime: '6 Min.', imagePosition: '17%' },
  { id: 2, source: 'ETH Zürich', category: 'Wissenschaft, Technologie & KI', title: 'Sed do eiusmod tempor incididunt ut labore et dolore', excerpt: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.', time: '07:15', readTime: '8 Min.', imagePosition: '52%' },
  { id: 3, source: 'NZZ', category: 'Wirtschaft, Arbeit & Unternehmen', title: 'Ut enim ad minim veniam, quis nostrud exercitation', excerpt: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.', time: '06:30', readTime: '5 Min.', imagePosition: '76%' },
  { id: 4, source: 'WOZ', category: 'Kultur', title: 'Duis aute irure dolor in reprehenderit in voluptate', excerpt: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.', time: 'Gestern', readTime: '7 Min.', imagePosition: '92%' },
  { id: 5, source: 'SRF News', category: 'Politik, Abstimmungen & Recht', title: 'Excepteur sint occaecat cupidatat non proident', excerpt: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', time: 'Gestern', readTime: '4 Min.', imagePosition: '38%' },
  { id: 7, source: 'WOZ', category: 'Gesundheit, Bildung & Gesellschaft', title: 'Curabitur pretium tincidunt lacus nulla gravida orci', excerpt: 'Curabitur pretium tincidunt lacus. Nulla gravida orci a odio, nullam varius turpis et commodo pharetra.', time: 'Gestern', readTime: '7 Min.', imagePosition: '47%' },
  { id: 8, source: 'SRF News', category: 'Sport', title: 'Praesent dapibus neque id cursus faucibus tortor', excerpt: 'Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat.', time: 'Gestern', readTime: '5 Min.', imagePosition: '83%' },
]

export const sourceDescriptions = [
  { name: 'WOZ', mark: 'WOZ', detail: 'Gesellschaft, Politik und Kultur', tint: '#8a5d2d' },
  { name: 'SRF News', mark: 'SRF', detail: 'Aktuelles aus dem Service public und der Schweiz', tint: '#9d2b27' },
  { name: 'ETH Zürich', mark: 'ETH', detail: 'Wissenschaft, Technologie und Forschung', tint: '#4d6659' },
  { name: 'NZZ', mark: 'NZZ', detail: 'Analysen, Wirtschaft und Weltgeschehen', tint: '#293f4c' },
] as const
