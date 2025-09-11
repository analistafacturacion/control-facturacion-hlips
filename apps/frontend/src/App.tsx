import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import TopBar from './ui/TopBar'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />

  <main className="flex-1 max-w-screen-2xl mx-auto w-full px-12 py-6 pt-16">
        <Outlet />
      </main>
    </div>
  )
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation()
  const active = pathname === to || (to !== '/' && pathname.startsWith(to))
  return (
    <Link
      to={to}
      className={
        'px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ' +
        (active ? 'font-semibold text-blue-600' : 'text-gray-700 dark:text-gray-300')
      }
    >
      {children}
    </Link>
  )
}
