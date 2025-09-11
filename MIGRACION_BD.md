# 📊 Migración de Base de Datos PostgreSQL - Control de Facturación

## 🎯 Propósito
Este documento te guía para migrar la base de datos PostgreSQL del sistema Control de Facturación de un computador a otro.

## ✅ ESTADO ACTUAL
- [x] **EXPORTACIÓN COMPLETADA**: Se generó el archivo `maindb.sql`
- [ ] **TRANSFERIR**: Copiar archivos al nuevo computador
- [ ] **IMPORTAR**: Restaurar la base de datos en el nuevo computador

## 📋 Requisitos

### En el Computador Origen (actual):
- PostgreSQL instalado y funcionando ✅
- Acceso a la base de datos `control_usuarios` ✅  
- Credenciales: usuario `postgres`, contraseña `Sistemas1234*` ✅
- **Archivo generado**: `maindb.sql` ✅

### En el Computador Destino (nuevo):
- PostgreSQL instalado y configurado
- Mismo usuario y contraseña (recomendado)

## 🚀 Proceso de Migración

### PASO 1: Exportar la Base de Datos (Computador Origen)

#### Opción A: Script Automatizado (RECOMENDADO)
```powershell
# Ejecutar en PowerShell desde la carpeta del proyecto
PowerShell -ExecutionPolicy Bypass -File exportar_bd.ps1
```

#### Opción B: Comandos Manuales
```bash
# Exportación completa (estructura + datos)
pg_dump -h localhost -p 5432 -U postgres -d control_usuarios > control_usuarios_completo.sql

# O exportación en formato custom (más eficiente)
pg_dump -h localhost -p 5432 -U postgres -d control_usuarios -Fc > control_usuarios_completo.dump
```

### PASO 2: Transferir Archivos
Copia los archivos generados al computador destino:
- `control_usuarios_YYYY-MM-DD_HH-mm-ss.sql`
- `control_usuarios_YYYY-MM-DD_HH-mm-ss.dump`

### PASO 3: Importar en el Computador Destino

#### Opción A: Script Automatizado (RECOMENDADO)
```powershell
# Ejecutar en PowerShell desde la carpeta del proyecto
PowerShell -ExecutionPolicy Bypass -File importar_bd.ps1
```

#### Opción B: Comandos Manuales
```bash
# 1. Crear la base de datos
createdb -h localhost -p 5432 -U postgres control_usuarios

# 2a. Importar desde archivo SQL
psql -h localhost -p 5432 -U postgres -d control_usuarios < control_usuarios_completo.sql

# 2b. O importar desde archivo CUSTOM (más rápido)
pg_restore -h localhost -p 5432 -U postgres -d control_usuarios control_usuarios_completo.dump
```

## 📁 Estructura de Archivos Generados

```
Control_facturacion/
├── respaldos/
│   ├── control_usuarios_2025-08-27_14-30-45.sql     # Formato SQL
│   └── control_usuarios_2025-08-27_14-30-45.dump    # Formato Custom
├── exportar_bd.ps1                                   # Script de exportación
├── importar_bd.ps1                                   # Script de importación
└── MIGRACION_BD.md                                   # Este documento
```

## 🔧 Configuración Post-Migración

Después de importar la base de datos, verifica que el archivo `ormconfig.json` en el nuevo computador tenga la configuración correcta:

```json
{
  "type": "postgres",
  "host": "localhost",
  "port": 5432,
  "username": "postgres",
  "password": "Sistemas1234*",
  "database": "control_usuarios",
  "synchronize": true,
  "logging": false,
  "entities": ["src/entity/**/*.ts"]
}
```

## ✅ Verificación

Para verificar que la migración fue exitosa:

1. Conectarse a la base de datos:
```bash
psql -h localhost -p 5432 -U postgres -d control_usuarios
```

2. Verificar las tablas:
```sql
\dt
```

3. Verificar datos en tablas principales:
```sql
SELECT COUNT(*) FROM anulacion;
SELECT COUNT(*) FROM sede;
SELECT COUNT(*) FROM "user";
```

## 🆘 Solución de Problemas

### Error: "pg_dump command not found"
- Asegúrate de que PostgreSQL esté en el PATH del sistema
- En Windows, agrega `C:\Program Files\PostgreSQL\[version]\bin` al PATH

### Error: "database does not exist"
- Verifica que la base de datos `control_usuarios` exista
- Ejecuta `\l` en psql para listar bases de datos

### Error de permisos
- Asegúrate de ejecutar como administrador
- Verifica que el usuario `postgres` tenga los permisos necesarios

### Error de contraseña
- Verifica que la contraseña sea `Sistemas1234*`
- Considera configurar un archivo `.pgpass` para automatizar la autenticación

## 📞 Contacto
Si tienes problemas con la migración, revisa los logs de error y asegúrate de que PostgreSQL esté funcionando correctamente en ambos computadores.

---
*Generado automáticamente para el proyecto Control de Facturación*
