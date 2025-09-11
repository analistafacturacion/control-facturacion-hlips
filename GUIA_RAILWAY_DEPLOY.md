# 🚀 GUÍA COMPLETA DE DESPLIEGUE EN RAILWAY

## ✅ PREPARACIÓN COMPLETADA

He preparado tu proyecto para desplegarse en Railway. Ahora sigue estos pasos:

## 📋 PASO 1: CREAR CUENTA EN RAILWAY

1. **Ir a Railway**: https://railway.app
2. **Registrarse** con GitHub (recomendado)
3. **Verificar tu email**

## 📋 PASO 2: SUBIR TU CÓDIGO A GITHUB

### Opción A: Crear repositorio nuevo (Recomendado)
```bash
# Ir a tu proyecto
cd "C:\Users\benav\OneDrive\Documentos\Health & Life IPS\3. Programas\1. Control Facturación"

# Inicializar git
git init

# Agregar archivos
git add .

# Commit inicial
git commit -m "Configuración inicial para Railway"

# Crear repositorio en GitHub y conectarlo
git branch -M main
git remote add origin https://github.com/TU-USUARIO/control-facturacion.git
git push -u origin main
```

### Opción B: Usar el repositorio existente (si ya tienes uno)
```bash
git add .
git commit -m "Configuración para Railway"
git push
```

## 📋 PASO 3: DESPLEGAR EN RAILWAY

### 3.1 Backend (API)
1. **En Railway Dashboard**:
   - Click "New Project"
   - Seleccionar "Deploy from GitHub repo"
   - Elegir tu repositorio
   - Railway detectará automáticamente tu proyecto Node.js

2. **Configurar variables de entorno**:
   - Ir a la pestaña "Variables"
   - Agregar estas variables:
   
   ```
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=tu-jwt-secret-super-seguro-para-produccion-2024
   PERGAMO_USER=tu-usuario-pergamo@correo.com
   PERGAMO_PASS=tu-contraseña-pergamo
   ```

3. **Conectar base de datos**:
   - Click "+ Add Service"
   - Seleccionar "PostgreSQL"
   - Railway creará automáticamente la base de datos
   - Las variables DATABASE_URL, PGHOST, etc. se crean automáticamente

### 3.2 Frontend (React)
1. **Crear segundo servicio**:
   - Click "+ Add Service" 
   - Seleccionar "Deploy from GitHub repo"
   - Mismo repositorio pero configurar como Frontend
   
2. **Configurar Root Directory**:
   - Ir a Settings → "Root Directory" 
   - Poner: `apps/frontend`
   
3. **Configurar Build Command**:
   - En Settings → "Build Command"
   - Poner: `npm run build`
   
4. **Configurar Start Command**:
   - En Settings → "Start Command"  
   - Poner: `npm run start`

5. **Variables de entorno Frontend**:
   ```
   NODE_ENV=production
   VITE_API_BASE_URL=https://TU-BACKEND-URL.up.railway.app/api
   ```

## 📋 PASO 4: MIGRAR BASE DE DATOS

1. **Obtener URL de conexión**:
   - En el servicio PostgreSQL → Variables
   - Copiar DATABASE_URL

2. **Ejecutar migración** (desde tu PC):
   ```bash
   # Instalar psql si no lo tienes
   # En Windows: descargar desde https://www.postgresql.org/download/windows/
   
   # Conectar y crear estructura
   psql "postgresql://usuario:password@host:puerto/database" < maindb.sql
   ```

   O usar el script que creé:
   ```bash
   chmod +x migrate.sh
   DATABASE_URL="tu-database-url-de-railway" ./migrate.sh
   ```

## 📋 PASO 5: CONFIGURAR DOMINIOS (Opcional)

1. **Backend**: Railway te dará una URL como `https://tu-backend.up.railway.app`
2. **Frontend**: Railway te dará una URL como `https://tu-frontend.up.railway.app`
3. **Dominio propio** (opcional): Puedes configurar tu propio dominio

## 📋 PASO 6: PROBAR LA APLICACIÓN

1. **Verificar Backend**: 
   - Ir a `https://tu-backend.up.railway.app/api/health`
   - Debe responder: `{"status": "ok"}`

2. **Verificar Frontend**:
   - Ir a `https://tu-frontend.up.railway.app`
   - Debe cargar la aplicación

3. **Probar Login**:
   - Usuario: `admin`
   - Contraseña: `password` (por defecto)

## 💰 COSTOS APROXIMADOS

- **PostgreSQL**: $5/mes
- **Backend Service**: $5-10/mes  
- **Frontend Service**: $0-5/mes
- **TOTAL**: ~$10-20/mes

## 🛠️ ARCHIVOS IMPORTANTES CREADOS

- ✅ `railway.json` - Configuración principal
- ✅ `nixpacks.toml` - Configuración build backend
- ✅ `nixpacks-frontend.toml` - Configuración build frontend  
- ✅ `apps/backend/.env.production` - Variables backend
- ✅ `apps/frontend/.env.production` - Variables frontend
- ✅ `migrate.sh` - Script migración BD

## 🆘 SOLUCIÓN DE PROBLEMAS

### Backend no inicia:
1. Verificar variables de entorno
2. Revisar logs en Railway Dashboard
3. Verificar conexión a base de datos

### Frontend no conecta al Backend:
1. Verificar VITE_API_BASE_URL
2. Verificar CORS en backend
3. Verificar que ambos servicios estén running

### Base de datos vacía:
1. Ejecutar migración con maindb.sql
2. Verificar que las tablas se crearon
3. Insertar datos iniciales si es necesario

## 📞 CONTACTO

Si tienes problemas:
1. Revisar logs en Railway Dashboard
2. Verificar que todas las variables estén configuradas
3. Probar conexiones individualmente

¡Tu aplicación estará lista en 15-30 minutos! 🚀
