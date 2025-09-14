import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './auth'

export default function RequireAuth() {
  const { token } = useAuth()
  const location = useLocation()
  
  // Si no hay token, redirige a login
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  
  return <Outlet />
}
