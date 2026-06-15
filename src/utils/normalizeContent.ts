// U+200B-200F (zero-width space/non-joiner/joiner/marks) and U+FEFF (BOM)
const ZERO_WIDTH = new Set<number>([0x200b, 0x200c, 0x200d, 0x200e, 0x200f, 0xfeff])
const SEPARATOR_SPLIT_RE = /[\s.\-_]+/

function removeZeroWidth(text: string): string {
  return [...text].filter((ch) => !ZERO_WIDTH.has(ch.codePointAt(0) ?? 0)).join('')
}

function isUrl(text: string): boolean {
  return /^https?:\/\//i.test(text)
}

// Collapses sequences of single graphemes separated by spaces/dots/dashes/underscores.
// "F U C K" -> "fuck", spaced-out Vietnamese -> joined. Multi-char tokens are kept intact.
function collapseSpacedLetters(text: string): string {
  const tokens = text.split(SEPARATOR_SPLIT_RE).filter(Boolean)
  if (tokens.length > 1 && tokens.every((t) => [...t].length === 1)) {
    return tokens.join('')
  }
  return text
}

function collapseSpaces(text: string): string {
  return text.replace(/\s{2,}/g, ' ')
}

export function normalizeContent(raw: string): string {
  const trimmed = raw.trim()
  const withoutZeroWidth = removeZeroWidth(trimmed)
  const unicode = withoutZeroWidth.normalize('NFKC')

  if (isUrl(unicode)) return unicode

  const lower = unicode.toLowerCase()
  const collapsed = collapseSpacedLetters(lower)
  return collapseSpaces(collapsed)
}
