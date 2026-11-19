export type Book = {
  id: string
  title: string
  author: string
  file: string
  cover: string
  shelf: 'reading' | 'recommended'
  coReaderId?: string
  mockProgress?: number
}

export type FriendStatus = 'online' | 'idle' | 'offline'

export type Friend = {
  id: string
  name: string
  handle: string
  bio: string
  joined: string
  booksRead: number
  favoriteGenres: string[]
  color: string
  status: FriendStatus
  lastSeen: string
  newAnnotations: number
  reading?: { bookId?: string; title: string; minutes: number; color?: string }
}

export const books: Book[] = [
  {
    id: 'dungeon-crawler-carl',
    title: 'Dungeon Crawler Carl',
    author: 'Matt Dinniman',
    file: '/books/dungeon-crawler-carl.epub',
    cover: '/covers/dungeon-crawler-carl.jpg',
    shelf: 'reading',
    coReaderId: 'juniper',
    mockProgress: 0.18,
  },
  {
    id: 'gate-of-the-feral-gods',
    title: 'The Gate of the Feral Gods',
    author: 'Matt Dinniman',
    file: '/books/gate-of-the-feral-gods.epub',
    cover: '/covers/gate-of-the-feral-gods.jpg',
    shelf: 'reading',
    coReaderId: 'theo',
    mockProgress: 0.04,
  },
  {
    id: 'aquascaping',
    title: 'Aquascaping',
    author: 'George Farmer',
    file: '/books/aquascaping.epub',
    cover: '/covers/aquascaping.jpg',
    shelf: 'recommended',
    coReaderId: 'marisol',
  },
]

export const friends: Friend[] = [
  {
    id: 'juniper',
    name: 'Juniper Hale',
    handle: 'booklover',
    bio: 'Chronic re-reader. Will annotate anything with a pulse and a plot twist.',
    joined: 'March 2025',
    booksRead: 41,
    favoriteGenres: ['LitRPG', 'Fantasy', 'Comedy'],
    color: '#434fa1',
    status: 'online',
    lastSeen: 'Active now',
    newAnnotations: 7,
    reading: { bookId: 'dungeon-crawler-carl', title: 'Dungeon Crawler Carl', minutes: 66 },
  },
  {
    id: 'theo',
    name: 'Theo Marchetti',
    handle: 'dogearedtheo',
    bio: 'Dog-ears pages and refuses to apologize. Big on worldbuilding.',
    joined: 'June 2025',
    booksRead: 27,
    favoriteGenres: ['Epic fantasy', 'Sci-fi'],
    color: '#b5673f',
    status: 'online',
    lastSeen: 'Active now',
    newAnnotations: 8,
    reading: { bookId: 'gate-of-the-feral-gods', title: 'The Gate of the Feral Gods', minutes: 23 },
  },
  {
    id: 'marisol',
    name: 'Marisol Vega',
    handle: 'tidepoolreads',
    bio: 'Marine biologist by day, aquarium nerd by night. Ask me about shrimp.',
    joined: 'January 2026',
    booksRead: 18,
    favoriteGenres: ['Nature', 'Non-fiction', 'Cozy mystery'],
    color: '#2f8f83',
    status: 'idle',
    lastSeen: 'Idle · 12m',
    newAnnotations: 5,
    reading: { bookId: 'aquascaping', title: 'Aquascaping', minutes: 141 },
  },
  {
    id: 'wren',
    name: 'Wren Okafor',
    handle: 'marginalia',
    bio: 'My margins have margins. Collector of beautiful sentences.',
    joined: 'February 2025',
    booksRead: 63,
    favoriteGenres: ['Literary', 'Magical realism'],
    color: '#8a4f9e',
    status: 'online',
    lastSeen: 'Active now',
    newAnnotations: 9,
    reading: { title: 'Piranesi', minutes: 48, color: '#5c7fa3' },
  },
  {
    id: 'august',
    name: 'August Lindqvist',
    handle: 'quietchapters',
    bio: 'Reads slowly on purpose. Tea, rain, and found family stories.',
    joined: 'August 2025',
    booksRead: 22,
    favoriteGenres: ['Cozy fantasy', 'Romance'],
    color: '#c0883a',
    status: 'offline',
    lastSeen: '3h ago',
    newAnnotations: 10,
    reading: { title: 'The House in the Cerulean Sea', minutes: 95, color: '#4d9bb8' },
  },
  {
    id: 'priya',
    name: 'Priya Raman',
    handle: 'inkandtea',
    bio: 'Book club organizer. I will make you a reading schedule.',
    joined: 'April 2025',
    booksRead: 35,
    favoriteGenres: ['Cozy fantasy', 'Historical'],
    color: '#b8455b',
    status: 'idle',
    lastSeen: 'Idle · 40m',
    newAnnotations: 11,
    reading: { title: 'Legends & Lattes', minutes: 12, color: '#a3643c' },
  },
  {
    id: 'felix',
    name: 'Felix Brandt',
    handle: 'paperbackfelix',
    bio: 'Secondhand bookstore regular. Studio Ghibli apologist.',
    joined: 'October 2025',
    booksRead: 14,
    favoriteGenres: ['Classics', 'Fantasy'],
    color: '#5a7d3a',
    status: 'offline',
    lastSeen: 'Yesterday',
    newAnnotations: 2,
    reading: { title: "Howl's Moving Castle", minutes: 210, color: '#7a5aa8' },
  },
  {
    id: 'ines',
    name: 'Inès Moreau',
    handle: 'nightstandstack',
    bio: 'My to-be-read pile is load-bearing. Currently between books.',
    joined: 'September 2025',
    booksRead: 9,
    favoriteGenres: ['Thriller', 'Poetry'],
    color: '#3d6fa0',
    status: 'offline',
    lastSeen: '2d ago',
    newAnnotations: 0,
  },
]

export type Activity = {
  id: string
  friendId: string
  verb: string
  bookId?: string
  title?: string
  when: string
  quote?: string
}

export const activity: Activity[] = [
  { id: 'a1', friendId: 'juniper', verb: 'left new notes for you in', bookId: 'dungeon-crawler-carl', when: '5h ago', quote: 'The system AI is the funniest character and I will not be taking questions.' },
  { id: 'a2', friendId: 'wren', verb: 'finished a chapter of', title: 'Piranesi', when: '2h ago' },
  { id: 'a3', friendId: 'theo', verb: 'is reading along with you in', bookId: 'gate-of-the-feral-gods', when: 'yesterday', quote: 'Pretty sure this connects back to the prologue!' },
  { id: 'a4', friendId: 'marisol', verb: 'recommended', bookId: 'aquascaping', when: '3 days ago', quote: 'We should try this layout in your tank!' },
  { id: 'a5', friendId: 'priya', verb: 'added to her shelf:', title: 'Legends & Lattes', when: '4 days ago' },
  { id: 'a6', friendId: 'august', verb: 'highlighted 12 passages in', title: 'The House in the Cerulean Sea', when: 'last week' },
]

export const getBook = (id?: string) => books.find((b) => b.id === id)
export const getFriend = (id?: string) => friends.find((f) => f.id === id)

export const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

const genericComments = [
  'This line stopped me in my tracks. Had to read it twice.',
  'Okay, I laughed out loud on the bus at this one.',
  'Bookmarking this for our next chat. So good.',
  'Do you think this is foreshadowing? I have a theory...',
  'The way this is phrased is just perfect.',
  'I did NOT see this coming the first time around.',
  'Underlining this because it feels important later.',
  'This reminded me of that conversation we had last week!',
  'Such a cozy little moment. I love it.',
  'Wait, re-read this part. Tell me what you think.',
  "Hmm, I'm not sure I trust this narrator here.",
  'Favourite passage so far, no contest.',
]

const commentsByBook: Record<string, string[]> = {
  'dungeon-crawler-carl': [
    'Princess Donut supremacy. That is all.',
    'The system AI is the funniest character and I will not be taking questions.',
    "Carl's feet deserve their own subplot.",
    'This is where I knew I was going to stay up way too late.',
    "Imagine getting an achievement for this. I'd be mortified.",
  ],
  'gate-of-the-feral-gods': [
    'The worldbuilding in this bit is wild.',
    'Pretty sure this connects back to the prologue!',
    'Dinniman really loves a chaotic setup, huh.',
  ],
  aquascaping: [
    'We should try this layout in your tank!',
    'Note to self: buy more dragon stone.',
    "So that's why my moss keeps turning brown.",
    'The rule of thirds, but make it fish.',
    'I want this exact carpet plant look.',
  ],
}

export const commentPool = (bookId: string) => [...(commentsByBook[bookId] ?? []), ...genericComments]
