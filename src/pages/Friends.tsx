import { asset } from '../asset'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Avatar from '../components/Avatar'
import { SparkleIcon } from '../components/Icons'
import { formatDuration, friends, getBook, type Friend } from '../data'
import { friendNewCount } from '../annotations'

const order = { online: 0, idle: 1, offline: 2 }

function Reading({ friend }: { friend: Friend }) {
  const r = friend.reading
  if (!r) return <span style={{ opacity: 0.5 }}>-</span>
  const book = getBook(r.bookId)
  const content = (
    <>
      {book ? <img src={book.cover} alt="" /> : <span className="placeholder-cover" style={{ background: r.color }} />}
      <span>
        <div className="title">{r.title}</div>
        <div className="time">{friend.status === 'offline' ? 'Read' : 'Reading'} for {formatDuration(r.minutes)}</div>
      </span>
    </>
  )
  return book ? (
    <Link to={`/read/${book.id}`} className="friend-reading" title={`Open ${book.title}`}>{content}</Link>
  ) : (
    <div className="friend-reading">{content}</div>
  )
}

export default function Friends() {
  const [tab, setTab] = useState<'online' | 'all'>('all')
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const list = friends
    .filter((f) => tab === 'all' || f.status !== 'offline')
    .filter((f) => !q || f.name.toLowerCase().includes(q) || f.handle.toLowerCase().includes(q))
    .sort((a, b) => order[a.status] - order[b.status] || friendNewCount(b) - friendNewCount(a))
  const onlineCount = friends.filter((f) => f.status !== 'offline').length

  return (
    <>
      <Header />
      <main className="page">
        <div className="friends-shell">
          <div className="friends-toolbar">
            <h1><SparkleIcon size={18} /> My Friends</h1>
            <button className={`tab ${tab === 'online' ? 'active' : ''}`} onClick={() => setTab('online')}>Online · {onlineCount}</button>
            <button className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>All · {friends.length}</button>
            <input className="search" placeholder="Search friends" value={query} onChange={(e) => setQuery(e.target.value)} />
            <Link to="/" className="btn btn-secondary btn-sm">Back to shelf</Link>
          </div>

          <div className="friends-grid friends-head">
            <span>Username</span>
            <span>Active</span>
            <span>New annotations</span>
            <span>Currently reading</span>
          </div>

          {list.map((f) => (
            <div key={f.id} className="friends-grid friend-row">
              <Link to={`/friends/${f.id}`} className="friend-id">
                <Avatar friend={f} size={42} />
                <div style={{ minWidth: 0 }}>
                  <div className="friend-name">{f.name}</div>
                  <div className="friend-handle">@{f.handle}</div>
                </div>
              </Link>
              <div className="friend-active">
                <span className={`dot ${f.status}`} /> {f.lastSeen}
              </div>
              <div>
                {friendNewCount(f) > 0 ? (
                  <span className="badge"><SparkleIcon size={11} color="black" /> {friendNewCount(f)} new</span>
                ) : (
                  <span style={{ opacity: 0.5, fontSize: 13 }}>All caught up</span>
                )}
              </div>
              <Reading friend={f} />
            </div>
          ))}
          {list.length === 0 && (
            <div className="empty">
              <img src={asset('/brand/yellow_spark.svg')} alt="" className="empty-art spark" />
              {q ? `No friends match "${query}".` : 'Nobody is online right now.'}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
