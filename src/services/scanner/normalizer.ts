function collapseSpaces(text: string): string {
  return text.replace(/[ \t]{2,}/g, ' ')
}

function normalizeUrlScheme(text: string): string {
  if (!/^https?:\/\//i.test(text)) return text
  try {
    const url = new URL(text)
    return url.href
  } catch {
    return text
  }
}

function normalizeMailto(text: string): string {
  if (/^mailto:/i.test(text)) return 'mailto:' + text.slice(7)
  return text
}

function normalizeTel(text: string): string {
  if (/^tel:/i.test(text)) return 'tel:' + text.slice(4)
  return text
}

function normalizeWifi(text: string): string {
  if (/^wifi:/i.test(text)) return 'WIFI:' + text.slice(5)
  return text
}

export function normalize(raw: string): string {
  const trimmed = raw.trim()
  const collapsed = collapseSpaces(trimmed)
  const withUrl = normalizeUrlScheme(collapsed)
  const withMailto = normalizeMailto(withUrl)
  const withTel = normalizeTel(withMailto)
  return normalizeWifi(withTel)
}
