import React, { useState } from 'react'
import { useAuth } from '../auth'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [errorCount, setErrorCount] = useState(0)
  const [role, setRole] = useState('analista')
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const ok = await login(username, password, role)
    setLoading(false)
    if (ok) {
      setSuccess(true)
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } else {
      setError('Usuario o contraseña incorrectos')
      setErrorCount(c => c + 1)
      setSuccess(false)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <form
        key={errorCount}
        onSubmit={handleSubmit}
  className={`relative bg-white dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl px-8 py-8 w-full max-w-md flex flex-col gap-6 overflow-hidden transition-all duration-300 transform -translate-y-16 ${error ? 'animate-shake' : ''}`}
        style={{ boxShadow: '0 6px 32px 0 rgba(0,0,0,0.13)' }}
      >
      {/* Animación shake personalizada para Tailwind */}
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-8px); }
          40%, 60% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
  <div className={`absolute left-0 top-0 h-full w-2 rounded-l-xl transition-colors duration-300 ${success ? 'bg-green-600' : error ? 'bg-red-600' : 'bg-black'}`} />
        <div className="flex flex-col gap-1 items-center px-6">
          <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight text-center">Prisma Analytics</h2>
          <p className="text-gray-500 text-sm text-center">Accede con tus credenciales</p>
        </div>
        <div className="flex flex-col gap-3 px-6">
            <div className="flex flex-col gap-1 mb-1">
            <label className="text-xs text-gray-600 dark:text-gray-400 font-medium" htmlFor="username">Usuario</label>
            <input
              id="username"
              className="w-full border-0 rounded-md px-3 py-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-black/70 transition shadow-sm"
              placeholder="Usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
            />
          </div>
            <div className="flex flex-col gap-1 mb-1">
            <label className="text-xs text-gray-600 dark:text-gray-400 font-medium" htmlFor="password">Contraseña</label>
            <div className="relative">
              <input
                id="password"
                className="w-full border-0 rounded-md px-3 py-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-black/70 transition shadow-sm pr-10"
                placeholder="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-black focus:outline-none"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  // Ojo abierto minimalista
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z" stroke="#222" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="#222" strokeWidth="1.5"/></svg>
                ) : (
                  // Ojo cerrado minimalista
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M3 3l18 18M2 12s4-6 10-6c2.1 0 4.1.6 5.8 1.7M22 12s-4 6-10 6c-2.1 0-4.1-.6-5.8-1.7" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="12" r="3" stroke="#222" strokeWidth="1.5"/><path d="M9.5 9.5a3.5 3.5 0 0 1 5 5" stroke="#222" strokeWidth="1.5"/></svg>
                )}
              </button>
            </div>
          </div>
            <div className="flex flex-col gap-1 mb-1">
            <label className="text-xs text-gray-600 dark:text-gray-400 font-medium" htmlFor="role">Rol</label>
            <select
              id="role"
              className="appearance-none w-full border-0 rounded-md px-3 py-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-black/70 transition shadow-sm min-h-[40px]"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              <option value="analista">Analista</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
          {/* El texto de error se oculta, pero la barra lateral sigue cambiando de color */}
          {loading ? (
            <div className="flex justify-center items-center mt-2 mb-2">
              <svg className="animate-spin h-6 w-6 text-black dark:text-white" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" className="opacity-30" />
                <path d="M15 8A7 7 0 0 0 8 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full bg-black hover:bg-gray-900 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 flex items-center justify-center gap-2 mt-2"
              disabled={loading || !username || !password}
            >
              Iniciar sesión
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
