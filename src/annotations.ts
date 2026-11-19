import ePub from 'epubjs'
import type { Book } from 'epubjs'
import './epubFixes'
import { books, commentPool, getBook, getFriend, type Friend } from './data'

export type UserNote = {
  id: string
  cfi: string
  text: string
  comment: string
  createdAt: number
}

export type Progress = { cfi: string; percent?: number; chapter?: string; at?: number }

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export const loadNotes = (bookId: string) => read<UserNote[]>(`amity:notes:${bookId}`, [])
export const saveNotes = (bookId: string, notes: UserNote[]) => localStorage.setItem(`amity:notes:${bookId}`, JSON.stringify(notes))
export const loadProgress = (bookId: string) => read<Progress | null>(`amity:progress:${bookId}`, null)
export const saveProgress = (bookId: string, p: Progress) => {
  const prev = loadProgress(bookId)
  localStorage.setItem(`amity:progress:${bookId}`, JSON.stringify({ ...p, percent: p.percent ?? prev?.percent, at: Date.now() }))
}

const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const whenLabels = ['2 days ago', 'yesterday', '5h ago', 'last week', '3 days ago', 'this morning', '1h ago']

export type FriendMark = { key: string; sectionIndex: number; comment: string; when: string; text: string }

const firstTextNode = (el: Element) => {
  const walker = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if ((n.textContent ?? '').trim().length >= 30) return n as Text
  return null
}

const sentenceRange = (node: Text) => {
  const text = node.textContent ?? ''
  const start = text.length - text.trimStart().length
  const match = /[.!?…]["”’)]?(\s|$)/g
  match.lastIndex = start + 20
  const m = match.exec(text)
  let end = m ? m.index + m[0].trimEnd().length : text.length
  if (end - start > 180) end = text.lastIndexOf(' ', start + 160) || start + 160
  const range = node.ownerDocument.createRange()
  range.setStart(node, start)
  range.setEnd(node, end)
  return range
}

/**
 * Deterministically picks a few passages in a section and wraps them in a
 * squiggly-underlined span so they look like the co-reader's annotations.
 */
export function applyFriendMarks(doc: Document, bookId: string, sectionIndex: number, onClick?: (el: HTMLElement, mark: FriendMark) => void) {
  const marks: FriendMark[] = []
  const body = doc.querySelector('body')
  if (!body || body.hasAttribute('data-amity-marked')) return marks
  body.setAttribute('data-amity-marked', 'true')
  if (sectionIndex < 1) return marks

  const rand = rng(hash(`${bookId}:${sectionIndex}`))
  const candidates = Array.from(body.querySelectorAll('p')).filter((p) => (p.textContent ?? '').trim().length >= 80)
  if (candidates.length < 3) return marks

  const roll = rand()
  const count = candidates.length >= 60 && roll < 0.3 ? 2 : roll < 0.75 ? 1 : 0
  if (count === 0) return marks
  const pool = commentPool(bookId)
  const step = candidates.length / count

  for (let i = 0; i < count; i++) {
    const p = candidates[Math.min(candidates.length - 1, Math.floor(i * step + rand() * step))]
    const mark: FriendMark = {
      key: `${sectionIndex}:${i}`,
      sectionIndex,
      comment: pool[hash(`${bookId}:${sectionIndex}:${i}`) % pool.length],
      when: whenLabels[Math.floor(rand() * whenLabels.length)],
      text: '',
    }

    let target: HTMLElement | null = null
    const koboSpans = Array.from(p.querySelectorAll<HTMLElement>('span.koboSpan')).filter((s) => {
      const len = (s.textContent ?? '').trim().length
      return len >= 25 && len <= 240
    })
    if (koboSpans.length) {
      target = koboSpans[Math.floor(rand() * koboSpans.length)]
      target.classList.add('amity-squiggle')
    } else {
      const node = firstTextNode(p)
      if (!node) continue
      target = doc.createElement('span')
      target.className = 'amity-squiggle'
      sentenceRange(node).surroundContents(target)
    }

    mark.text = (target.textContent ?? '').trim()
    target.setAttribute('data-amity-mark', mark.key)
    marks.push(mark)
    const el = target
    if (onClick)
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onClick(el, mark)
      })
  }
  return marks
}

export type IndexedFriendMark = FriendMark & { chapter?: string; href: string; isNew?: boolean }

export const isUnseen = (m: IndexedFriendMark, seen: Set<string>) => !!m.isNew && !seen.has(m.key)

const INDEX_VERSION = 2
const indexCache = new Map<string, Promise<IndexedFriendMark[]>>()

const flatToc = (items: any[]): any[] => items.flatMap((i) => [i, ...flatToc(i.subitems ?? [])])
export const chapterLabel = (epub: Book, href: string) => {
  const base = href.split('#')[0]
  return flatToc(epub.navigation?.toc ?? [])
    .find((t) => {
      const h = t.href.split('#')[0]
      return h.endsWith(base) || base.endsWith(h)
    })
    ?.label?.trim() as string | undefined
}

export const stripScripts = (epub: Book) =>
  (epub.spine as any).hooks.content.register((doc: Document) => doc.querySelectorAll('script').forEach((s) => s.remove()))

/** Every co-reader note in a book, in reading order. Uses an already-open book if given. */
export function getFriendIndex(bookId: string, file: string, openBook?: Book): Promise<IndexedFriendMark[]> {
  const storageKey = `amity:friendIndex:v${INDEX_VERSION}:${bookId}`
  const stored = read<IndexedFriendMark[] | null>(storageKey, null)
  if (stored) return Promise.resolve(stored)
  if (indexCache.has(bookId)) return indexCache.get(bookId)!

  const job = (async () => {
    const epub = openBook ?? ePub(file)
    if (!openBook) stripScripts(epub)
    await epub.ready
    const out: IndexedFriendMark[] = []
    const sections: any[] = []
    epub.spine.each((s: any) => sections.push(s))
    for (const section of sections) {
      if (section.linear === 'no') continue
      await section.load(epub.load.bind(epub))
      const copy = (section.document as Document).cloneNode(true) as Document
      const chapter = chapterLabel(epub, section.href)
      for (const m of applyFriendMarks(copy, bookId, section.index)) out.push({ ...m, chapter, href: section.href })
      if (!openBook) section.unload()
    }
    if (!openBook) epub.destroy()
    // Spread the friend's "new since your last visit" notes evenly through the book.
    const newCount = Math.min(out.length, getFriend(getBook(bookId)?.coReaderId)?.newAnnotations ?? 0)
    for (let i = 0; i < newCount; i++) out[Math.floor(((i + 0.5) * out.length) / newCount)].isNew = true
    localStorage.setItem(storageKey, JSON.stringify(out))
    return out
  })()
  indexCache.set(bookId, job)
  job.catch(() => indexCache.delete(bookId))
  return job
}

export type Reply = { text: string; at: number }
export const loadReplies = (bookId: string) => read<Record<string, Reply[]>>(`amity:replies:${bookId}`, {})
export const saveReplies = (bookId: string, r: Record<string, Reply[]>) => localStorage.setItem(`amity:replies:${bookId}`, JSON.stringify(r))
export const loadSeen = (bookId: string) => new Set(read<string[]>(`amity:seen:${bookId}`, []))
export const saveSeen = (bookId: string, s: Set<string>) => localStorage.setItem(`amity:seen:${bookId}`, JSON.stringify([...s]))

/** New notes a friend has left you: live counts for shared books once indexed, mock count otherwise. */
export const friendNewCount = (friend: Friend) => {
  const shared = books.filter((b) => b.coReaderId === friend.id)
  if (!shared.length) return friend.newAnnotations
  return shared.reduce((sum, b) => sum + (unseenCount(b.id) ?? friend.newAnnotations), 0)
}

/** Unread co-reader notes if the book's index has been built, otherwise undefined. */
export const unseenCount = (bookId: string) => {
  const idx = read<IndexedFriendMark[] | null>(`amity:friendIndex:v${INDEX_VERSION}:${bookId}`, null)
  if (!idx) return undefined
  const seen = loadSeen(bookId)
  return idx.filter((m) => isUnseen(m, seen)).length
}
