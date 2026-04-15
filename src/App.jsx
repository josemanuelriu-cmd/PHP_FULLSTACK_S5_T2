import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import Navbar from './components/Navbar'
import logoImg from './assets/logo.png'

export default function App() {
  const { setShowLogin } = useAuth()
  const [showLogin, setLocalShowLogin] = useState(false)

  function openLogin() { setLocalShowLogin(true) }
  function closeLogin() { setLocalShowLogin(false) }

  return (
    <div className="app">
      {/* Watermark background */}
      <div className="page-watermark" aria-hidden="true">
        <img src={logoImg} alt="" />
      </div>

      <Navbar onLoginClick={openLogin} />

      {showLogin && <LoginPage onClose={closeLogin} />}

      <HomePage onLoginClick={openLogin} />
    </div>
  )
}
