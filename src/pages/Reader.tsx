import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import ePub from 'epubjs'
import type { Book as EpubBook, Contents, Rendition } from 'epubjs'
import Header from '../components/Header'
import Avatar from '../components/Avatar'
import ReaderPanel, { type PanelTab, type TocItem } from '../components/ReaderPanel'
import { ChevronLeft, ChevronRight, HomeIcon, SparkleIcon } from '../components/Icons'
import { getBook, getFriend } from '../data'
import { PAPERS, TEXT_SIZES, useSettings } from '../settings'
import {
  applyFriendMarks,
  chapterLabel,
  getFriendIndex,
  isUnseen,
  loadNotes,
  loadProgress,
  loadReplies,
  loadSeen,
  saveNotes,
  saveProgress,
  saveReplies,
  saveSeen,
  stripScripts,
  type FriendMark,
  type IndexedFriendMark,
  type Reply,
  type UserNote,
} from '../annotations'

type Side = 'left' | 'right'
type Placement = { side: Side; top: number }
type OpenNote =
  | ({ kind: 'friend'; mark: FriendMark } & Placement)
  | ({ kind: 'mine'; noteId: string; editing: boolean } & Placement)
  | ({ kind: 'draft'; cfi: string; text: string } & Placement)
type Pending = { kind: 'friend'; key: string; tries: number } | { kind: 'mine'; id: string }
type LocationInfo = { left?: number; right?: number; chapter?: string; percent?: number }

const HIGHLIGHT_STYLE = { fill: '#fbb040', 'fill-opacity': '0.4', 'mix-blend-mode': 'multiply' }

const frameRect = (rect: DOMRect, win: Window | null) => {
  const f = (win?.frameElement as HTMLElement | null)?.getBoundingClientRect()
  return f ? new DOMRect(rect.left + f.left, rect.top + f.top, rect.width, rect.height) : rect
}

const firstName = (name?: string) => name?.split(' ')[0] ?? 'A friend'

export default function Reader() {
  const { bookId } = useParams()
  const [params, setParams] = useSearchParams()
  const book = getBook(bookId)
  const partner = getFriend(book?.coReaderId)
  const { settings } = useSettings()

  const viewerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const marginRefs = { left: useRef<HTMLDivElement>(null), right: useRef<HTMLDivElement>(null) }
  const renditionRef = useRef<Rendition | null>(null)
  const epubRef = useRef<EpubBook | null>(null)
  const activeSquiggle = useRef<HTMLElement | null>(null)
  const pending = useRef<Pending | null>(null)
  const showFriendsRef = useRef(settings.showFriendNotes)

  const [ready, setReady] = useState(false)
  const [loc, setLoc] = useState<LocationInfo>({})
  const [toc, setToc] = useState<TocItem[]>([])
  const [friendIndex, setFriendIndex] = useState<IndexedFriendMark[] | null>(null)
  const [notes, setNotes] = useState<UserNote[]>(() => (book ? loadNotes(book.id) : []))
  const [replies, setReplies] = useState<Record<string, Reply[]>>(() => (book ? loadReplies(book.id) : {}))
  const [seen, setSeen] = useState<Set<string>>(() => (book ? loadSeen(book.id) : new Set()))
  const [open, setOpen] = useState<OpenNote | null>(null)
  const [panel, setPanel] = useState<PanelTab | null>(null)
  const [draft, setDraft] = useState('')
  const [reply, setReply] = useState('')

  const place = useCallback((rect: DOMRect): Placement => {
    const frame = frameRef.current!.getBoundingClientRect()
    const side: Side = rect.left + rect.width / 2 < frame.left + frame.width / 2 ? 'left' : 'right'
    const margin = marginRefs[side].current!.getBoundingClientRect()
    const top = Math.max(0, Math.min(rect.top - margin.top - 14, margin.height - 260))
    return { side, top }
  }, [])

  const clearSquiggle = () => {
    activeSquiggle.current?.classList.remove('active')
    activeSquiggle.current = null
  }

  const allContents = () => (renditionRef.current?.getContents() as unknown as Contents[]) ?? []
  const clearSelection = () => allContents().forEach((c) => c.window.getSelection()?.removeAllRanges())

  const close = useCallback(() => {
    clearSquiggle()
    setOpen(null)
  }, [])

  const markSeen = useCallback((key: string) => {
    setSeen((s) => (s.has(key) ? s : new Set(s).add(key)))
  }, [])

  const openFriendNote = useCallback(
    (el: HTMLElement, mark: FriendMark, win: Window | null) => {
      clearSquiggle()
      el.classList.add('active')
      activeSquiggle.current = el
      setReply('')
      markSeen(mark.key)
      setOpen({ kind: 'friend', mark, ...place(frameRect(el.getBoundingClientRect(), win)) })
    },
    [place, markSeen],
  )

  const addHighlight = useCallback(
    (n: UserNote) => {
      renditionRef.current?.annotations.highlight(
        n.cfi,
        { id: n.id },
        (e: MouseEvent) => {
          clearSquiggle()
          setOpen({ kind: 'mine', noteId: n.id, editing: false, ...place((e.target as Element).getBoundingClientRect()) })
        },
        'amity-hl',
        HIGHLIGHT_STYLE,
      )
    },
    [place],
  )

  const resolvePending = useCallback(() => {
    const p = pending.current
    const rendition = renditionRef.current
    if (!p || !rendition) return
    const frame = frameRef.current!.getBoundingClientRect()
    const visible = (r: DOMRect) => r.width > 0 && r.left + r.width / 2 > frame.left && r.left + r.width / 2 < frame.right

    if (p.kind === 'mine') {
      pending.current = null
      const n = notes.find((x) => x.id === p.id)
      const range = n && (rendition.getRange(n.cfi) as Range | null)
      if (!n || !range) return
      const rect = frameRect(range.getBoundingClientRect(), range.startContainer.ownerDocument?.defaultView ?? null)
      setOpen({ kind: 'mine', noteId: n.id, editing: false, ...place(rect) })
      return
    }

    for (const c of allContents()) {
      const el = c.document.querySelector<HTMLElement>(`[data-amity-mark="${p.key}"]`)
      if (!el) continue
      const rect = frameRect(el.getBoundingClientRect(), c.window)
      if (visible(rect) || p.tries > 2) {
        pending.current = null
        const mark = friendIndex?.find((m) => m.key === p.key)
        if (mark) openFriendNote(el, mark, c.window)
      } else {
        pending.current = { ...p, tries: p.tries + 1 }
        const range = c.document.createRange()
        range.selectNodeContents(el)
        rendition.display(c.cfiFromRange(range)).then(() => setTimeout(() => resolveRef.current(), 60))
      }
      return
    }
    pending.current = null
  }, [notes, friendIndex, place, openFriendNote])

  const resolveRef = useRef(resolvePending)
  resolveRef.current = resolvePending

  const goToFriendNote = useCallback((m: IndexedFriendMark) => {
    setPanel(null)
    pending.current = { kind: 'friend', key: m.key, tries: 0 }
    renditionRef.current?.display(m.href).then(() => setTimeout(() => resolveRef.current(), 60))
  }, [])

  const goToMyNote = useCallback((n: UserNote) => {
    setPanel(null)
    pending.current = { kind: 'mine', id: n.id }
    renditionRef.current?.display(n.cfi).then(() => setTimeout(() => resolveRef.current(), 60))
  }, [])

  useEffect(() => {
    if (!book || !viewerRef.current) return
    const epub = ePub(book.file)
    epubRef.current = epub
    stripScripts(epub)
    const rendition = epub.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      spread: 'always',
      minSpreadWidth: 0,
      flow: 'paginated',
      allowScriptedContent: false,
    })
    renditionRef.current = rendition
    rendition.themes.register('amity', '/reader.css')
    rendition.themes.select('amity')
    rendition.themes.fontSize(TEXT_SIZES[settings.textSize])

    rendition.hooks.content.register((contents: Contents) => {
      contents.document.body?.classList.toggle('amity-hide-friends', !showFriendsRef.current)
      applyFriendMarks(contents.document, book.id, contents.sectionIndex, (el, mark) => {
        if (showFriendsRef.current) openFriendNote(el, mark, contents.window)
      })
    })

    loadNotes(book.id).forEach(addHighlight)

    rendition.on('selected', (cfi: string, contents: Contents) => {
      const sel = contents.window.getSelection()
      const text = sel?.toString().trim()
      if (!sel || !text || sel.rangeCount === 0) return
      clearSquiggle()
      setDraft('')
      setOpen({ kind: 'draft', cfi, text, ...place(frameRect(sel.getRangeAt(0).getBoundingClientRect(), contents.window)) })
    })

    rendition.on('click', () => {
      setOpen((o) => (o?.kind === 'friend' ? null : o))
      clearSquiggle()
    })

    rendition.on('relocated', (l: any) => {
      const hasLocations = epub.locations.length() > 0
      const chapter = chapterLabel(epub, l.start.href)
      setLoc({
        left: l.start.displayed.page,
        right: l.end.displayed.page,
        chapter,
        percent: hasLocations ? l.start.percentage : undefined,
      })
      saveProgress(book.id, { cfi: l.start.cfi, percent: hasLocations ? l.start.percentage : undefined, chapter })
      if (pending.current) return
      setOpen(null)
      clearSquiggle()
    })

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'TEXTAREA' || tag === 'INPUT' || document.querySelector('.modal')) return
      if (e.key === 'ArrowLeft') rendition.prev()
      if (e.key === 'ArrowRight') rendition.next()
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    rendition.on('keyup', onKey)

    epub.loaded.navigation.then((nav) => {
      const map = (items: any[]): TocItem[] => items.map((i) => ({ label: i.label.trim(), href: i.href, subitems: map(i.subitems ?? []) }))
      setToc(map(nav.toc))
    })

    rendition.display(loadProgress(book.id)?.cfi).then(() => setReady(true))
    epub.ready
      .then(() => epub.locations.generate(1200))
      .then(() => {
        const current = rendition.currentLocation() as any
        if (current?.start) setLoc((s) => ({ ...s, percent: epub.locations.percentageFromCfi(current.start.cfi) }))
        return getFriendIndex(book.id, book.file, epub)
      })
      .then((idx) => epubRef.current === epub && setFriendIndex(idx))
      .catch(() => {})

    return () => {
      window.removeEventListener('keydown', onKey)
      rendition.destroy()
      epub.destroy()
      renditionRef.current = null
      epubRef.current = null
    }
    // Settings are applied by their own effects below; only re-create the rendition when the book changes.
  }, [book, addHighlight, place, openFriendNote, close])

  useEffect(() => {
    renditionRef.current?.themes.fontSize(TEXT_SIZES[settings.textSize])
  }, [settings.textSize])

  useEffect(() => {
    showFriendsRef.current = settings.showFriendNotes
    allContents().forEach((c) => c.document.body?.classList.toggle('amity-hide-friends', !settings.showFriendNotes))
    if (!settings.showFriendNotes) setOpen((o) => (o?.kind === 'friend' ? null : o))
  }, [settings.showFriendNotes])

  useEffect(() => {
    if (book) saveNotes(book.id, notes)
  }, [book, notes])
  useEffect(() => {
    if (book) saveReplies(book.id, replies)
  }, [book, replies])
  useEffect(() => {
    if (book) saveSeen(book.id, seen)
  }, [book, seen])

  // Deep links: ?panel=notes, ?note=friend:<key>, ?note=mine:<id>
  useEffect(() => {
    if (!ready) return
    const target = params.get('note')
    const panelParam = params.get('panel')
    if (panelParam === 'notes' || panelParam === 'contents') {
      setPanel(panelParam)
      setParams({}, { replace: true })
    } else if (target?.startsWith('mine:')) {
      const n = notes.find((x) => x.id === target.slice(5))
      if (n) goToMyNote(n)
      setParams({}, { replace: true })
    } else if (target?.startsWith('friend:') && friendIndex) {
      const m = friendIndex.find((x) => x.key === target.slice(7))
      if (m) goToFriendNote(m)
      setParams({}, { replace: true })
    }
  }, [ready, friendIndex, params, setParams, notes, goToMyNote, goToFriendNote])

  if (!book) return <Navigate to="/" replace />

  const saveDraft = () => {
    if (open?.kind !== 'draft' || !draft.trim()) return
    const n: UserNote = { id: crypto.randomUUID(), cfi: open.cfi, text: open.text, comment: draft.trim(), createdAt: Date.now() }
    setNotes((prev) => [...prev, n])
    addHighlight(n)
    clearSelection()
    setOpen({ kind: 'mine', noteId: n.id, editing: false, side: open.side, top: open.top })
  }

  const sendReply = (key: string) => {
    if (!reply.trim()) return
    setReplies((r) => ({ ...r, [key]: [...(r[key] ?? []), { text: reply.trim(), at: Date.now() }] }))
    setReply('')
  }

  const updateNote = (id: string, comment: string) => setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, comment } : n)))

  const deleteNote = (n: UserNote) => {
    if (!confirm('Delete this annotation?')) return
    renditionRef.current?.annotations.remove(n.cfi, 'highlight')
    setNotes((prev) => prev.filter((x) => x.id !== n.id))
    setOpen(null)
  }

  const unseen = friendIndex?.filter((m) => isUnseen(m, seen)).length ?? 0

  const renderNote = (side: Side) => {
    if (!open || open.side !== side) return null
    const style = { top: open.top }
    const cls = `margin-note side-${side}`

    if (open.kind === 'friend' && partner) {
      const thread = replies[open.mark.key] ?? []
      return (
        <div className={`${cls} friend`} style={style}>
          <button className="note-close" onClick={close} aria-label="Close">×</button>
          <div className="note-head">
            <Avatar friend={partner} size={26} showStatus={false} />
            <Link to={`/friends/${partner.id}`} className="who">{firstName(partner.name)}</Link>
            <span className="when">{open.mark.when}</span>
          </div>
          <p className="note-quote">{open.mark.text}</p>
          <div className="note-body">{open.mark.comment}</div>
          {thread.length > 0 && (
            <ul className="thread">
              {thread.map((r, i) => (
                <li key={i}>
                  <span className="who-small">{settings.name}</span> {r.text}
                </li>
              ))}
            </ul>
          )}
          <div className="reply-row">
            <input
              className="text-input sm"
              placeholder={`Reply to ${firstName(partner.name)}...`}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendReply(open.mark.key)}
            />
            <button className="btn btn-primary btn-sm" disabled={!reply.trim()} onClick={() => sendReply(open.mark.key)}>Send</button>
          </div>
        </div>
      )
    }

    if (open.kind === 'draft')
      return (
        <div className={cls} style={style}>
          <button className="note-close" onClick={() => { clearSelection(); close() }} aria-label="Close">×</button>
          <div className="note-head">
            <SparkleIcon size={14} />
            <span className="who">New annotation</span>
          </div>
          <p className="note-quote">{open.text}</p>
          <textarea
            autoFocus
            placeholder="What do you think about this passage?"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveDraft() }}
          />
          <span className="hint note-hint">Ctrl+Enter to save</span>
          <div className="note-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => { clearSelection(); close() }}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={saveDraft} disabled={!draft.trim()}>Save note</button>
          </div>
        </div>
      )

    if (open.kind !== 'mine') return null
    const n = notes.find((x) => x.id === open.noteId)
    if (!n) return null
    return (
      <div className={cls} style={style}>
        <button className="note-close" onClick={close} aria-label="Close">×</button>
        <div className="note-head">
          <SparkleIcon size={14} color="black" />
          <span className="who">You</span>
          <span className="when">{new Date(n.createdAt).toLocaleDateString()}</span>
        </div>
        <p className="note-quote">{n.text}</p>
        {open.editing ? (
          <>
            <textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} />
            <div className="note-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setOpen({ ...open, editing: false })}>Cancel</button>
              <button
                className="btn btn-primary btn-sm"
                disabled={!draft.trim()}
                onClick={() => { updateNote(n.id, draft.trim()); setOpen({ ...open, editing: false }) }}
              >
                Save
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="note-body">{n.comment}</div>
            <div className="note-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => deleteNote(n)}>Delete</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { setDraft(n.comment); setOpen({ ...open, editing: true }) }}>Edit</button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="reader-page">
      <Header />
      <div className="reader-stage">
        <div className="margin" ref={marginRefs.left}>
          {partner && (
            <Link to={`/friends/${partner.id}`} className="co-reader-card">
              <Avatar friend={partner} size={38} />
              <div>
                <div>Reading with</div>
                <div className="name">{partner.name}</div>
                <div className="legend">
                  <span className="squig">their notes</span>
                  <span className="hl">yours</span>
                </div>
              </div>
            </Link>
          )}
          <p className="reader-tip">
            Select any text to leave an annotation. Tap a squiggle to read {firstName(partner?.name)}'s note.
            {!settings.showFriendNotes && <><br /><strong>Friends' notes are hidden</strong> (see Settings).</>}
          </p>
          {panel && (
            <ReaderPanel
              tab={panel}
              onTab={setPanel}
              onClose={() => setPanel(null)}
              toc={toc}
              currentChapter={loc.chapter}
              onChapter={(href) => { setPanel(null); renditionRef.current?.display(href) }}
              partner={partner}
              friendIndex={friendIndex}
              seen={seen}
              replies={replies}
              notes={notes}
              onFriendNote={goToFriendNote}
              onMyNote={goToMyNote}
            />
          )}
          {renderNote('left')}
        </div>
        <button className="nav-arrow" onClick={() => renditionRef.current?.prev()} aria-label="Previous page">
          <ChevronLeft />
        </button>
        <div className="book-frame" ref={frameRef} style={{ background: PAPERS[settings.paper] }}>
          <div className="page-header">
            <span>{book.title}</span>
            <span>{loc.chapter ?? book.author}</span>
          </div>
          <div className="book-viewer" ref={viewerRef} />
          {!ready && <div className="loading">Opening {book.title}...</div>}
          {loc.left != null && <span className="page-num left">{loc.left}</span>}
          {loc.right != null && loc.right !== loc.left && <span className="page-num right">{loc.right}</span>}
        </div>
        <button className="nav-arrow" onClick={() => renditionRef.current?.next()} aria-label="Next page">
          <ChevronRight />
        </button>
        <div className="margin" ref={marginRefs.right}>
          {renderNote('right')}
        </div>
      </div>
      <footer className="reader-footer">
        <div className="footer-side left">
          <button className={`btn btn-secondary btn-sm ${panel === 'contents' ? 'pressed' : ''}`} onClick={() => setPanel(panel === 'contents' ? null : 'contents')}>
            Contents
          </button>
          <button className={`btn btn-secondary btn-sm ${panel === 'notes' ? 'pressed' : ''}`} onClick={() => setPanel(panel === 'notes' ? null : 'notes')}>
            Notes
            {unseen > 0 && <span className="badge mini"><SparkleIcon size={9} color="black" /> {unseen}</span>}
          </button>
        </div>
        <Link to="/" className="icon-btn on-cream" aria-label="Home" title="Back to your shelf">
          <HomeIcon />
        </Link>
        <div className="footer-side right">
          <span className="overall">{loc.percent != null ? `${Math.round(loc.percent * 100)}% read` : 'Measuring book...'}</span>
          <div className="progress footer-progress"><span style={{ width: `${(loc.percent ?? 0) * 100}%` }} /></div>
        </div>
      </footer>
    </div>
  )
}
