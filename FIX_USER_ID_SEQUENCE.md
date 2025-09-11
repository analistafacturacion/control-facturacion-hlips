# 🔧 Fix para Error de Secuencia ID en Tabla User

## 🚨 Problema
El error `null value in column "id" of relation "user" violates not-null constraint` indica que la tabla `user` no tiene configurada correctamente la secuencia AUTO_INCREMENT para el campo ID.

## 🎯 Solución

### Opción 1: Usar Endpoint de Migración (Recomendado)

1. **Hacer POST request al endpoint de migración:**
   ```
   POST https://control-facturacion-hlips.onrender.com/api/migration/fix-user-sequence
   ```

2. **Usar curl o Postman:**
   ```bash
   curl -X POST https://control-facturacion-hlips.onrender.com/api/migration/fix-user-sequence
   ```

3. **Verificar respuesta exitosa:**
   ```json
   {
     "success": true,
     "message": "Secuencia de ID arreglada exitosamente",
     "configuration": {
       "column_name": "id",
       "column_default": "nextval('user_id_seq'::regclass)",
       "is_nullable": "NO",
       "data_type": "integer"
     }
   }
   ```

### Opción 2: Ejecutar SQL Manualmente

Si tienes acceso directo a la base de datos PostgreSQL:

```sql
-- 1. Crear la secuencia si no existe
CREATE SEQUENCE IF NOT EXISTS user_id_seq;

-- 2. Establecer el valor actual de la secuencia
SELECT setval('user_id_seq', COALESCE((SELECT MAX(id) FROM "user"), 0) + 1, false);

-- 3. Alterar la tabla para usar la secuencia
ALTER TABLE "user" ALTER COLUMN id SET DEFAULT nextval('user_id_seq');

-- 4. Establecer la secuencia como propiedad de la columna
ALTER SEQUENCE user_id_seq OWNED BY "user".id;
```

### Opción 3: Usar Script PowerShell

```powershell
# Ejecutar en tu terminal local
.\fix-user-sequence.ps1 -DatabaseUrl "tu-url-de-base-de-datos"
```

## 📋 Pasos para Implementar

1. **Hacer commit y push de los cambios:**
   ```bash
   git add .
   git commit -m "Fix: Agregar endpoint para corregir secuencia ID de tabla user"
   git push origin main
   ```

2. **Esperar que se despliegue en Render** (aprox. 2-3 minutos)

3. **Ejecutar la corrección** usando la Opción 1

4. **Intentar crear usuario nuevamente**

## 🔍 Verificación

Después de aplicar la corrección, el campo `id` debería tener:
- `column_default: "nextval('user_id_seq'::regclass)"`
- `is_nullable: "NO"`
- `data_type: "integer"`

## 🎉 Resultado

Una vez corregido, podrás crear usuarios sin especificar el ID y se generará automáticamente.
