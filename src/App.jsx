import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar    from './components/Navbar'
import LoginPage from './pages/LoginPage'
import HomePage  from './pages/HomePage'
import BoardgamesPage   from './pages/BoardgamesPage'
import BoardgameDetail  from './pages/BoardgameDetail'
import BoardgameForm    from './pages/BoardgameForm'
import TypesPage   from './pages/TypesPage'
import TypeDetail  from './pages/TypeDetail'
import TypeForm    from './pages/TypeForm'
import ProfilePage from './pages/ProfilePage'
import SessionsPage  from './pages/SessionsPage'
import SessionDetail from './pages/SessionDetail'
import SessionForm   from './pages/SessionForm'
import GameForm      from './pages/GameForm'
import logoImg from './assets/logo.png'

// Guard: redirect to / if not logged in
function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/" replace />
}

export default function App() {
  const [showLogin, setShowLogin] = useState(false)

  return (
    <div className="app">
      <div className="page-watermark" aria-hidden="true">
        <img src={logoImg} alt="" />
      </div>

      <Navbar onLoginClick={() => setShowLogin(true)} />

      {showLogin && <LoginPage onClose={() => setShowLogin(false)} />}

      <Routes>
        <Route path="/"            element={<HomePage onLoginClick={() => setShowLogin(true)} />} />
        <Route path="/boardgames"                element={<PrivateRoute><BoardgamesPage /></PrivateRoute>} />
        <Route path="/boardgames/new"            element={<PrivateRoute><BoardgameForm mode="create" /></PrivateRoute>} />
        <Route path="/boardgames/:id"            element={<PrivateRoute><BoardgameDetail /></PrivateRoute>} />
        <Route path="/boardgames/:id/edit"       element={<PrivateRoute><BoardgameForm mode="edit" /></PrivateRoute>} />
        <Route path="/types"                     element={<PrivateRoute><TypesPage /></PrivateRoute>} />
        <Route path="/types/new"                 element={<PrivateRoute><TypeForm mode="create" /></PrivateRoute>} />
        <Route path="/types/:id"                 element={<PrivateRoute><TypeDetail /></PrivateRoute>} />
        <Route path="/types/:id/edit"            element={<PrivateRoute><TypeForm mode="edit" /></PrivateRoute>} />
        <Route path="/profile"                   element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/sessions"                  element={<PrivateRoute><SessionsPage /></PrivateRoute>} />
        <Route path="/sessions/new"              element={<PrivateRoute><SessionForm mode="create" /></PrivateRoute>} />
        <Route path="/sessions/:id"              element={<PrivateRoute><SessionDetail /></PrivateRoute>} />
        <Route path="/sessions/:id/edit"         element={<PrivateRoute><SessionForm mode="edit" /></PrivateRoute>} />
        <Route path="/sessions/:sessionId/games/new" element={<PrivateRoute><GameForm mode="create" /></PrivateRoute>} />
        <Route path="/games/:id/edit"            element={<PrivateRoute><GameForm mode="edit" /></PrivateRoute>} />
        {/* Future pages — placeholder */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
