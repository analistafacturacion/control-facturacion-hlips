# GUÍA COMPLETA DE EXPORTACIÓN DE BASE DE DATOS
# Para el proyecto Control Facturación

## SITUACIÓN ACTUAL
- ❌ PostgreSQL no se encuentra en el PATH del sistema
- ❌ No hay servicios de PostgreSQL ejecutándose
- ❌ No se detectaron procesos de PostgreSQL
- ✅ Tu aplicación funciona correctamente (probablemente usa PostgreSQL)

## OPCIONES DISPONIBLES

### OPCIÓN 1: ENCONTRAR POSTGRESQL EN TU SISTEMA ⭐ RECOMENDADA

1. **Buscar PostgreSQL manualmente:**
   - Ir a `C:\Program Files\PostgreSQL\` o `C:\Program Files (x86)\PostgreSQL\`
   - Buscar carpetas con nombres como: `12`, `13`, `14`, `15`, `16` (versiones)
   - Entrar a la subcarpeta `\bin\`

2. **Una vez encontrada la carpeta bin:**
   ```cmd
   cd "C:\Program Files\PostgreSQL\[VERSION]\bin"
   set PGPASSWORD=Sistemas1234*
   pg_dump -h localhost -p 5432 -U postgres -d control_usuarios > backup.sql
   ```

### OPCIÓN 2: USAR PGADMIN (MÁS FÁCIL) ⭐ RECOMENDADA

1. **Buscar pgAdmin en tu computadora:**
   - Buscar en el menú inicio: "pgAdmin"
   - O buscar en: `C:\Program Files\pgAdmin 4\`

2. **Pasos en pgAdmin:**
   1. Abrir pgAdmin 4
   2. Conectar al servidor PostgreSQL (localhost:5432)
   3. Expandir: Servers > PostgreSQL > Databases
   4. **Clic derecho en 'control_usuarios'**
   5. Seleccionar **"Backup..."**
   6. Configurar:
      - Filename: `control_usuarios_backup`
      - Format: **Custom** (recomendado)
      - Encoding: UTF8
   7. Click **"Backup"**

### OPCIÓN 3: VERIFICAR SI POSTGRESQL ESTÁ INSTALADO

1. **Buscar en Panel de Control:**
   - Panel de Control > Programas y características
   - Buscar "PostgreSQL" en la lista

2. **Buscar en aplicaciones instaladas:**
   - Windows 10/11: Configuración > Aplicaciones
   - Buscar "PostgreSQL"

### OPCIÓN 4: EXPORTAR DESDE TU APLICACIÓN BACKEND

Si tu aplicación funciona, PostgreSQL SÍ está instalado. Podemos crear un script de exportación desde Node.js:

```javascript
// Crear archivo export-db.js
const { execSync } = require('child_process');

// Buscar PostgreSQL en ubicaciones comunes
const locations = [
    'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\13\\bin\\pg_dump.exe',
    'C:\\Program Files (x86)\\PostgreSQL\\16\\bin\\pg_dump.exe',
    'C:\\Program Files (x86)\\PostgreSQL\\15\\bin\\pg_dump.exe'
];

for (let location of locations) {
    try {
        const command = `"${location}" -h localhost -p 5432 -U postgres -d control_usuarios`;
        process.env.PGPASSWORD = 'Sistemas1234*';
        execSync(command + ' > backup.sql');
        console.log('✓ Backup creado exitosamente');
        break;
    } catch (error) {
        console.log(`❌ No encontrado en: ${location}`);
    }
}
```

## PASOS RECOMENDADOS (EN ORDEN):

### 1️⃣ BUSCAR PGADMIN PRIMERO
- Buscar "pgAdmin" en el menú inicio
- Si lo encuentras, usar OPCIÓN 2

### 2️⃣ BUSCAR POSTGRESQL MANUALMENTE
- Buscar en carpetas Program Files
- Si lo encuentras, usar OPCIÓN 1

### 3️⃣ VERIFICAR INSTALACIÓN
- Si no encuentras nada, usar OPCIÓN 3

## ARCHIVOS QUE NECESITAS RESPALDAR:
- Base de datos PostgreSQL: `control_usuarios`
- Tablas principales:
  - `anulacion` (tus datos de anulaciones)
  - `sede` (configuración de sedes)
  - `user` (usuarios del sistema)
  - `facturacion_evento` (eventos de facturación)

## EN EL NUEVO COMPUTADOR:
1. Instalar PostgreSQL (misma versión si es posible)
2. Instalar pgAdmin 4
3. Crear base de datos `control_usuarios`
4. Restaurar el backup

## CONTACTO DE AYUDA:
Si ninguna opción funciona, necesitarás:
1. Verificar cómo funciona tu aplicación actualmente
2. Revisar la configuración de conexión a BD
3. Posiblemente reinstalar PostgreSQL

¿Por cuál opción quieres empezar?
