/** Small safe markdown → HTML for wiki preview. Escapes first, then marks up, then DOMPurify. */

import DOMPurify from "dompurify"

const WIKI_TOKEN = /\uE000wiki:([^\uE001]+)\uE001/g
const SCRIPTURE_TOKEN = /\uE000ref:([^\uE001]+)\uE001/g

const PURIFY: Parameters<typeof DOMPurify.sanitize>[1] = {
  ALLOWED_TAGS: ["p", "br", "strong", "em", "code", "ul", "li", "h1", "h2", "h3", "a", "button"],
  ALLOWED_ATTR: ["href", "target", "rel", "class", "type", "data-wiki-ref", "data-wiki-page"],
  ALLOW_DATA_ATTR: false,
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Extract [[targets]] from markdown (titles or scripture refs). */
export function extractWikiLinks(body: string): string[] {
  const found: string[] = []
  const re = /\[\[([^\]]+)\]\]/g
  let match: RegExpExecArray | null
  while ((match = re.exec(body))) {
    const target = match[1].trim()
    if (target) found.push(target)
  }
  return [...new Set(found)]
}

function inlineMarkdown(escaped: string) {
  return escaped
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
}

/**
 * Protect [[links]] as tokens, escape HTML, restore as buttons/anchors via data attributes.
 * Scripture-shaped targets get data-wiki-ref; page titles get data-wiki-page.
 */
export function renderWikiMarkdown(body: string, isScripture: (target: string) => boolean): string {
  const placeholders: { token: string; html: string }[] = []
  let protectedBody = body.replace(/\[\[([^\]]+)\]\]/g, (_, raw: string) => {
    const target = raw.trim()
    const index = placeholders.length
    const token = isScripture(target) ? `\uE000ref:${index}\uE001` : `\uE000wiki:${index}\uE001`
    const attr = escapeHtml(target)
    placeholders.push({
      token,
      html: isScripture(target)
        ? `<button type="button" class="wiki-link wiki-ref" data-wiki-ref="${attr}">${attr}</button>`
        : `<button type="button" class="wiki-link wiki-page" data-wiki-page="${attr}">${attr}</button>`,
    })
    return token
  })

  const escaped = escapeHtml(protectedBody)
  const lines = escaped.split(/\n/)
  const out: string[] = []
  let inList = false

  function closeList() {
    if (inList) {
      out.push("</ul>")
      inList = false
    }
  }

  for (const line of lines) {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line)
    if (heading) {
      closeList()
      const level = heading[1].length
      out.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`)
      continue
    }
    const list = /^[-*]\s+(.+)$/.exec(line)
    if (list) {
      if (!inList) {
        out.push("<ul>")
        inList = true
      }
      out.push(`<li>${inlineMarkdown(list[1])}</li>`)
      continue
    }
    closeList()
    if (!line.trim()) {
      out.push("")
      continue
    }
    out.push(`<p>${inlineMarkdown(line)}</p>`)
  }
  closeList()

  let html = out.join("\n")
  for (const item of placeholders) {
    // Fixed string replace — avoid $-pattern injection from String.replace
    html = html.split(item.token).join(item.html)
  }
  // Clean any leftover tokens if escape mangled them
  html = html.replace(WIKI_TOKEN, "").replace(SCRIPTURE_TOKEN, "")
  return DOMPurify.sanitize(html, PURIFY)
}
