import React, { useEffect, useState } from 'react'
import { Aseguradora } from '../types/aseguradora'
import ConfigurarSede from './ConfigurarSede'
import API_CONFIG from '../config/api'

export default function Configuracion() {
  // Estado para aseguradoras
  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([])
  const [nombrePergamo, setNombrePergamo] = useState('')
  const [nombre, setNombre] = useState('')
  const [iniciales, setIniciales] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number|null>(null)

  // Cargar aseguradoras al montar
  useEffect(() => {
    fetch(`${API_CONFIG.BASE_URL}/aseguradoras`)
      .then(r => r.json())
      .then(data => {
        setAseguradoras(data.map((a: any) => ({ nombrePergamo: '', ...a })))
      })
  }, [])

  // Manejar envío de formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!nombrePergamo.trim() || !nombre.trim() || !iniciales.trim()) {
      setError('Completa todos los campos')
      return
    }
    if (iniciales.length > 3) {
      setError('Las iniciales deben tener máximo 3 letras')
      return
    }
    setLoading(true)
    try {
      if (editId !== null) {
        // Editar aseguradora existente
        const res = await fetch(`${API_CONFIG.BASE_URL}/aseguradoras/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombrePergamo, nombre, iniciales })
        })
        if (!res.ok) throw new Error('Error al actualizar')
        const actualizada = await res.json()
        setAseguradoras(a => a.map(x => x.id === editId ? { ...x, ...actualizada } : x))
      } else {
        // Crear nueva aseguradora
        const res = await fetch(`${API_CONFIG.BASE_URL}/aseguradoras`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombrePergamo, nombre, iniciales })
        })
        if (!res.ok) throw new Error('Error al guardar')
        const nueva = await res.json()
        setAseguradoras(a => [...a, nueva])
      }
      setNombrePergamo('')
      setNombre('')
      setIniciales('')
      setEditId(null)
    } catch {
      setError('No se pudo guardar la aseguradora')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="pt-8">
  <div className="mb-6">
  <h1 className="text-3xl font-bold text-black dark:text-white mb-1">Configuración</h1>
  <hr className="border-t border-black mt-4 mb-2 w-full" />
  </div>
  <div className="grid gap-6 grid-cols-1">
    {/* Formulario de aseguradoras */}
  <div className="border p-4">
          <button
            type="button"
            className={`flex items-center gap-2 font-medium text-black focus:outline-none transition-all duration-200 ${showForm ? 'mb-4' : 'mb-0'}`}
            onClick={() => setShowForm(v => !v)}
            aria-expanded={showForm}
            aria-controls="form-aseguradora"
          >
            <span className={`inline-block w-5 h-5 transition-transform duration-500`} style={{transitionProperty:'transform'}}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect
                  x="2"
                  y="5"
                  width="16"
                  height="2"
                  rx="1"
                  fill="black"
                  className={`transition-all duration-500 origin-center ${showForm ? 'translate-y-[5px] rotate-45' : ''}`}
                  style={{transitionProperty:'transform'}}
                />
                <rect
                  x="2"
                  y="9"
                  width="16"
                  height="2"
                  rx="1"
                  fill="black"
                  className={`transition-all duration-300 origin-center ${showForm ? 'opacity-0' : 'opacity-100'}`}
                  style={{transitionProperty:'opacity'}}
                />
                <rect
                  x="2"
                  y="13"
                  width="16"
                  height="2"
                  rx="1"
                  fill="black"
                  className={`transition-all duration-500 origin-center ${showForm ? '-translate-y-[5px] -rotate-45' : ''}`}
                  style={{transitionProperty:'transform'}}
                />
              </svg>
            </span>
            Configurar Aseguradora
          </button>
          <div
            style={{
              overflow: 'hidden',
              transition: showForm
                ? 'max-height 0.9s cubic-bezier(0.4,0,0.2,1), opacity 0.6s cubic-bezier(0.4,0,0.2,1)'
                : 'max-height 1.8s cubic-bezier(0.4,0,0.2,1), opacity 0.8s cubic-bezier(0.4,0,0.2,1)',
              maxHeight: showForm ? 1200 : 0,
              opacity: showForm ? 1 : 0
            }}
          >
            {showForm && (
              <>
                <form id="form-aseguradora" className="mt-2" onSubmit={handleSubmit}>
                  <div className="flex flex-col md:flex-row gap-2 w-full items-end">
                    <div className="flex-1 flex flex-col">
                      <label className="text-sm mb-1">Nombre Pergamo</label>
                      <input className="border px-2 py-1 w-full" value={nombrePergamo} onChange={e => setNombrePergamo(e.target.value)} placeholder="Nombre Pergamo" />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <label className="text-sm mb-1">Nombre Aseguradora</label>
                      <input className="border px-2 py-1 w-full" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre de la aseguradora" />
                    </div>
                    <div className="flex flex-col min-w-[130px] max-w-[170px]">
                      <label className="text-sm mb-1">Iniciales</label>
                      <input className="border px-2 py-1 w-full uppercase" style={{minWidth: '100px', maxWidth: '150px'}} value={iniciales} maxLength={3} onChange={e => setIniciales(e.target.value.toUpperCase())} placeholder="ABC" />
                    </div>
                    <button
                      type="submit"
                      className="h-8 px-4 bg-black text-white w-fit ml-2 mb-0 transition-colors duration-200 focus:outline-none"
                      style={{marginTop:0}}
                      disabled={loading}
                    >
                      {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                    {editId && (
                      <button
                        type="button"
                        onClick={() => { setEditId(null); setNombre(''); setNombrePergamo(''); setIniciales(''); }}
                        className="h-8 px-4 w-fit ml-2 mb-0 border border-gray-400 text-gray-400 bg-white focus:outline-none cursor-pointer"
                        style={{ boxShadow: 'none' }}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                  {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
                </form>
                {/* Línea divisoria */}
                <hr className="border-t border-black my-6 w-full" />
                {/* Tabla de aseguradoras */}
                <div>
                  <h3 className="font-medium mb-2">Aseguradoras Registradas ({aseguradoras.length})</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-center" style={{borderCollapse:'collapse'}}>
                      <thead>
                        <tr className="bg-black">
                          <th className="px-2 py-2 text-center text-white font-semibold min-w-[500px] max-w-[900px] w-[700px]">Nombre Pergamo</th>
                          <th className="px-2 py-2 text-center text-white font-semibold">Nombre Aseguradora</th>
                          <th className="px-2 py-2 text-center text-white font-semibold">Iniciales</th>
                          <th className="px-2 py-2 text-center text-white font-semibold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aseguradoras.length === 0 ? (
                          <tr><td colSpan={5} className="text-center p-2 text-gray-400 border-b">Sin aseguradoras</td></tr>
                        ) : [...aseguradoras].sort((a, b) => a.id - b.id).map((a, idx) => (
                          <tr key={a.id} style={{borderBottom:'1px solid #e5e7eb'}}>
                            <td className="px-2 py-1 text-center min-w-[500px] max-w-[900px] w-[700px] truncate" style={{borderBottom:'1px solid #e5e7eb'}}>{a.nombrePergamo}</td>
                            <td className="px-2 py-1 text-center" style={{borderBottom:'1px solid #e5e7eb'}}>{a.nombre}</td>
                            <td className="px-2 py-1 text-center" style={{borderBottom:'1px solid #e5e7eb'}}>{a.iniciales}</td>
                            <td className="px-2 py-1 text-center" style={{borderBottom:'1px solid #e5e7eb'}}>
                              <button
                                className="p-0 m-0 bg-transparent border-none focus:outline-none"
                                type="button"
                                title="Editar"
                                onClick={() => {
                                  setEditId(a.id)
                                  setNombrePergamo(a.nombrePergamo)
                                  setNombre(a.nombre)
                                  setIniciales(a.iniciales)
                                  if (!showForm) setShowForm(true)
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24">
                                  <linearGradient id="lapizColor" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#FFD600" />
                                    <stop offset="1" stopColor="#FF9800" />
                                  </linearGradient>
                                  <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="url(#lapizColor)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                </svg>
                              </button>
                              <button
                                className="text-red-500 hover:text-red-700 p-0 m-0 bg-transparent border-none focus:outline-none ml-2"
                                type="button"
                                title="Eliminar"
                                onClick={async () => {
                                  if (window.confirm('¿Seguro que deseas eliminar esta aseguradora?')) {
                                    await fetch(`${API_CONFIG.BASE_URL}/aseguradoras/${a.id}`, { method: 'DELETE' })
                                    setAseguradoras(aseguradoras.filter(x => x.id !== a.id))
                                  }
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        {/* Módulo de sedes */}
        <ConfigurarSede />
      </div>
    </section>
  )
}
