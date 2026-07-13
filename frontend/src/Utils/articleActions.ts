import type { Article } from '../Types/news'

const SAVED_ARTICLES_KEY = 'codito-zeitung:saved-articles'

function articleUrl(article: Article) {
  return `${window.location.origin}${window.location.pathname}#/nachricht/${article.id}`
}

function safeFilename(article: Article) {
  const slug = article.title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70)
    .toLowerCase()
  return `${slug || 'nachricht'}-${article.id}`
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character]!)
}

function download(content: BlobPart, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function plainText(article: Article) {
  const content = article.content?.length ? article.content : [article.excerpt]
  return [
    article.title,
    article.excerpt,
    '',
    `Quelle: ${article.source}`,
    `Rubrik: ${article.category}`,
    `Veröffentlicht: ${article.time}`,
    article.url ? `Originalartikel: ${article.url}` : '',
    '',
    ...content,
  ].filter(Boolean).join('\n\n')
}

function articleHtml(article: Article) {
  const content = article.content?.length ? article.content : [article.excerpt]
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${escapeHtml(article.title)}</title><style>body{max-width:760px;margin:48px auto;padding:0 24px;color:#202d33;font:16px/1.7 Georgia,serif}h1{font-size:36px;line-height:1.15}header{border-bottom:1px solid #888;margin-bottom:28px}.meta{font:12px/1.5 Arial,sans-serif;color:#555}a{color:#8f2723}footer{border-top:1px solid #888;margin-top:36px;padding-top:12px;font-size:11px;color:#666}@media print{body{margin:0}}</style></head><body><header><p class="meta">CODITO ZEITUNG · ${escapeHtml(article.category)}</p><h1>${escapeHtml(article.title)}</h1><p><strong>${escapeHtml(article.excerpt)}</strong></p><p class="meta">${escapeHtml(article.source)} · ${escapeHtml(article.time)}</p></header>${content.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}${article.url ? `<p><a href="${escapeHtml(article.url)}">Originalartikel bei ${escapeHtml(article.source)}</a></p>` : ''}<footer>Exportiert aus Codito Zeitung · ${escapeHtml(articleUrl(article))}</footer></body></html>`
}

function csvCell(value: string) {
  const spreadsheetSafe = /^[=+\-@]/.test(value) ? `'${value}` : value
  return `"${spreadsheetSafe.replace(/"/g, '""')}"`
}

export function getSavedArticleIds(): number[] {
  try {
    const value = JSON.parse(localStorage.getItem(SAVED_ARTICLES_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((id): id is number => typeof id === 'number') : []
  } catch {
    return []
  }
}

export function setArticleSaved(articleId: number, saved: boolean) {
  const current = getSavedArticleIds()
  const next = saved
    ? Array.from(new Set([...current, articleId]))
    : current.filter((id) => id !== articleId)
  localStorage.setItem(SAVED_ARTICLES_KEY, JSON.stringify(next))
  return next
}

export function exportArticle(article: Article, format: 'pdf' | 'doc' | 'csv' | 'json' | 'md' | 'txt') {
  const filename = safeFilename(article)
  const content = article.content?.length ? article.content : [article.excerpt]

  if (format === 'pdf') {
    const printWindow = window.open('', '_blank')
    if (!printWindow) throw new Error('popup-blocked')
    printWindow.opener = null
    printWindow.document.open()
    printWindow.document.write(articleHtml(article))
    printWindow.document.close()
    let printed = false
    const printOnce = () => {
      if (printed) return
      printed = true
      printWindow.print()
    }
    printWindow.addEventListener('load', printOnce, { once: true })
    window.setTimeout(printOnce, 400)
    return
  }
  if (format === 'doc') {
    download(`\ufeff${articleHtml(article)}`, 'application/msword;charset=utf-8', `${filename}.doc`)
    return
  }
  if (format === 'json') {
    download(JSON.stringify({ ...article, coditoUrl: articleUrl(article) }, null, 2), 'application/json;charset=utf-8', `${filename}.json`)
    return
  }
  if (format === 'csv') {
    const headers = ['title', 'source', 'category', 'published', 'excerpt', 'content', 'originalUrl', 'coditoUrl']
    const values = [article.title, article.source, article.category, article.time, article.excerpt, content.join('\n'), article.url ?? '', articleUrl(article)]
    download(`\ufeff${headers.map(csvCell).join(',')}\r\n${values.map(csvCell).join(',')}\r\n`, 'text/csv;charset=utf-8', `${filename}.csv`)
    return
  }
  if (format === 'md') {
    const markdown = `# ${article.title}\n\n> ${article.excerpt}\n\n**Quelle:** ${article.source}  \n**Rubrik:** ${article.category}  \n**Veröffentlicht:** ${article.time}\n\n${content.join('\n\n')}${article.url ? `\n\n[Originalartikel bei ${article.source}](${article.url})` : ''}\n`
    download(markdown, 'text/markdown;charset=utf-8', `${filename}.md`)
    return
  }
  download(plainText(article), 'text/plain;charset=utf-8', `${filename}.txt`)
}

export function getShareData(article: Article) {
  const url = articleUrl(article)
  return {
    title: article.title,
    text: `${article.title}\n${article.excerpt}`,
    url,
  }
}

export function shareArticle(article: Article, channel: 'whatsapp' | 'gmail' | 'email') {
  const { title, text, url } = getShareData(article)
  const body = `${text}\n\n${url}`
  const target = channel === 'whatsapp'
    ? `https://wa.me/?text=${encodeURIComponent(body)}`
    : channel === 'gmail'
      ? `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`
      : `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`
  window.open(target, '_blank', 'noopener,noreferrer')
}
