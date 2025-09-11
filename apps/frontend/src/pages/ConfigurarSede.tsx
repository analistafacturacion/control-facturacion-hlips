import React, { useEffect, useState } from 'react';

interface Sede {
  id: number;
  nombre: string;
  regional: string;
  zonal: string;
  indicadorFacturacion: string;
  iniciales: string;
}

export default function ConfigurarSede() {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [form, setForm] = useState<Omit<Sede, 'id'>>({
    nombre: '',
    regional: '',
    zonal: '',
    indicadorFacturacion: '',
    iniciales: '',
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchSedes = async () => {
    setLoading(true);
    const res = await fetch('http://localhost:3001/api/sedes');
    const data = await res.json();
    setSedes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSedes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/sedes${editId ? '/' + editId : ''}`, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Error al guardar la sede');
      setForm({ nombre: '', regional: '', zonal: '', indicadorFacturacion: '', iniciales: '' });
      setEditId(null);
      fetchSedes();
    } catch {
      setError('Error al guardar la sede');
    }
    setLoading(false);
  };

  const handleEdit = (sede: Sede) => {
    setForm({
      nombre: sede.nombre,
      regional: sede.regional,
      zonal: sede.zonal,
      indicadorFacturacion: sede.indicadorFacturacion,
      iniciales: sede.iniciales,
    });
    setEditId(sede.id);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar esta sede?')) return;
    setLoading(true);
    await fetch(`http://localhost:3001/api/sedes/${id}`, { method: 'DELETE' });
    fetchSedes();
    setLoading(false);
  };

  return (
    <div className="border p-4">
      <button
        type="button"
        className={`flex items-center gap-2 font-medium text-black dark:text-white focus:outline-none transition-all duration-200 ${showForm ? 'mb-4' : 'mb-0'}`}
        onClick={() => setShowForm(v => !v)}
        aria-expanded={showForm}
        aria-controls="form-sede"
      >
        <span className={`inline-block w-5 h-5 transition-transform duration-500`} style={{transitionProperty:'transform'}}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect
              x="2"
              y="5"
              width="16"
              height="2"
              rx="1"
              fill="currentColor"
              className={`transition-all duration-500 origin-center ${showForm ? 'translate-y-[5px] rotate-45' : ''}`}
              style={{transitionProperty:'transform'}}
            />
            <rect
              x="2"
              y="9"
              width="16"
              height="2"
              rx="1"
              fill="currentColor"
              className={`transition-all duration-300 origin-center ${showForm ? 'opacity-0' : 'opacity-100'}`}
              style={{transitionProperty:'opacity'}}
            />
            <rect
              x="2"
              y="13"
              width="16"
              height="2"
              rx="1"
              fill="currentColor"
              className={`transition-all duration-500 origin-center ${showForm ? '-translate-y-[5px] -rotate-45' : ''}`}
              style={{transitionProperty:'transform'}}
            />
          </svg>
        </span>
        Configurar Sede
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
            <form id="form-sede" className="mt-2" onSubmit={handleSubmit}>
              <div className="flex flex-col md:flex-row gap-2 w-full items-end">
                <div className="flex-1 flex flex-col">
                  <label className="text-sm mb-1">Nombre Sede</label>
                  <input className="border px-2 py-1 w-full bg-white text-black" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre Sede" required />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="text-sm mb-1">Regional</label>
                  <input className="border px-2 py-1 w-full bg-white text-black" name="regional" value={form.regional} onChange={handleChange} placeholder="Regional" required />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="text-sm mb-1">Zonal</label>
                  <input className="border px-2 py-1 w-full bg-white text-black" name="zonal" value={form.zonal} onChange={handleChange} placeholder="Zonal" required />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="text-sm mb-1">Indicador Facturación</label>
                  <input className="border px-2 py-1 w-full bg-white text-black" name="indicadorFacturacion" value={form.indicadorFacturacion} onChange={handleChange} placeholder="Indicador Facturación" required />
                </div>
                <div className="flex flex-col min-w-[100px] max-w-[120px]">
                  <label className="text-sm mb-1">Iniciales</label>
                  <input className="border px-2 py-1 w-full bg-white text-black uppercase" name="iniciales" value={form.iniciales} onChange={handleChange} placeholder="ABC" maxLength={10} required />
                </div>
                <button
                  type="submit"
                  className="h-8 px-4 bg-black text-white w-fit ml-2 mb-0 transition-colors duration-200 focus:outline-none"
                  style={{marginTop:0}}
                  disabled={loading}
                >
                  Guardar
                </button>
                {editId && (
                  <button
                    type="button"
                    onClick={() => { setEditId(null); setForm({ nombre: '', regional: '', zonal: '', indicadorFacturacion: '', iniciales: '' }); }}
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
            {/* Tabla de sedes */}
            <div>
              <h3 className="font-medium mb-2 text-black dark:text-white">Sedes Registradas ({sedes.length})</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-center" style={{borderCollapse:'collapse'}}>
                  <thead>
                    <tr className="bg-black">
                      <th className="px-2 py-2 text-center text-white font-semibold">Nombre Sede</th>
                      <th className="px-2 py-2 text-center text-white font-semibold">Regional</th>
                      <th className="px-2 py-2 text-center text-white font-semibold">Zonal</th>
                      <th className="px-2 py-2 text-center text-white font-semibold">Indicador Facturación</th>
                      <th className="px-2 py-2 text-center text-white font-semibold">Iniciales</th>
                      <th className="px-2 py-2 text-center text-white font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sedes.length === 0 ? (
                      <tr><td colSpan={7} className="text-center p-2 text-gray-400 border-b">Sin sedes</td></tr>
                    ) : [...sedes].sort((a, b) => a.id - b.id).map((sede, idx) => (
                      <tr key={sede.id} style={{borderBottom:'1px solid #e5e7eb'}}>
                        <td className="px-2 py-1 text-center" style={{borderBottom:'1px solid #e5e7eb'}}>{sede.nombre}</td>
                        <td className="px-2 py-1 text-center" style={{borderBottom:'1px solid #e5e7eb'}}>{sede.regional}</td>
                        <td className="px-2 py-1 text-center" style={{borderBottom:'1px solid #e5e7eb'}}>{sede.zonal}</td>
                        <td className="px-2 py-1 text-center" style={{borderBottom:'1px solid #e5e7eb'}}>{sede.indicadorFacturacion}</td>
                        <td className="px-2 py-1 text-center uppercase" style={{borderBottom:'1px solid #e5e7eb'}}>{sede.iniciales}</td>
                        <td className="px-2 py-1 text-center" style={{borderBottom:'1px solid #e5e7eb'}}>
                          <button
                            className="p-0 m-0 bg-transparent border-none focus:outline-none"
                            type="button"
                            title="Editar"
                            onClick={() => handleEdit(sede)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24">
                              <linearGradient id="lapizColorSede" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#FFD600" />
                                <stop offset="1" stopColor="#FF9800" />
                              </linearGradient>
                              <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="url(#lapizColorSede)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                            </svg>
                          </button>
                          <button
                            className="text-red-500 hover:text-red-700 p-0 m-0 bg-transparent border-none focus:outline-none ml-2"
                            type="button"
                            title="Eliminar"
                            onClick={() => handleDelete(sede.id)}
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
  );
}
