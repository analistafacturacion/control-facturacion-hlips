import React, { createContext, useContext, useState, useEffect } from 'react'

interface AuthContextType {
  user: null | { username: string; rol: string; nombre: string }
  token: string | null
  pergamoToken: string | null
  login: (username: string, password: string, rol: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<null | { username: string; rol: string; nombre: string }>(null)
  const [token, setToken] = useState<string | null>(null)
  const [pergamoToken, setPergamoToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('token')
    const u = localStorage.getItem('user')
    const p = localStorage.getItem('pergamoToken')
    if (t && u) {
      setToken(t)
      setUser(JSON.parse(u))
    }
    if (p) {
      setPergamoToken(p)
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string, rol: string) => {
    try {
      const res = await fetch('http://localhost:3001/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: username, password, rol })
      })
      if (!res.ok) return false
      const data = await res.json()
      setToken(data.token)
      setUser({ username: data.usuario, rol: data.rol, nombre: data.nombre })
      setPergamoToken(data.pergamoToken || null)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify({ username: data.usuario, rol: data.rol, nombre: data.nombre }))
      if (data.pergamoToken) {
        localStorage.setItem('pergamoToken', data.pergamoToken)
      } else {
        localStorage.removeItem('pergamoToken')
      }
      // Enviar credenciales de Pergamo al backend para guardarlas en memoria
      await fetch('http://localhost:3001/api/facturacion/pergamo/credenciales', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user: username, pass: password, userId: username, token: data.pergamoToken })
      });
      return true
    } catch {
      return false
    }
  }

  const logout = async () => {
    // Borrar credenciales de Pergamo en backend
    if (user?.username) {
      await fetch('http://localhost:3001/api/facturacion/pergamo/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.username })
      });
    }
    setToken(null)
    setUser(null)
    setPergamoToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('pergamoToken')
  }

  if (loading) {
    // Puedes personalizar este loader si lo deseas
    return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900"><span className="text-lg text-gray-600 dark:text-gray-200">Cargando...</span></div>
  }

  return (
    <AuthContext.Provider value={{ user, token, pergamoToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
