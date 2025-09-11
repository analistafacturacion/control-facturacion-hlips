# GUÍA COMPLETA PARA RENDER DEPLOYMENT

## 🚀 CONFIGURACIÓN EN RENDER

### 1️⃣ CREAR CUENTA
- Ir a: https://render.com
- Sign up with GitHub
- Autorizar Render para acceder a repositorios

### 2️⃣ CREAR BASE DE DATOS POSTGRESQL
1. En Dashboard de Render: "New +"
2. Seleccionar: "PostgreSQL"
3. Configurar:
   - Name: `control-facturacion-db`
   - Database: `control_usuarios`
   - User: `postgres`
   - Region: Oregon (US West)
   - Plan: Free (100MB para empezar)

### 3️⃣ CREAR WEB SERVICE (BACKEND)
1. "New +" → "Web Service"
2. Conectar repositorio: `control-facturacion-hlips`
3. Configurar:
   - Name: `control-facturacion-backend`
   - Region: Oregon (US West)
   - Branch: `main`
   - Root Directory: `apps/backend`
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free

### 4️⃣ VARIABLES DE ENTORNO BACKEND
En el Web Service, tab "Environment":
```
NODE_ENV=production
PORT=3001
DATABASE_URL=[Copiar desde PostgreSQL service]
JWT_SECRET=hlips-control-facturacion-super-secret-2024
PERGAMO_USER=tu-usuario-pergamo@correo.com
PERGAMO_PASS=tu-contraseña-pergamo
```

### 5️⃣ CREAR STATIC SITE (FRONTEND)
1. "New +" → "Static Site"
2. Conectar mismo repositorio: `control-facturacion-hlips`
3. Configurar:
   - Name: `control-facturacion-frontend`
   - Branch: `main`
   - Root Directory: `apps/frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

### 6️⃣ VARIABLES DE ENTORNO FRONTEND
```
VITE_API_BASE_URL=https://control-facturacion-backend.onrender.com/api
```

## 🗄️ MIGRAR BASE DE DATOS

### Obtener cadena de conexión:
1. En PostgreSQL service → "Connect"
2. Copiar: External Database URL

### Ejecutar migración:
```bash
psql "postgresql://usuario:password@host:puerto/database" < maindb.sql
```

## 🌐 URLs FINALES
- Backend: `https://control-facturacion-backend.onrender.com`
- Frontend: `https://control-facturacion-frontend.onrender.com`
- API Health: `https://control-facturacion-backend.onrender.com/api/health`

## ⚠️ NOTAS IMPORTANTES
- Free tier: servicios se "duermen" después de 15 min inactividad
- Para producción: considerar plan pago ($7/mes por servicio)
- Primera carga puede ser lenta (cold start)

## 💰 COSTOS
- **Free**: $0/mes (con limitaciones)
- **Starter**: $7/mes por servicio
- **PostgreSQL**: $7/mes para plan pago
