# 🚨 Gestión de Duplicados en Facturación

## ⚠️ PROBLEMA IDENTIFICADO
Se han detectado facturas duplicadas en la base de datos durante el último mes. Esto puede causar:
- Sobrefacturación
- Problemas de reportes
- Inconsistencias en los datos

## 🔍 HERRAMIENTAS DISPONIBLES

### 1. Detectar Duplicados

**Endpoint:** `GET /api/migration/detect-duplicates`
```bash
curl https://control-facturacion-hlips.onrender.com/api/migration/detect-duplicates
```

**Script PowerShell:**
```powershell
.\manage-duplicates.ps1 -Action detect
```

### 2. Eliminar Duplicados Específicos

**Endpoint:** `POST /api/migration/remove-duplicates`
```bash
curl -X POST https://control-facturacion-hlips.onrender.com/api/migration/remove-duplicates \
  -H "Content-Type: application/json" \
  -d '{"numeroFactura": "FAC123456"}'
```

**Script PowerShell:**
```powershell
.\manage-duplicates.ps1 -Action remove-specific -NumeroFactura "FAC123456"
```

### 3. Eliminar TODOS los Duplicados

**⚠️ CUIDADO: Esta operación es irreversible**

**Endpoint:** `POST /api/migration/remove-all-duplicates`
```bash
curl -X POST https://control-facturacion-hlips.onrender.com/api/migration/remove-all-duplicates
```

**Script PowerShell:**
```powershell
.\manage-duplicates.ps1 -Action remove-all
```

## 📋 PROCESO RECOMENDADO

### Paso 1: Detectar
```powershell
.\manage-duplicates.ps1 -Action detect
```

### Paso 2: Revisar Resultados
- Revisar la cantidad de duplicados
- Identificar patrones
- Decidir estrategia de limpieza

### Paso 3: Crear Respaldo (Recomendado)
Antes de eliminar duplicados, crear un respaldo de la tabla:
```sql
CREATE TABLE facturacion_evento_backup AS 
SELECT * FROM facturacion_evento 
WHERE fecha >= CURRENT_DATE - INTERVAL '60 days';
```

### Paso 4: Eliminar Duplicados
**Opción A - Eliminar específicos:**
```powershell
.\manage-duplicates.ps1 -Action remove-specific -NumeroFactura "NUMERO_FACTURA"
```

**Opción B - Eliminar todos:**
```powershell
.\manage-duplicates.ps1 -Action remove-all
```

## 🛡️ CRITERIOS DE ELIMINACIÓN

### Lo que se conserva:
- **Registro más reciente** (ID más alto)
- **Un registro por número de factura**

### Lo que se elimina:
- Registros duplicados más antiguos
- Múltiples entradas con el mismo número de factura

## 📊 TIPOS DE DUPLICADOS DETECTADOS

1. **Por Número de Factura:** Misma factura registrada múltiples veces
2. **Por Combinación de Campos:** Mismo número, fecha, valor y aseguradora
3. **Duplicados Recientes:** Creados en los últimos 30 días

## 🚨 ACCIONES DE EMERGENCIA

### Si necesitas eliminar duplicados INMEDIATAMENTE:
```powershell
# 1. Detectar primero
.\manage-duplicates.ps1 -Action detect

# 2. Si hay muchos duplicados recientes, eliminar todos
.\manage-duplicates.ps1 -Action remove-all
```

### Verificar después de la limpieza:
```powershell
.\manage-duplicates.ps1 -Action detect
```

## 🔧 PREVENCIÓN FUTURA

### Agregar validaciones en el frontend:
- Verificar si una factura ya existe antes de crear
- Implementar confirmación para facturas similares
- Agregar timestamp de última modificación

### Mejorar la base de datos:
- Agregar constraint UNIQUE en número de factura
- Implementar triggers de validación
- Crear índices para mejorar detección

## 📞 CONTACTO DE EMERGENCIA
Si algo sale mal durante la limpieza:
1. Detener el proceso inmediatamente
2. Restaurar desde respaldo si es necesario
3. Revisar logs del servidor
4. Contactar al equipo técnico

## 🏃‍♂️ PASOS RÁPIDOS
```powershell
# Detección rápida
.\manage-duplicates.ps1

# Limpieza completa (CUIDADO)
.\manage-duplicates.ps1 -Action remove-all

# Verificación post-limpieza
.\manage-duplicates.ps1
```
