import { asset } from '../asset'
import { useState } from 'react'
import Avatar from './Avatar'
import { SparkleIcon } from './Icons'
import type { Friend } from '../data'
import { isUnseen, type IndexedFriendMark, type Reply, type UserNote } from '../annotations'

export type PanelTab = 'contents' | 'notes'
export type TocItem = { label: string; href: string; subitems: TocItem[] }

type Props = {
  tab: PanelTab
  onTab: (t: PanelTab) => void
  onClose: () => void
  toc: TocItem[]
  currentChapter?: string
  onChapter: (href: string) => void
  partner?: Friend
  friendIndex: IndexedFriendMark[] | null
  seen: Set<string>
  replies: Record<string, Reply[]>
  notes: UserNote[]
  onFriendNote: (m: IndexedFriendMark) => void
  onMyNote: (n: UserNote) => void
}

type Filter = 'all' | 'mine' | 'friend' | 'new'

const spineIndexOf = (cfi: string) => {
  const m = /epubcfi\(\/6\/(\d+)/.exec(cfi)
  return m ? Number(m[1]) / 2 - 1 : 0
}

export default function ReaderPanel(p: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const first = p.partner?.name.split(' ')[0] ?? 'Friend'

  type Entry = { kind: 'friend'; m: IndexedFriendMark; order: number } | { kind: 'mine'; n: UserNote; order: number }
  const entries: Entry[] = [
    ...(filter === 'mine' ? [] : (p.friendIndex ?? []).filter((m) => filter !== 'new' || isUnseen(m, p.seen)).map((m) => ({ kind: 'friend' as const, m, order: m.sectionIndex }))),
    ...(filter === 'friend' || filter === 'new' ? [] : p.notes.map((n) => ({ kind: 'mine' as const, n, order: spineIndexOf(n.cfi) + 0.5 }))),
  ].sort((a, b) => a.order - b.order)

  const renderToc = (items: TocItem[], depth = 0) =>
    items.map((t) => (
      <li key={t.href + t.label}>
        <button className={`toc-item ${t.label === p.currentChapter ? 'current' : ''}`} style={{ paddingLeft: 12 + depth * 14 }} onClick={() => p.onChapter(t.href)}>
          {t.label === p.currentChapter && <SparkleIcon size={10} />} {t.label}
        </button>
        {t.subitems.length > 0 && <ul>{renderToc(t.subitems, depth + 1)}</ul>}
      </li>
    ))

  return (
    <aside className="reader-panel" aria-label="Book panel">
      <div className="panel-tabs">
        <button className={`tab ${p.tab === 'contents' ? 'active' : ''}`} onClick={() => p.onTab('contents')}>Contents</button>
        <button className={`tab ${p.tab === 'notes' ? 'active' : ''}`} onClick={() => p.onTab('notes')}>Notes</button>
        <button className="note-close static" onClick={p.onClose} aria-label="Close panel">×</button>
      </div>

      {p.tab === 'contents' ? (
        <ul className="toc">{p.toc.length ? renderToc(p.toc) : <li className="panel-empty">No table of contents.</li>}</ul>
      ) : (
        <>
          <div className="chips">
            {(['all', 'new', 'friend', 'mine'] as Filter[]).map((f) => (
              <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f === 'new' ? 'New' : f === 'friend' ? first : 'Yours'}
              </button>
            ))}
          </div>
          {!p.friendIndex && filter !== 'mine' && <div className="panel-empty">Gathering {first}'s notes...</div>}
          <ul className="note-list">
            {entries.map((e) =>
              e.kind === 'friend' ? (
                <li key={e.m.key}>
                  <button className="note-item" onClick={() => p.onFriendNote(e.m)}>
                    <div className="note-item-head">
                      {p.partner && <Avatar friend={p.partner} size={18} showStatus={false} />}
                      <span className="chapter">{e.m.chapter ?? 'Untitled section'}</span>
                      {isUnseen(e.m, p.seen) && <span className="badge mini"><SparkleIcon size={9} color="black" /> new</span>}
                    </div>
                    <div className="quote squig">{e.m.text}</div>
                    <div className="comment">{e.m.comment}</div>
                    {(p.replies[e.m.key]?.length ?? 0) > 0 && <div className="meta">{p.replies[e.m.key].length} repl{p.replies[e.m.key].length === 1 ? 'y' : 'ies'}</div>}
                  </button>
                </li>
              ) : (
                <li key={e.n.id}>
                  <button className="note-item mine" onClick={() => p.onMyNote(e.n)}>
                    <div className="note-item-head">
                      <SparkleIcon size={12} color="black" />
                      <span className="chapter">You · {new Date(e.n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="quote hl">{e.n.text}</div>
                    <div className="comment">{e.n.comment}</div>
                  </button>
                </li>
              ),
            )}
          </ul>
          {entries.length === 0 && (p.friendIndex || filter === 'mine') && (
            <div className="panel-empty">
              <img src={asset('/brand/yellow_spark.svg')} alt="" className="empty-art spark" />
              {filter === 'mine' ? 'Select some text in the book to leave your first note.' : filter === 'new' ? "You're all caught up!" : 'No notes yet.'}
            </div>
          )}
        </>
      )}
    </aside>
  )
}
