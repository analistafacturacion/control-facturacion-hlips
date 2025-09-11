# 🚀 Migración de Base de Datos a Render

## ⚠️ IMPORTANTE: Preparación de Credenciales

Antes de ejecutar la migración, necesitas obtener las credenciales de la base de datos PostgreSQL en Render:

### 1. Obtener Credenciales de Render

1. Ve a tu dashboard de Render: https://dashboard.render.com
2. Click en tu servicio "control-facturacion-hlips"
3. Ve a la pestaña **"Environment"**
4. Busca las variables que empiecen con `DATABASE_` o `POSTGRES_`

O ve a la pestaña **"PostgreSQL"** si tienes una base de datos separada.

### 2. Credenciales que necesitas:

```
POSTGRES_HOST=dpg-xxxxxxxxx-a.oregon-postgres.render.com
POSTGRES_PORT=5432
POSTGRES_DB=control_facturacion_xxxx
POSTGRES_USER=control_facturacion_xxxx_user
POSTGRES_PASSWORD=xxxxxxxxxxxxxxxxxxxxxxxx
```

## 🔧 Métodos de Migración

### Método 1: Restaurar desde maindb.sql (Recomendado)

```bash
# Usando psql (requiere PostgreSQL instalado localmente)
psql -h POSTGRES_HOST -p 5432 -U POSTGRES_USER -d POSTGRES_DB < maindb.sql
```

### Método 2: Script automatizado con Node.js

He creado un script que puedes ejecutar:

```bash
cd apps/backend
npm run migrate:data
```

### Método 3: Panel de administración de Render

1. Ve a tu base de datos en Render
2. Usa el "Connect" para obtener una URL de conexión
3. Usa herramientas como pgAdmin o DBeaver

## 📋 Pasos Detallados

### Paso 1: Configurar variables de entorno
Crea un archivo `.env.migration` en la raíz del proyecto:

```env
POSTGRES_HOST=tu_host_de_render
POSTGRES_PORT=5432
POSTGRES_DB=tu_base_de_datos
POSTGRES_USER=tu_usuario
POSTGRES_PASSWORD=tu_password
```

### Paso 2: Ejecutar migración
```bash
npm run migrate:production
```

## 🔍 Verificar Migración

Después de la migración, verifica:

1. **API Health Check**: https://control-facturacion-hlips.onrender.com/api/health
2. **Usuarios**: https://control-facturacion-hlips.onrender.com/api/users
3. **Frontend**: https://analistafacturacion.github.io/control-facturacion-hlips/

## 🚨 Backup de Seguridad

Antes de migrar, Render automáticamente hace backup, pero puedes:

1. Exportar datos actuales de Render (si los hay)
2. Guardar una copia de maindb.sql

---

**¿Tienes las credenciales de Render listas?** Te ayudo a configurar el método que prefieras.
