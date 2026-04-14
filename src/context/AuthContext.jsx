/*
import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)
*/

import { createContext, useContext, useState } from 'react'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)

  const API = import.meta.env.VITE_API_URL

  const authHeaders = token
    ? { Authorization: `Bearer ${token}` }
    : {}

  return (
    <AuthContext.Provider value={{ token, setToken, API, authHeaders }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
