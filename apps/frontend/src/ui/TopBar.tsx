import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import { useNavigate } from 'react-router-dom';

const navLinks = [
  { to: '/facturacion', label: 'Facturación' },
  { to: '/anulaciones', label: 'Anulaciones' },
  { to: '/radicacion', label: 'Radicación' },
  { to: '/medicamentos', label: 'Medicamentos' },
  { to: '/venta', label: 'Venta' },
  { to: '/control-json', label: 'Gestor CUV' },
];

const userMenuLinks = [
  { to: '/perfil', label: 'Perfil', icon: <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4.5 20c0-3.5 3.5-6 7.5-6s7.5 2.5 7.5 6" strokeLinecap="round" /></svg> },
  { to: '/usuarios', label: 'Usuarios', icon: <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="7.5" cy="8" r="3" /><circle cx="16.5" cy="8" r="3" /><path d="M2 20c0-2.5 4-4.5 10-4.5s10 2 10 4.5" strokeLinecap="round" /></svg> },
  { to: '/configuracion', label: 'Configuración', icon: <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2" /><path d="M19.4 15.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1.1 1.6V22a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1.1H2a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3c.6-.3 1.1-.9 1.1-1.6V2a2 2 0 0 1 4 0v.1c0 .7.5 1.3 1.1 1.6a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9c.3.6.9 1.1 1.6 1.1H22a2 2 0 0 1 0 4h-.1c-.7 0-1.3.5-1.6 1.1z" strokeLinecap="round" /></svg> },
  { to: '/logout', label: 'Cerrar sesión', isLogout: true, icon: <svg className="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M16 17l5-5m0 0l-5-5m5 5H9" strokeLinecap="round" /><path d="M4 4v16a2 2 0 0 0 2 2h6" strokeLinecap="round" /></svg> },
];

export default function TopBar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
    } else {
      document.removeEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
  <header className="fixed top-0 inset-x-0 h-20 shadow-lg z-50 border-b bg-[#002c50]" style={{ borderColor: '#001a2e' }}>
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="inline-flex items-center justify-center h-11 w-11">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Marco principal - forma hexagonal moderna */}
              <path d="M9 4.5L21 4.5C22.24 4.5 23.5 5.26 24 6.5L24 23.5C23.5 24.74 22.24 25.5 21 25.5L9 25.5C7.76 25.5 6.5 24.74 6 23.5L6 6.5C6.5 5.26 7.76 4.5 9 4.5Z" stroke="#fff" strokeWidth="1.5" fill="none" />
              
              {/* Elemento central - gráfico de barras estilizado */}
              <rect x="10" y="17" width="2" height="6" rx="1" fill="#fff" />
              <rect x="13" y="14" width="2" height="9" rx="1" fill="#fff" />
              <rect x="16" y="11" width="2" height="12" rx="1" fill="#fff" />
              <rect x="19" y="15" width="2" height="8" rx="1" fill="#fff" />
              
              {/* Línea de tendencia sutil */}
              <path d="M11 18L14 15L17 12L20 16" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.6" />
              
              {/* Pequeño indicador de control en esquina */}
              <circle cx="22" cy="8" r="1.5" fill="#fff" />
            </svg>
          </span>
          <span className="text-xl font-bold tracking-tight text-white select-none">Control Facturación</span>
        </div>

        {/* Desktop nav: ocupa el ancho disponible y centra los links */}
        <nav className="hidden md:flex md:items-center md:justify-center md:flex-1">
          <div className="w-full max-w-3xl flex items-center justify-center gap-6">
            {navLinks.map(link => {
              const active = pathname === link.to || (link.to !== '/' && pathname.startsWith(link.to));
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={
                    'relative px-2 py-1 text-base font-medium transition-colors duration-150 ' +
                    (active
                      ? 'text-white after:absolute after:left-0 after:-bottom-0.5 after:w-full after:h-0.5 after:bg-white after:rounded-full after:scale-x-100 after:transition-transform after:duration-300'
                      : 'text-gray-300 hover:text-white after:absolute after:left-0 after:-bottom-0.5 after:w-full after:h-0.5 after:bg-white after:rounded-full after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform after:duration-300')
                  }
                  style={{ textDecoration: 'none' }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Mobile: hamburguesa */}
        <div className="md:hidden ml-auto">
          <button
            onClick={() => setOpen(v => !v)}
            aria-label="Abrir menú"
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-200 hover:text-white hover:bg-[#01324d]/50 focus:outline-none"
          >
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>

        {/* Espacio para separar del área de usuario */}
        <div className="hidden md:block md:ml-4 md:flex-shrink-0" />

        {/* Mobile menu panel */}
        {open && (
          <div className="absolute top-20 left-0 right-0 bg-[#002c50] border-t" style={{ borderColor: '#001a2e' }}>
            <div className="px-4 py-4 flex flex-col gap-2">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to} className="text-gray-200 py-2 px-2 rounded hover:bg-[#01324d]" onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
  <div className="flex items-center gap-2 ml-6 relative flex-shrink-0" ref={menuRef}>
          <button
            className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-white/30"
            onClick={() => setOpen(v => !v)}
            aria-label="Menú de usuario"
            tabIndex={0}
          >
            {user && user.nombre ? (
              <span className="text-white font-bold text-base select-none tracking-wide">
                {user.nombre
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map(n => n[0]?.toUpperCase() || '')
                  .join('')}
              </span>
            ) : (
              <span className="text-white font-bold text-base select-none">US</span>
            )}
          </button>
          {user && (
            <div className="flex flex-col items-start justify-center ml-2 select-none">
              <span className="text-white text-sm font-semibold leading-tight max-w-[120px] truncate" title={user.nombre}>{user.nombre}</span>
              <span className="text-gray-400 text-xs font-normal leading-tight max-w-[120px] truncate" title={user.rol}>{user.rol.charAt(0).toUpperCase() + user.rol.slice(1).toLowerCase()}</span>
            </div>
          )}
          {open && (
            <div className="absolute right-[-2px] top-[54px] min-w-[143px] rounded-b-xl shadow-md py-2 z-50 animate-fadein flex flex-col gap-0.5 border-x border-b" style={{ backgroundColor: '#002c50', borderColor: '#001a2e' }}>
              <div className="flex flex-col gap-0.5 mt-1">
                {userMenuLinks.map(link =>
                  link.isLogout ? (
                    <button
                      key={link.to}
                      onClick={() => {
                        setOpen(false);
                        logout();
                        navigate('/login', { replace: true });
                      }}
                      className="flex items-center w-full text-left px-4 py-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors duration-100 rounded-md gap-2"
                      style={{ background: 'none', border: 'none' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e3a5f'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span className="opacity-70">{link.icon}</span>
                      <span>{link.label}</span>
                    </button>
                  ) : (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="flex items-center px-4 py-2 text-gray-200 hover:text-white text-sm font-medium transition-colors duration-100 rounded-md gap-2"
                      onClick={() => setOpen(false)}
                      style={{ textDecoration: 'none' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e3a5f'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span className="opacity-70">{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  )
                )}
              </div>
            </div>
          )}
          <style>{`
            @keyframes fadein { from { opacity: 0; transform: translateY(-8px);} to { opacity: 1; transform: none; } }
            .animate-fadein { animation: fadein 0.18s cubic-bezier(.36,.07,.19,.97) both; }
          `}</style>
        </div>
      </div>
    </header>
  );
}