import React from 'react';
import { useAuth } from '../auth';

export default function Perfil() {
  const { user } = useAuth();
  // Simulación de datos adicionales (puedes reemplazar por datos reales del backend)
  const datosIngreso = {
    usuario: user?.username || '',
    rol: user?.rol || '',
    nombre: user?.nombre || '',
    email: user?.username ? user.username + '@ejemplo.com' : '',
    ultimoAcceso: '2025-08-08 10:32',
    aseguradoras: [
      'Aseguradora Alfa',
      'Aseguradora Beta',
      'Aseguradora Gamma',
    ],
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-black/90 rounded-2xl shadow-xl border border-gray-800 p-8 flex flex-col gap-6 text-white">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center text-2xl font-bold text-white select-none">
          {user?.nombre
            ? user.nombre.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]?.toUpperCase() || '').join('')
            : 'US'}
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-semibold leading-tight">{datosIngreso.nombre}</span>
          <span className="text-gray-400 text-sm font-medium">{datosIngreso.rol.charAt(0).toUpperCase() + datosIngreso.rol.slice(1).toLowerCase()}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 text-base">
        <div className="flex justify-between border-b border-gray-800 pb-2">
          <span className="text-gray-400">Usuario:</span>
          <span className="font-medium">{datosIngreso.usuario}</span>
        </div>
        <div className="flex justify-between border-b border-gray-800 pb-2">
          <span className="text-gray-400">Correo:</span>
          <span className="font-medium">{datosIngreso.email}</span>
        </div>
        <div className="flex justify-between border-b border-gray-800 pb-2">
          <span className="text-gray-400">Último acceso:</span>
          <span className="font-medium">{datosIngreso.ultimoAcceso}</span>
        </div>
        <div className="flex flex-col gap-1 pt-2">
          <span className="text-gray-400 mb-1">Aseguradoras asignadas:</span>
          <ul className="flex flex-wrap gap-2">
            {datosIngreso.aseguradoras.map(a => (
              <li key={a} className="bg-gray-800 text-gray-200 px-3 py-1 rounded-full text-xs font-medium">
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
