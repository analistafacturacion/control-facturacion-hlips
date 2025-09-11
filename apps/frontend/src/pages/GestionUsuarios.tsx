import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Aseguradora } from '../types/aseguradora';

type Usuario = {
  id: number;
  nombre: string;
  usuario: string;
  rol: string;
  aseguradoras: string[];
  password: string;
  estado: boolean;
};

const API_URL = 'http://localhost:3001/api/users';

export default function GestionUsuarios() {
  function isFormValid() {
    if (!form.nombre || !form.usuario || !form.rol || !form.password) return false;
    if (form.rol.toLowerCase() === 'analista' && (!form.aseguradoras || form.aseguradoras.length === 0)) return false;
    return true;
  }
  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([]);
  const [aseguradorasLoading, setAseguradorasLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [form, setForm] = useState<Omit<Usuario, 'id' | 'estado'>>({
    nombre: '',
    usuario: '',
    rol: 'analista',
    aseguradoras: [],
    password: '',
  });
    const [nombreCompletoError, setNombreCompletoError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function fetchAseguradoras() {
      setAseguradorasLoading(true);
      try {
        const res = await fetch('http://localhost:3001/api/aseguradoras');
        const data = await res.json();
        setAseguradoras(data);
      } catch {
        setAseguradoras([]);
      } finally {
        setAseguradorasLoading(false);
      }
    }
    fetchAseguradoras();
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    if (type === 'select-multiple') {
      const options = (e.target as HTMLSelectElement).selectedOptions;
      setForm(f => ({ ...f, [name]: Array.from(options).map((o) => (o as HTMLOptionElement).value) }));
    } else {
      if (name === 'rol' && value === 'administrador') {
        setForm(f => ({ ...f, rol: value, aseguradoras: [] }));
      } else {
        setForm(f => ({ ...f, [name]: value }));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!editId) {
      setLoading(true);
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setError(data.error || 'No se pudo crear el usuario');
          setSuccessMsg('');
          return;
        }
        setSuccessMsg('Usuario creado con éxito');
        setTimeout(() => {
          setShowForm(false);
          setForm({ nombre: '', usuario: '', rol: 'analista', aseguradoras: [], password: '' });
          setEditId(null);
          setSuccessMsg('');
          fetchUsers();
        }, 3000);
      } catch (e: any) {
        setError(e.message || 'No se pudo crear el usuario');
        setSuccessMsg('');
      } finally {
        setLoading(false);
      }
    } else {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('Error al editar usuario');
        setShowForm(false);
        setForm({ nombre: '', usuario: '', rol: 'analista', aseguradoras: [], password: '' });
        setEditId(null);
        fetchUsers();
      } catch (e: any) {
        setError(e.message || 'No se pudo editar el usuario');
      } finally {
        setLoading(false);
      }
    }
    if (!form.nombre) {
      setNombreCompletoError("El nombre completo es obligatorio.");
      return;
    }
    if (form.rol.toLowerCase() === "analista" && form.aseguradoras.length === 0) {
      setError("El analista debe tener al menos una aseguradora asignada.");
      return;
    }
  }

  return (
    <div className="">
      <div className="flex items-center justify-between mb-8 mt-6 sm:mt-8 relative">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-1">Gestión de Usuarios</h1>
        </div>
        <button
          className="bg-black text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-gray-800 transition text-base flex items-center gap-1 ml-6"
          onClick={() => {
            setEditId(null);
            setForm({ nombre: '', usuario: '', rol: 'analista', aseguradoras: [], password: '' });
            setSuccessMsg('');
            setError('');
            setShowForm(true);
          }}
        >
          Crear usuario
        </button>
        <div className="absolute left-0 right-0 bottom-[-18px] h-px bg-gray-700 dark:bg-black pointer-events-none select-none" />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-black text-white">
                <th className="text-center py-2 px-3 font-semibold text-white">Nombre</th>
                <th className="text-center py-2 px-3 font-semibold text-white">Rol</th>
                <th className="text-center py-2 px-3 font-semibold text-white">Estado</th>
                <th className="text-center py-2 px-3 font-semibold text-white">Usuario</th>
                <th className="text-center py-2 px-3 font-semibold text-white">Contraseña</th>
                <th className="text-center py-2 px-3 font-semibold text-white">Aseguradoras</th>
                <th className="text-center py-2 px-3 font-semibold text-white">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-6">Cargando...</td></tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center align-middle py-20">
                    <span className="text-gray-400 font-medium text-base">No hay usuarios registrados</span>
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                    <td className="py-2 px-3 font-medium text-black dark:text-white text-center">{user.nombre.toUpperCase()}</td>
                    <td className="py-2 px-3 text-center align-middle">
                      <span className="inline-block px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-[11px] font-bold text-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-600 min-w-[48px]">
                          {user.rol?.toLowerCase() === 'administrador' || user.rol === 'ADMIN' ? 'ADMIN' :
                           user.rol?.toLowerCase() === 'analista' ? 'ANALISTA' : user.rol}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border min-w-[48px] ${user.estado !== false ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-200 text-gray-600 border-gray-300'} dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600`}>
                        {user.estado !== false ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300">{user.usuario}</td>
                    <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300">{user.password}</td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex flex-wrap gap-1 justify-center items-center">
                        {Array.isArray(user.aseguradoras) && user.aseguradoras.length > 0 ?
                          user.aseguradoras.map((asegId, idx) => {
                            const aseg = aseguradoras.find(a => a.id === Number(asegId));
                            return aseg ? (
                              <span
                                key={asegId + '-' + idx}
                                className="inline-block px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-[11px] font-bold text-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-600 min-w-[32px] cursor-pointer"
                                title={aseg.nombre}
                              >
                                {aseg.iniciales}
                              </span>
                            ) : null;
                          })
                          : <span className="text-xs text-gray-400">-</span>}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        className="p-0 m-0 bg-transparent border-none focus:outline-none"
                        type="button"
                        title="Editar"
                        onClick={() => {
                          setEditId(user.id);
                          setForm({
                            nombre: user.nombre,
                            usuario: user.usuario,
                            rol: user.rol,
                            aseguradoras: user.aseguradoras,
                            password: user.password,
                          });
                          setShowForm(true);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24">
                          <linearGradient id="lapizColorUser" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FFD600" />
                            <stop offset="1" stopColor="#FF9800" />
                          </linearGradient>
                          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="url(#lapizColorUser)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        </svg>
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700 p-0 m-0 bg-transparent border-none focus:outline-none ml-2"
                        type="button"
                        title="Eliminar"
                        onClick={async () => {
                          if (window.confirm('¿Seguro que deseas eliminar este usuario?')) {
                            try {
                              setLoading(true);
                              await fetch(`${API_URL}/${user.id}`, { method: 'DELETE' });
                              fetchUsers();
                            } catch {
                              setError('No se pudo eliminar el usuario');
                            } finally {
                              setLoading(false);
                            }
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-black dark:hover:text-white text-xl" onClick={() => { setShowForm(false); setEditId(null); }}>&times;</button>
            <h3 className="text-xl font-bold mb-4 text-black dark:text-white text-center">{editId ? 'Editar usuario' : 'Crear usuario'}</h3>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <input
                className="border rounded-md px-3 py-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
                placeholder="Nombre completo"
                name="nombre"
                value={form.nombre}
                onChange={handleFormChange}
                required
              />
                {nombreCompletoError && (
                  <div className="text-red-500 text-xs mt-1">{nombreCompletoError}</div>
                )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aseguradoras asignadas</label>
                <Select
                  isMulti
                  isLoading={aseguradorasLoading}
                  name="aseguradoras"
                  classNamePrefix="react-select"
                  placeholder={form.rol === 'administrador' ? 'No aplica para administradores' : 'Buscar y seleccionar aseguradoras...'}
                  options={aseguradoras.map(a => ({ value: a.id, label: `${a.nombre} (${a.iniciales})` }))}
                  value={form.aseguradoras.map(val => {
                    const aseg = aseguradoras.find(a => a.id === Number(val));
                    return aseg ? { value: aseg.id, label: aseg.iniciales } : { value: val, label: val };
                  })}
                  onChange={selected => setForm(f => ({ ...f, aseguradoras: selected ? selected.map((s: any) => s.value) : [] }))}
                  styles={{
                    control: (base) => ({ ...base, backgroundColor: 'var(--tw-bg-opacity,1) #f3f4f6', borderColor: '#d1d5db', minHeight: 44, opacity: form.rol === 'administrador' ? 0.5 : 1 }),
                    menu: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                  isDisabled={form.rol === 'administrador'}
                />
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {form.rol === 'administrador' ? 'No es necesario asignar aseguradoras a un administrador' : 'Puedes buscar y seleccionar varias aseguradoras'}
                </span>
              </div>
              <select
                className="border rounded-md px-3 py-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
                name="rol"
                value={form.rol}
                onChange={handleFormChange}
              >
                <option value="analista">Analista</option>
                <option value="administrador">Administrador</option>
              </select>
              <input
                className="border rounded-md px-3 py-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
                placeholder="Usuario"
                name="usuario"
                value={form.usuario}
                onChange={handleFormChange}
                required
              />
              <input
                className="border rounded-md px-3 py-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
                placeholder="Contraseña"
                type="password"
                name="password"
                value={form.password}
                onChange={handleFormChange}
                required
              />
              {error && <div className="text-red-500 text-sm text-center">{error}</div>}
              {successMsg && <div className="text-green-600 text-sm text-center font-semibold animate-pulse">{successMsg}</div>}
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200" onClick={() => { setShowForm(false); setEditId(null); }}>Cancelar</button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded font-semibold transition-colors duration-200 ${loading || !isFormValid() ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}
                  disabled={loading || !isFormValid()}
                >
                  {loading ? (editId ? 'Guardando...' : 'Guardando...') : (editId ? 'Guardar cambios' : 'Confirmar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}