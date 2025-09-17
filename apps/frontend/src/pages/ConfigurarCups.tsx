import React, { useEffect, useState } from 'react';
import API_CONFIG from '../config/api';

interface Cup {
  id: number;
  aseguradora: string;
  cups: string;
  cuint: string;
  servicioFacturado: string;
  servicioNormalizado: string;
  valor: string;
  activo: boolean;
}

export default function ConfigurarCups() {
  const [cups, setCups] = useState<Cup[]>([]);
  const [form, setForm] = useState<Omit<Cup, 'id'>>({ aseguradora: '', cups: '', cuint: '', servicioFacturado: '', servicioNormalizado: '', valor: '', activo: true });
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchCups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/cups`);
      const data = await res.json();
      setCups(data);
    } catch {
      setError('No se pudieron cargar los CUPS');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCups();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value } as any));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.cups.trim() || !form.servicioFacturado.trim()) {
      setError('CUPS y Servicio Facturado son obligatorios');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/cups${editId ? '/' + editId : ''}`, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Error al guardar');
  setForm({ aseguradora: '', cups: '', cuint: '', servicioFacturado: '', servicioNormalizado: '', valor: '', activo: true });
      setEditId(null);
      fetchCups();
    } catch {
      setError('Error al guardar el CUPS');
    }
    setLoading(false);
  };

  const handleEdit = (c: Cup) => {
    setForm({ aseguradora: c.aseguradora, cups: c.cups, cuint: c.cuint, servicioFacturado: c.servicioFacturado, servicioNormalizado: c.servicioNormalizado, valor: c.valor, activo: c.activo });
    setEditId(c.id);
    if (!showForm) setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este CUPS?')) return;
    setLoading(true);
    await fetch(`${API_CONFIG.BASE_URL}/cups/${id}`, { method: 'DELETE' });
    fetchCups();
    setLoading(false);
  };

  return (
    <div className="border p-4">
      <button
        type="button"
        className={`flex items-center gap-2 font-medium text-black dark:text-white focus:outline-none transition-all duration-200 ${showForm ? 'mb-4' : 'mb-0'}`}
        onClick={() => setShowForm(v => !v)}
        aria-expanded={showForm}
        aria-controls="form-cups"
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
        Configurar CUPS
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
            <form id="form-cups" className="mt-2" onSubmit={handleSubmit}>
              <div className="flex flex-col md:flex-row gap-2 w-full items-end">
                <div className="flex-1 w-full flex flex-row items-end gap-3 overflow-x-auto">
                  <div className="flex-1 min-w-[120px] flex flex-col">
                    <label className="text-sm mb-1">Aseguradora</label>
                    <input className="border px-2 py-1 w-full bg-white text-black" name="aseguradora" value={form.aseguradora} onChange={handleChange} placeholder="Aseguradora" required />
                  </div>
                  <div className="flex-1 min-w-[90px] flex flex-col">
                    <label className="text-sm mb-1">CUPS</label>
                    <input className="border px-2 py-1 w-full bg-white text-black" name="cups" value={form.cups} onChange={handleChange} placeholder="CUPS" required />
                  </div>
                  <div className="flex-1 min-w-[80px] flex flex-col">
                    <label className="text-sm mb-1">CUINT</label>
                    <input className="border px-2 py-1 w-full bg-white text-black" name="cuint" value={form.cuint} onChange={handleChange} placeholder="CUINT" />
                  </div>
                  <div className="flex-1 min-w-[160px] flex flex-col">
                    <label className="text-sm mb-1">Servicio Facturado</label>
                    <input className="border px-2 py-1 w-full bg-white text-black" name="servicioFacturado" value={form.servicioFacturado} onChange={handleChange} placeholder="Servicio Facturado" />
                  </div>
                  <div className="flex-1 min-w-[160px] flex flex-col">
                    <label className="text-sm mb-1">Servicio Normalizado</label>
                    <input className="border px-2 py-1 w-full bg-white text-black" name="servicioNormalizado" value={form.servicioNormalizado} onChange={handleChange} placeholder="Servicio Normalizado" />
                  </div>
                  <div className="flex-1 min-w-[100px] flex flex-col">
                    <label className="text-sm mb-1">Valor</label>
                    <input className="border px-2 py-1 w-full bg-white text-black text-right" name="valor" value={form.valor} onChange={handleChange} placeholder="Valor" />
                  </div>
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
                    onClick={() => { setEditId(null); setForm({ aseguradora: '', cups: '', cuint: '', servicioFacturado: '', servicioNormalizado: '', valor: '', activo: true }); }}
                    className="h-8 px-4 w-fit ml-2 mb-0 border border-gray-400 text-gray-400 bg-white focus:outline-none cursor-pointer"
                    style={{ boxShadow: 'none' }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
              {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
            </form>
            <hr className="border-t border-black my-6 w-full" />
            <div>
              <h3 className="font-medium mb-2 text-black dark:text-white">CUPS Registrados ({cups.length})</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-center" style={{borderCollapse:'collapse'}}>
                  <thead>
                    <tr className="bg-black">
                      <th className="px-2 py-2 text-center text-white font-semibold">Aseguradora</th>
                      <th className="px-2 py-2 text-center text-white font-semibold">CUPS</th>
                      <th className="px-2 py-2 text-center text-white font-semibold">CUINT</th>
                      <th className="px-2 py-2 text-center text-white font-semibold">Servicio Facturado</th>
                      <th className="px-2 py-2 text-center text-white font-semibold">Servicio Normalizado</th>
                      <th className="px-2 py-2 text-center text-white font-semibold">Valor</th>
                      <th className="px-2 py-2 text-center text-white font-semibold">Activo</th>
                      <th className="px-2 py-2 text-center text-white font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cups.length === 0 ? (
                      <tr><td colSpan={8} className="text-center p-2 text-gray-400 border-b">Sin CUPS</td></tr>
                    ) : [...cups].sort((a,b) => a.id - b.id).map(c => (
                      <tr key={c.id} style={{borderBottom:'1px solid #e5e7eb'}}>
                        <td className="px-2 py-1 text-center" style={{borderBottom:'1px solid #e5e7eb'}}>{c.aseguradora}</td>
                        <td className="px-2 py-1 text-center" style={{borderBottom:'1px solid #e5e7eb'}}>{c.cups}</td>
                        <td className="px-2 py-1 text-center" style={{borderBottom:'1px solid #e5e7eb'}}>{c.cuint}</td>
                        <td className="px-2 py-1 text-center" style={{borderBottom:'1px solid #e5e7eb'}}>{c.servicioFacturado}</td>
                        <td className="px-2 py-1 text-center" style={{borderBottom:'1px solid #e5e7eb'}}>{c.servicioNormalizado}</td>
                        <td className="px-2 py-1 text-center" style={{borderBottom:'1px solid #e5e7eb'}}>{c.valor}</td>
                        <td className="px-2 py-1 text-center" style={{borderBottom:'1px solid #e5e7eb'}}>{c.activo ? 'Sí' : 'No'}</td>
                        <td className="px-2 py-1 text-center" style={{borderBottom:'1px solid #e5e7eb'}}>
                          <button className="p-0 m-0 bg-transparent border-none focus:outline-none" type="button" title="Editar" onClick={() => handleEdit(c)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24">
                              <linearGradient id="lapizColorCups" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#FFD600" />
                                <stop offset="1" stopColor="#FF9800" />
                              </linearGradient>
                              <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="url(#lapizColorCups)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                            </svg>
                          </button>
                          <button className="text-red-500 hover:text-red-700 p-0 m-0 bg-transparent border-none focus:outline-none ml-2" type="button" title="Eliminar" onClick={() => handleDelete(c.id)}>
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
