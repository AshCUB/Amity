import { asset } from '../asset'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import { SparkleIcon } from '../components/Icons'
import { books, friends } from '../data'
import { loadNotes, loadProgress, loadReplies, loadSeen } from '../annotations'
import { useSettings } from '../settings'

export default function Profile() {
  const { settings, setOpen } = useSettings()
  const name = settings.name.trim() || 'Reader'
  const initials = name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase()

  const perBook = books.map((b) => ({
    book: b,
    notes: loadNotes(b.id).sort((x, y) => y.createdAt - x.createdAt),
    replies: Object.values(loadReplies(b.id)).reduce((s, r) => s + r.length, 0),
    seen: loadSeen(b.id).size,
    percent: loadProgress(b.id)?.percent,
  }))
  const totalNotes = perBook.reduce((s, x) => s + x.notes.length, 0)
  const stats = [
    { label: 'On your shelf', value: books.filter((b) => b.shelf === 'reading').length },
    { label: 'Notes written', value: totalNotes },
    { label: 'Replies sent', value: perBook.reduce((s, x) => s + x.replies, 0) },
    { label: "Friends' notes read", value: perBook.reduce((s, x) => s + x.seen, 0) },
    { label: 'Friends', value: friends.length },
  ]

  return (
    <>
      <Header />
      <main className="page">
        <section className="profile-card">
          <span className="avatar" style={{ width: 92, height: 92, background: 'var(--purple)', fontSize: 36 }}>{initials}</span>
          <div className="profile-main">
            <h1>{name}</h1>
            <div className="friend-handle">@you · Member since today</div>
            <p className="profile-bio">A reader in good company.</p>
            <button className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}>Edit profile & settings</button>
          </div>
        </section>

        <div className="stat-row">
          {stats.map((s) => (
            <div key={s.label} className="stat">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <h2 className="shelf-heading subheader"><SparkleIcon size={16} /> Your annotations</h2>
        {totalNotes === 0 ? (
          <div className="empty-state">
            <img src={asset('/brand/yellow_spark.svg')} alt="" className="spark" />
            <h3>No annotations yet</h3>
            <p>Open a book and select any passage to leave your first note.</p>
            <Link to="/read/alice" className="btn btn-primary">Start annotating</Link>
          </div>
        ) : (
          perBook
            .filter((x) => x.notes.length)
            .map(({ book, notes }) => (
              <section key={book.id} className="annotation-group">
                <div className="annotation-group-head">
                  <img src={book.cover} alt="" />
                  <div>
                    <div className="book-title">{book.title}</div>
                    <div className="book-author">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</div>
                  </div>
                  <Link to={`/read/${book.id}`} className="btn btn-secondary btn-sm">Open book</Link>
                </div>
                <ul className="annotation-cards">
                  {notes.map((n) => (
                    <li key={n.id}>
                      <Link to={`/read/${book.id}?note=mine:${n.id}`} className="annotation-card">
                        <div className="note-quote">{n.text}</div>
                        <div className="note-body">{n.comment}</div>
                        <div className="activity-when">{new Date(n.createdAt).toLocaleString()}</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))
        )}
      </main>
    </>
  )
}
