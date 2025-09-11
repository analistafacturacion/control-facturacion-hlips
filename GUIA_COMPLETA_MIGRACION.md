# 🚀 GUÍA COMPLETA DE MIGRACIÓN - Control de Facturación

## ✅ ESTADO ACTUAL
- [x] **EXPORTACIÓN COMPLETADA**: Archivo `maindb.sql` generado exitosamente
- [ ] **TRANSFERIR ARCHIVOS**: Copiar archivos necesarios al nuevo computador
- [ ] **CONFIGURAR NUEVO SISTEMA**: Instalar dependencias en el nuevo PC
- [ ] **IMPORTAR BASE DE DATOS**: Restaurar datos en PostgreSQL
- [ ] **VERIFICAR FUNCIONAMIENTO**: Probar la aplicación

---

## 📦 ARCHIVOS A TRANSFERIR

### 🔥 **CRÍTICOS** (Obligatorios)
```
maindb.sql                           ← Base de datos completa
Control_facturacion/ (toda la carpeta) ← Código de la aplicación
```

### 🔧 **SCRIPTS DE MIGRACIÓN** (Recomendados)
```
importar_mejorado.ps1               ← Script mejorado de importación
MIGRACION_BD.md                     ← Esta guía
GUIA_EXPORTACION.md                 ← Guía de exportación
```

---

## 💻 PASOS EN EL NUEVO COMPUTADOR

### 1️⃣ **INSTALAR PREREQUISITOS**

#### Node.js (OBLIGATORIO)
- Descargar desde: https://nodejs.org/
- Versión recomendada: LTS (18.x o superior)
- Verificar instalación: `node --version`

#### PostgreSQL (OBLIGATORIO)
- Descargar desde: https://www.postgresql.org/download/
- **IMPORTANTE**: Usar mismos credenciales:
  - Usuario: `postgres`
  - Contraseña: `Sistemas1234*`
  - Puerto: `5432`
- Instalar también pgAdmin 4 (recomendado)

#### Git (Opcional pero recomendado)
- Descargar desde: https://git-scm.com/

### 2️⃣ **COPIAR ARCHIVOS**

1. **Crear carpeta destino**:
   ```
   C:\Users\[TU_USUARIO]\OneDrive\Desktop\Control_facturacion\
   ```

2. **Copiar archivos** (usando USB, red, nube, etc.):
   - Toda la carpeta `Control_facturacion`
   - El archivo `maindb.sql`

### 3️⃣ **CONFIGURAR LA APLICACIÓN**

1. **Abrir terminal** en la carpeta del proyecto
2. **Instalar dependencias del proyecto principal**:
   ```bash
   npm install
   ```

3. **Backend** (en apps/backend/):
   ```bash
   cd apps/backend
   npm install
   ```

4. **Frontend** (en apps/frontend/):
   ```bash
   cd apps/frontend
   npm install
   ```

### 4️⃣ **IMPORTAR BASE DE DATOS**

#### **OPCIÓN A: Script Automático** (Recomendado)
```powershell
# En la carpeta principal del proyecto
PowerShell -ExecutionPolicy Bypass -File importar_mejorado.ps1
```

#### **OPCIÓN B: Comandos Manuales**
```bash
# 1. Crear base de datos
createdb -h localhost -p 5432 -U postgres control_usuarios

# 2. Importar datos
psql -h localhost -p 5432 -U postgres -d control_usuarios < maindb.sql
```

#### **OPCIÓN C: Usando pgAdmin** (Más Fácil)
1. Abrir pgAdmin 4
2. Conectar al servidor PostgreSQL
3. Crear base de datos `control_usuarios`
4. Clic derecho → "Restore..."
5. Seleccionar `maindb.sql`

### 5️⃣ **VERIFICAR CONFIGURACIÓN**

1. **Verificar ormconfig.json** (en la raíz y en apps/backend/):
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

2. **Probar conexión a la base de datos**:
   ```bash
   psql -h localhost -p 5432 -U postgres -d control_usuarios -c "SELECT COUNT(*) FROM anulacion;"
   ```

### 6️⃣ **EJECUTAR LA APLICACIÓN**

1. **Iniciar backend**:
   ```bash
   cd apps/backend
   npm run dev
   ```

2. **Iniciar frontend** (en otra terminal):
   ```bash
   cd apps/frontend
   npm run dev
   ```

3. **Acceder a la aplicación**:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000

---

## 🔍 VERIFICACIÓN FINAL

### ✅ Checklist de Funcionamiento
- [ ] PostgreSQL ejecutándose (puerto 5432)
- [ ] Base de datos `control_usuarios` existe
- [ ] Tablas principales tienen datos:
  - `anulacion` (registros de anulaciones)
  - `sede` (sedes configuradas)
  - `user` (usuarios del sistema)
- [ ] Backend arranca sin errores (puerto 3000)
- [ ] Frontend arranca sin errores (puerto 5173)
- [ ] Login funciona correctamente
- [ ] Datos de anulaciones se muestran
- [ ] Sistema de candados funciona

### 🧪 Comandos de Verificación
```sql
-- Conectar a la BD y verificar datos
psql -h localhost -p 5432 -U postgres -d control_usuarios

-- Verificar tablas
\dt

-- Contar registros
SELECT 'anulacion', COUNT(*) FROM anulacion
UNION ALL
SELECT 'sede', COUNT(*) FROM sede
UNION ALL
SELECT 'user', COUNT(*) FROM "user"
UNION ALL
SELECT 'facturacion_evento', COUNT(*) FROM facturacion_evento;
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### ❌ Error: "pg_dump command not found"
**Solución**: Agregar PostgreSQL al PATH de Windows
1. Buscar carpeta: `C:\Program Files\PostgreSQL\[version]\bin`
2. Agregar al PATH del sistema

### ❌ Error: "database does not exist"
**Solución**: Crear la base de datos manualmente
```bash
createdb -h localhost -p 5432 -U postgres control_usuarios
```

### ❌ Error: "permission denied"
**Solución**: Ejecutar PowerShell como Administrador

### ❌ Error: "ECONNREFUSED"
**Solución**: PostgreSQL no está ejecutándose
1. Verificar servicios de Windows
2. Iniciar servicio "postgresql-x64-[version]"

### ❌ Error: "npm install fails"
**Solución**: Limpiar cache y reinstalar
```bash
npm cache clean --force
npm install
```

---

## 📞 CONTACTO Y AYUDA

Si encuentras problemas:
1. **Revisar logs de error** en la terminal
2. **Verificar versiones** de Node.js y PostgreSQL
3. **Asegurar credenciales** correctas de BD
4. **Verificar puertos** disponibles (3000, 5173, 5432)

---

## 🎉 ¡MIGRACIÓN COMPLETADA!

Una vez que todo funcione correctamente:
- ✅ Aplicación corriendo en el nuevo PC
- ✅ Datos migrados exitosamente  
- ✅ Sistema de candados funcionando
- ✅ Todas las funcionalidades operativas

**¡Tu sistema Control de Facturación está listo para usar en el nuevo computador!** 🚀
