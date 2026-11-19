import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Avatar from '../components/Avatar'
import { FriendsIcon, SparkleIcon } from '../components/Icons'
import { activity, books, friends, getBook, getFriend, type Book } from '../data'
import { friendNewCount, loadNotes, loadProgress, unseenCount } from '../annotations'
import { useSettings } from '../settings'

const greetingFor = (h: number) => (h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening')

function BookCard({ book }: { book: Book }) {
  const partner = getFriend(book.coReaderId)
  const reading = book.shelf === 'reading'
  const percent = loadProgress(book.id)?.percent ?? book.mockProgress ?? 0
  const newNotes = unseenCount(book.id) ?? partner?.newAnnotations ?? 0

  return (
    <Link to={`/read/${book.id}`} className="book-card">
      <div className="book-cover">
        <img src={book.cover} alt={`${book.title} cover`} loading="lazy" />
        {reading && partner && newNotes > 0 && (
          <span className="badge" title={`${newNotes} new annotations from ${partner.name}`}>
            <SparkleIcon size={11} color="black" /> {newNotes}
          </span>
        )}
      </div>
      <div className="book-title">{book.title}</div>
      <div className="book-author">{book.author}</div>
      {reading ? (
        <>
          <div className="progress"><span style={{ width: `${Math.max(2, percent * 100)}%` }} /></div>
          <div className="progress-label">{Math.round(percent * 100)}% read · {loadNotes(book.id).length} of your notes</div>
          {partner && (
            <div className="co-reader">
              <Avatar friend={partner} size={20} showStatus={false} /> Reading with {partner.name.split(' ')[0]}
            </div>
          )}
        </>
      ) : (
        <>
          {partner && (
            <div className="co-reader">
              <Avatar friend={partner} size={20} showStatus={false} /> {partner.name.split(' ')[0]} is reading this
            </div>
          )}
          <span className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>Start reading</span>
        </>
      )}
    </Link>
  )
}

function Shelf({ title, items }: { title: string; items: Book[] }) {
  return (
    <section className="shelf-section">
      <h2 className="shelf-heading subheader">
        <SparkleIcon size={16} /> {title}
        <span className="count">{items.length} {items.length === 1 ? 'book' : 'books'}</span>
      </h2>
      <div className="shelf-row">
        {items.map((b) => <BookCard key={b.id} book={b} />)}
      </div>
    </section>
  )
}

function ContinueReading() {
  const last = books
    .map((b) => ({ b, p: loadProgress(b.id) }))
    .filter((x) => x.p?.at)
    .sort((a, b) => b.p!.at! - a.p!.at!)[0]
  if (!last) return null
  return (
    <Link to={`/read/${last.b.id}`} className="continue-card">
      <img src={last.b.cover} alt="" />
      <div>
        <div className="eyebrow">Pick up where you left off</div>
        <div className="continue-title">{last.b.title}</div>
        <div className="continue-meta">
          {last.p!.chapter ?? 'Saved spot'}
          {last.p!.percent != null && ` · ${Math.round(last.p!.percent * 100)}% read`}
        </div>
      </div>
      <span className="btn btn-primary btn-sm">Continue</span>
    </Link>
  )
}

function ActivityFeed() {
  return (
    <aside className="activity">
      <h2 className="shelf-heading subheader">
        <SparkleIcon size={16} /> From your book club
      </h2>
      <ul className="activity-list">
        {activity.map((a) => {
          const f = getFriend(a.friendId)!
          const b = getBook(a.bookId)
          return (
            <li key={a.id} className="activity-item">
              <Link to={`/friends/${f.id}`}><Avatar friend={f} size={34} /></Link>
              <div className="activity-body">
                <div>
                  <Link to={`/friends/${f.id}`} className="activity-name">{f.name.split(' ')[0]}</Link> {a.verb}{' '}
                  {b ? <Link to={`/read/${b.id}${a.quote ? '?panel=notes' : ''}`} className="activity-book">{b.title}</Link> : <em>{a.title}</em>}
                </div>
                {a.quote && <div className="activity-quote">"{a.quote}"</div>}
                <div className="activity-when">{a.when}</div>
              </div>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

export default function Home() {
  const { settings } = useSettings()
  const unread = friends.reduce((sum, f) => sum + friendNewCount(f), 0)
  const online = friends.filter((f) => f.status === 'online').length
  return (
    <>
      <Header />
      <main className="page">
        <div className="home-top">
          <Link to="/friends" className="friends-pill" title="Friends" aria-label="Friends">
            <FriendsIcon />
            <span>{online} friends online</span>
            {unread > 0 && <span className="badge">{unread}</span>}
          </Link>
          <span className="home-date subheader">{greetingFor(new Date().getHours())}</span>
        </div>
        <section className="greeting">
          <h1>Hello, {settings.name.trim() || 'Reader'}</h1>
          <p className="subheader">Ready to Dive In?</p>
        </section>
        <div className="home-grid">
          <div>
            <ContinueReading />
            <Shelf title="My Shelf" items={books.filter((b) => b.shelf === 'reading')} />
            <Shelf title="Recommended" items={books.filter((b) => b.shelf === 'recommended')} />
          </div>
          <ActivityFeed />
        </div>
      </main>
    </>
  )
}
