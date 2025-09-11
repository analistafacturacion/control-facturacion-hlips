# 🚀 CONTROL DE FACTURACIÓN - DESPLIEGUE EN RAILWAY

## ✅ PREPARACIÓN COMPLETADA

Tu proyecto está **100% listo** para desplegarse en Railway. Todos los archivos de configuración han sido creados.

## 🎯 COSTO ESTIMADO: $10-15/mes

## 📋 INICIO RÁPIDO (5 MINUTOS)

### 1️⃣ Ejecutar configuración automática
```powershell
# En Windows PowerShell
PowerShell -ExecutionPolicy Bypass -File setup-railway.ps1
```

### 2️⃣ Crear repositorio en GitHub
1. Ir a https://github.com/new
2. Crear repositorio público
3. Copiar la URL

### 3️⃣ Subir código
```bash
git remote add origin https://github.com/TU-USUARIO/control-facturacion.git
git branch -M main
git push -u origin main
```

### 4️⃣ Desplegar en Railway
1. Ir a https://railway.app
2. Registrarse con GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Seleccionar tu repositorio

## 🔧 SERVICIOS A CREAR

### Backend (API)
- **Detectado automáticamente** como Node.js
- **Puerto**: 3001
- **Variables requeridas**:
  ```
  NODE_ENV=production
  JWT_SECRET=tu-jwt-secret-super-seguro-2024
  PERGAMO_USER=tu-usuario@correo.com
  PERGAMO_PASS=tu-contraseña
  ```

### PostgreSQL
- **Agregar servicio**: PostgreSQL
- **Configuración**: Automática
- **Variables**: Se crean automáticamente

### Frontend (React)
- **Segundo servicio** del mismo repo
- **Build**: `npm --workspace apps/frontend run build`
- **Start**: `npm --workspace apps/frontend run start`
- **Variables**:
  ```
  VITE_API_BASE_URL=https://tu-backend.up.railway.app/api
  ```

## 📊 MIGRACIÓN DE DATOS

### Opción A: Automática (Recomendada)
```bash
# Railway ejecutará migrate.sh automáticamente
# Si no funciona, usar Opción B
```

### Opción B: Manual
```bash
# Conectar a la BD de Railway y ejecutar:
psql "postgresql://usuario:pass@host:puerto/db" < maindb.sql
```

## 🌐 URLs FINALES

- **Backend**: `https://tu-backend.up.railway.app`
- **Frontend**: `https://tu-frontend.up.railway.app`
- **API Health**: `https://tu-backend.up.railway.app/api/health`

## ✅ VERIFICACIÓN

1. ✅ Backend responde en `/api/health`
2. ✅ Frontend carga correctamente
3. ✅ Login funciona (admin/password)
4. ✅ Datos se muestran correctamente

## 📁 ARCHIVOS CREADOS

- ✅ `railway.json` - Configuración Railway
- ✅ `nixpacks.toml` - Build backend
- ✅ `nixpacks-frontend.toml` - Build frontend
- ✅ `.env.production` - Variables de entorno
- ✅ `migrate.sh` - Migración BD
- ✅ `setup-railway.ps1` - Setup automático

## 🆘 SOPORTE

### Problemas comunes:
1. **Backend no inicia**: Verificar variables de entorno
2. **BD vacía**: Ejecutar migración manual
3. **Frontend no conecta**: Verificar VITE_API_BASE_URL
4. **CORS Error**: Verificar FRONTEND_URL en backend

### Logs:
- Ver logs en Railway Dashboard
- Backend logs: Errores de conexión DB
- Frontend logs: Errores de build

## 📞 CONTACTO

Si necesitas ayuda:
1. Revisar `GUIA_RAILWAY_DEPLOY.md` (guía completa)
2. Verificar variables de entorno
3. Comprobar que todos los servicios estén running

---

## 🎉 ¡LISTO!

Tu aplicación de **Control de Facturación** estará funcionando en internet en **15-30 minutos** por solo **$10-15/mes**.

### Características en producción:
- ✅ **SSL automático** (HTTPS)
- ✅ **Escalado automático**
- ✅ **Backups automáticos** de BD
- ✅ **Deploy automático** desde GitHub
- ✅ **Monitoreo incluido**

**¡Perfecto para una IPS que necesita un sistema confiable y económico!** 🚀
