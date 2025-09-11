# 🚀 Migración de Base de Datos - Guía Paso a Paso

## 🎯 Objetivo
Migrar los datos de `maindb.sql` a la base de datos PostgreSQL en Render.

## 📋 Método 1: Migración Manual (Recomendado)

### Paso 1: Obtener Credenciales de Render

1. **Ve a tu Dashboard de Render**: https://dashboard.render.com
2. **Click en tu servicio**: "control-facturacion-hlips"
3. **Ve a Environment** y busca las variables que empiecen con `DATABASE_`

**O también puedes:**
- Ir a la sección **PostgreSQL** en tu dashboard
- Click en **Info** para ver las credenciales

### Credenciales que necesitas:
```
Host: dpg-xxxxx-a.oregon-postgres.render.com
Port: 5432
Database: control_facturacion_xxxxx
Username: control_facturacion_xxxxx_user
Password: xxxxxxxxxxxxxxxxxxxxxxxxx
```

### Paso 2: Herramientas de Conexión

**Opción A: pgAdmin (Interfaz Gráfica)**
1. Descarga pgAdmin: https://www.pgadmin.org/download/
2. Crea una nueva conexión con las credenciales de Render
3. Haz click derecho en la base de datos → Restore
4. Selecciona el archivo `maindb.sql`

**Opción B: psql (Línea de comandos)**
```bash
# Si tienes PostgreSQL instalado localmente
psql -h TU_HOST -p 5432 -U TU_USERNAME -d TU_DATABASE < maindb.sql
```

**Opción C: Herramienta Online**
- Usar herramientas como DBeaver (gratis)
- Conectar con las credenciales de Render
- Ejecutar el script SQL

## 📋 Método 2: Script Automatizado

He creado un script simple que puedes usar:

### Paso 1: Crear archivo de credenciales
Crea un archivo `.env` en la carpeta `apps/backend/`:

```env
# Credenciales de Render PostgreSQL
POSTGRES_HOST=dpg-xxxxx-a.oregon-postgres.render.com
POSTGRES_PORT=5432
POSTGRES_DB=control_facturacion_xxxxx
POSTGRES_USER=control_facturacion_xxxxx_user
POSTGRES_PASSWORD=xxxxxxxxxxxxxxxxxxxxxxxxx
```

### Paso 2: Ejecutar migración
```bash
cd apps/backend
npm install
npm run migrate
```

## 🔍 Verificar la Migración

### 1. Health Check de la API
```
https://control-facturacion-hlips.onrender.com/api/health
```

### 2. Verificar usuarios
```
https://control-facturacion-hlips.onrender.com/api/users
```

### 3. Probar el frontend
```
https://analistafacturacion.github.io/control-facturacion-hlips/
```

## 🚨 Consideraciones Importantes

### ⚠️ Antes de migrar:
- Render puede tener datos de prueba ya creados
- La migración sobrescribirá los datos existentes
- Haz un backup si hay datos importantes en Render

### ✅ Después de migrar:
- Verifica que el login funciona
- Prueba cargar eventos de facturación
- Confirma que las anulaciones se muestran correctamente

## 📞 Ayuda

Si encuentras problemas:

1. **Error de conexión**: Verifica las credenciales
2. **Error de permisos**: Confirma que el usuario tiene permisos de escritura
3. **Error de SSL**: Render requiere conexiones SSL

---

**¿Por cuál método quieres empezar?** Te ayudo con las credenciales o con la instalación de herramientas.
