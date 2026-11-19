import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import Avatar from '../components/Avatar'
import { ChevronLeft, SparkleIcon } from '../components/Icons'
import { books, formatDuration, getBook, getFriend, type Book, type Friend } from '../data'
import { friendNewCount, getFriendIndex, isUnseen, loadSeen, type IndexedFriendMark } from '../annotations'

function SharedBook({ book, friend }: { book: Book; friend: Friend }) {
  const [index, setIndex] = useState<IndexedFriendMark[] | null>(null)
  const [failed, setFailed] = useState(false)
  const seen = loadSeen(book.id)

  useEffect(() => {
    let alive = true
    getFriendIndex(book.id, book.file)
      .then((idx) => alive && setIndex(idx))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [book])

  const unseen = index?.filter((m) => isUnseen(m, seen)) ?? []
  const preview = (unseen.length ? unseen : index ?? []).slice(0, 4)

  return (
    <section className="annotation-group">
      <div className="annotation-group-head">
        <img src={book.cover} alt="" />
        <div>
          <div className="book-title">{book.title}</div>
          <div className="book-author">
            {index ? `${index.length} notes from ${friend.name.split(' ')[0]} · ${unseen.length} new` : failed ? "Couldn't load notes" : 'Gathering notes...'}
          </div>
        </div>
        <Link to={`/read/${book.id}?panel=notes`} className="btn btn-secondary btn-sm">See all</Link>
      </div>
      <ul className="annotation-cards">
        {preview.map((m) => (
          <li key={m.key}>
            <Link to={`/read/${book.id}?note=friend:${m.key}`} className="annotation-card friend">
              <div className="note-item-head">
                <span className="chapter">{m.chapter ?? 'Untitled section'}</span>
                {isUnseen(m, seen) && <span className="badge mini"><SparkleIcon size={9} color="black" /> new</span>}
              </div>
              <div className="note-quote squiggle-quote">{m.text}</div>
              <div className="note-body">{m.comment}</div>
              <div className="activity-when">{m.when}</div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function FriendProfile() {
  const { friendId } = useParams()
  const friend = getFriend(friendId)
  if (!friend) return <Navigate to="/friends" replace />

  const shared = books.filter((b) => b.coReaderId === friend.id)
  const current = friend.reading
  const currentBook = getBook(current?.bookId)

  return (
    <>
      <Header />
      <main className="page">
        <Link to="/friends" className="back-link"><ChevronLeft /> All friends</Link>
        <section className="profile-card">
          <Avatar friend={friend} size={92} />
          <div className="profile-main">
            <h1>{friend.name}</h1>
            <div className="friend-handle">
              @{friend.handle} · <span className={`dot inline ${friend.status}`} /> {friend.lastSeen}
            </div>
            <p className="profile-bio">{friend.bio}</p>
            <div className="chips">
              {friend.favoriteGenres.map((g) => <span key={g} className="chip static">{g}</span>)}
            </div>
          </div>
          <div className="profile-side">
            {current ? (
              <div className="now-reading">
                <div className="eyebrow">Currently reading</div>
                <div className="friend-reading">
                  {currentBook ? <img src={currentBook.cover} alt="" /> : <span className="placeholder-cover" style={{ background: current.color }} />}
                  <span>
                    <div className="title">{current.title}</div>
                    <div className="time">for {formatDuration(current.minutes)}</div>
                  </span>
                </div>
                {currentBook && <Link to={`/read/${currentBook.id}`} className="btn btn-primary btn-sm">Read along</Link>}
              </div>
            ) : (
              <div className="now-reading"><div className="eyebrow">Between books</div></div>
            )}
          </div>
        </section>

        <div className="stat-row">
          <div className="stat"><div className="stat-value">{friend.booksRead}</div><div className="stat-label">Books read</div></div>
          <div className="stat"><div className="stat-value">{friendNewCount(friend)}</div><div className="stat-label">New notes for you</div></div>
          <div className="stat"><div className="stat-value">{shared.length}</div><div className="stat-label">Reading together</div></div>
          <div className="stat"><div className="stat-value small">{friend.joined}</div><div className="stat-label">Joined</div></div>
        </div>

        <h2 className="shelf-heading subheader"><SparkleIcon size={16} /> Notes {friend.name.split(' ')[0]} left for you</h2>
        {shared.length ? (
          shared.map((b) => <SharedBook key={b.id} book={b} friend={friend} />)
        ) : (
          <div className="empty-state">
            <img src="/brand/yellow_spark.svg" alt="" className="spark" />
            <h3>Nothing shared yet</h3>
            <p>You and {friend.name.split(' ')[0]} aren't reading the same book yet. Start one together?</p>
            <div className="chips center">
              {books.map((b) => <Link key={b.id} to={`/read/${b.id}`} className="btn btn-secondary btn-sm">{b.title}</Link>)}
            </div>
          </div>
        )}
      </main>
    </>
  )
}
