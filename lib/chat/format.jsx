import React from 'react'

/**
 * Tiny markdown renderer for AI replies.
 *
 * The previous version built HTML strings with regex and pushed them through
 * dangerouslySetInnerHTML, so any `<img onerror=…>` the model echoed back ran
 * in the page. This one never produces HTML: it tokenises **bold**, *italic*
 * and `code` into React elements, and everything else stays plain text that
 * React escapes for us.
 */

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g

export const renderInline = (text, keyPrefix = 'i') => {
    if (!text) return null
    return String(text)
        .split(INLINE)
        .filter((part) => part !== '')
        .map((part, i) => {
            const key = `${keyPrefix}-${i}`
            if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
                return <strong key={key} className="font-semibold">{part.slice(2, -2)}</strong>
            }
            if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
                return (
                    <code key={key} className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[12.5px] text-emerald-700 dark:text-emerald-300">
                        {part.slice(1, -1)}
                    </code>
                )
            }
            if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                return <em key={key}>{part.slice(1, -1)}</em>
            }
            return <React.Fragment key={key}>{part}</React.Fragment>
        })
}

/** Paragraphs, bullet lists and numbered lists — grouped so lists get real <ul>/<ol>. */
export const renderMarkdown = (text) => {
    if (!text) return null

    const blocks = []
    let list = null

    const flush = () => {
        if (list) blocks.push(list)
        list = null
    }

    String(text).split('\n').forEach((raw, i) => {
        const line = raw.trim()
        if (!line) {
            flush()
            return
        }

        const bullet = line.match(/^[-•*]\s+(.*)$/)
        const numbered = line.match(/^\d+[.)]\s+(.*)$/)
        // Headings are rendered as bold lines; the model is told not to use them.
        const heading = line.match(/^#{1,6}\s+(.*)$/)

        if (bullet || numbered) {
            const type = bullet ? 'ul' : 'ol'
            if (!list || list.type !== type) {
                flush()
                list = { type, items: [] }
            }
            list.items.push((bullet || numbered)[1])
            return
        }

        flush()
        blocks.push({ type: heading ? 'h' : 'p', text: heading ? heading[1] : line, key: i })
    })
    flush()

    return blocks.map((b, i) => {
        if (b.type === 'ul' || b.type === 'ol') {
            const Tag = b.type
            return (
                <Tag key={`l-${i}`} className={`${b.type === 'ul' ? 'list-disc' : 'list-decimal'} space-y-1 pl-5 marker:text-emerald-500`}>
                    {b.items.map((item, j) => (
                        <li key={j} className="text-sm leading-relaxed">{renderInline(item, `l${i}-${j}`)}</li>
                    ))}
                </Tag>
            )
        }
        if (b.type === 'h') {
            return <p key={`h-${i}`} className="text-sm font-bold">{renderInline(b.text, `h${i}`)}</p>
        }
        return <p key={`p-${i}`} className="text-sm leading-relaxed">{renderInline(b.text, `p${i}`)}</p>
    })
}
