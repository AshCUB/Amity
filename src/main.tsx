import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Friends from './pages/Friends'
import FriendProfile from './pages/FriendProfile'
import Profile from './pages/Profile'
import Reader from './pages/Reader'
import NotFound from './pages/NotFound'
import SettingsModal from './components/SettingsModal'
import { SettingsProvider } from './settings'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <SettingsProvider>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/friends/:friendId" element={<FriendProfile />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/read/:bookId" element={<Reader />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <SettingsModal />
    </BrowserRouter>
  </SettingsProvider>,
)
