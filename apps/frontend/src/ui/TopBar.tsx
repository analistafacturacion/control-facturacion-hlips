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
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  // resolve public assets with Vite base URL so the app works on subpaths (GitHub Pages, etc.)
  const logoSrc = `${(import.meta as any).env?.BASE_URL || '/'}logo.png`;

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

  // close mobile menu when clicking outside
  useEffect(() => {
    function handleMobileClick(e: MouseEvent) {
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    if (mobileOpen) document.addEventListener('mousedown', handleMobileClick);
    else document.removeEventListener('mousedown', handleMobileClick);
    return () => document.removeEventListener('mousedown', handleMobileClick);
  }, [mobileOpen]);

  return (
    <header className="fixed top-0 inset-x-0 h-20 shadow-lg z-50 border-b" style={{ backgroundColor: '#002c50', borderColor: '#001a2e' }}>
      <div className="relative h-full">
        {/* Left: Title */}
        <div className="absolute left-8 top-0 bottom-0 flex items-center pl-3 md:pl-4 lg:pl-6">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="Innova360" className="h-8 w-auto" />
            <span className="text-xl font-bold tracking-tight text-white select-none brand-title">Innova360</span>
          </div>
        </div>

        {/* Right group: nav + separator + user */}
        <div className="absolute right-8 top-0 bottom-0 flex items-center pr-3 md:pr-4 lg:pr-6" ref={menuRef}>
          {/* Mobile: hamburger that contains all nav links */}
          <div className="flex md:hidden items-center gap-3 mr-3">
            <div className="relative" ref={mobileRef}>
              <button
                onClick={() => setMobileOpen(v => !v)}
                aria-label="Abrir menú móvil"
                className="ml-2 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              {mobileOpen && (
                <div className="absolute right-0 top-full mt-2 min-w-[160px] rounded-b-xl shadow-md py-2 z-50 animate-fadein flex flex-col gap-0.5 border-x border-b" style={{ backgroundColor: '#002c50', borderColor: '#001a2e' }}>
                  {navLinks.map(link => (
                    <Link key={link.to} to={link.to} className="px-4 py-2 text-sm text-gray-200 hover:text-white" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 mr-6 pointer-events-auto">
            {navLinks.map(link => {
              const active = pathname === link.to || (link.to !== '/' && pathname.startsWith(link.to));
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={
                    'relative px-1 py-1 text-base font-medium transition-colors duration-150 ' +
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
          {/* Separador vertical (visible en mobile and desktop) - reduced margins */}
          <div className="h-7 w-px bg-white mx-2 md:mx-3 lg:mx-4" />
          <div className="flex items-center gap-2 ml-4 md:ml-6 lg:ml-8 relative">
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
              <div className="hidden sm:flex flex-col items-start justify-center ml-2 select-none">
                <span className="text-white text-sm font-semibold leading-tight max-w-[120px] truncate" title={user.nombre}>{user.nombre}</span>
                <span className="text-gray-400 text-xs font-normal leading-tight max-w-[120px] truncate" title={user.rol}>{user.rol.charAt(0).toUpperCase() + user.rol.slice(1).toLowerCase()}</span>
              </div>
            )}

            {open && (
              <div className="absolute left-0 top-full mt-2 min-w-[160px] rounded-b-xl shadow-md py-2 z-50 animate-fadein flex flex-col gap-0.5 border-x border-b transform -translate-x-4 -translate-y-1" style={{ backgroundColor: '#002c50', borderColor: '#001a2e' }}>
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
          </div>
          <style>{`
            @keyframes fadein { from { opacity: 0; transform: translateY(-8px);} to { opacity: 1; transform: none; } }
            .animate-fadein { animation: fadein 0.18s cubic-bezier(.36,.07,.19,.97) both; }
          `}</style>
        </div>
      </div>
    </header>
  );
}