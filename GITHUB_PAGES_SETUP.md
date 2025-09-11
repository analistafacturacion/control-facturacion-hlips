# 🚀 Guía para Desplegar en GitHub Pages

## Paso 1: Subir el código a GitHub

### Opción A: Si ya tienes un repositorio de GitHub
```bash
git add .
git commit -m "Configurar GitHub Pages deployment"
git push origin main
```

### Opción B: Si necesitas crear un nuevo repositorio
1. Ve a [github.com](https://github.com) y crea un nuevo repositorio
2. Nombra el repositorio: `1.-Control-Facturacion` (importante para las rutas)
3. Ejecuta estos comandos en tu carpeta del proyecto:

```bash
git init
git add .
git commit -m "Initial commit - Control Facturación"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/1.-Control-Facturacion.git
git push -u origin main
```

## Paso 2: Configurar GitHub Pages

1. **Ve a tu repositorio en GitHub**
2. **Click en "Settings" (Configuración)**
3. **Scroll hacia abajo hasta "Pages"**
4. **En "Source" selecciona "GitHub Actions"**
5. **¡Listo! GitHub Actions se encargará del resto**

## Paso 3: Verificar el despliegue

1. Ve a la pestaña **"Actions"** en tu repositorio
2. Verás el workflow **"Deploy to GitHub Pages"** ejecutándose
3. Espera a que termine (unos 2-3 minutos)
4. Tu aplicación estará disponible en:
   ```
   https://TU_USUARIO.github.io/1.-Control-Facturacion/
   ```

## ⚙️ Configuraciones Incluidas

### ✅ GitHub Actions Workflow
- Compilación automática del frontend
- Despliegue automático en cada push a main
- Configuración optimizada para React + Vite

### ✅ Configuración de Rutas
- **Desarrollo**: `http://localhost:5173/`
- **Producción**: `https://TU_USUARIO.github.io/1.-Control-Facturacion/`
- Router configurado para GitHub Pages

### ✅ API Configuration
- **Desarrollo**: Se conecta a `http://localhost:3001/api`
- **Producción**: Se conecta a `https://control-facturacion-hlips.onrender.com/api`

## 🔧 Comandos Útiles

### Desarrollo Local
```bash
cd apps/frontend
npm run dev
```

### Build Local (para probar)
```bash
cd apps/frontend
npm run build
npm run preview
```

### Ver logs de GitHub Actions
1. Ve a tu repositorio en GitHub
2. Click en "Actions"
3. Click en el workflow más reciente

## 🚨 Resolución de Problemas

### Problema: "404 Page Not Found"
- Verifica que el repositorio se llame exactamente `1.-Control-Facturacion`
- Asegúrate de que GitHub Pages esté configurado como "GitHub Actions"

### Problema: "Build Failed"
- Ve a la pestaña Actions y revisa los logs
- Puede ser un problema con dependencias o rutas

### Problema: "API No Conecta"
- Verifica que la API en Render esté funcionando: 
  https://control-facturacion-hlips.onrender.com/api/health

## 📱 URL Final

Una vez configurado, tu aplicación estará en:
```
https://TU_USUARIO.github.io/1.-Control-Facturacion/
```

Reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub.

## 🎉 ¡Listo para Producción!

- ✅ Frontend desplegado automáticamente
- ✅ API funcionando en Render
- ✅ Base de datos PostgreSQL conectada
- ✅ Actualizaciones automáticas con cada push

¡Tu sistema de Control de Facturación está ahora completamente en la nube! 🚀
