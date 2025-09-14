import React from 'react'
import ReactDOM from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App'
import Facturacion from './pages/Facturacion'
import Configuracion from './pages/Configuracion'
import Perfil from './pages/Perfil'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import GestionUsuarios from './pages/GestionUsuarios'
import RequireAuth from './RequireAuth'
import { AuthProvider } from './auth'
import Anulaciones from './pages/Anulaciones';

// Configuración de basename para GitHub Pages
const basename = process.env.NODE_ENV === 'production' ? '/control-facturacion-hlips' : '';

// Componente de prueba temporal
function TestApp() {
  return <div style={{padding: '20px', fontSize: '24px', color: 'red'}}>¡React funciona! Prueba exitosa.</div>
}

const router = createHashRouter([
  {
    path: '/test',
    element: <TestApp />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    element: <RequireAuth />, // Protege todas las rutas hijas
    children: [
      {
        path: '/',
        element: <App />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'facturacion', element: <Facturacion /> },
          { path: 'anulaciones', element: <Anulaciones /> },
          { path: 'configuracion', element: <Configuracion /> },
          { path: 'usuarios', element: <GestionUsuarios /> },
          { path: 'perfil', element: <Perfil /> },
        ],
      },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
)
