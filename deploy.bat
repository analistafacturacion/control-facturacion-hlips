@echo off
echo 🚀 Subiendo cambios de persistencia global...

:: Verificar si git está disponible
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git no está disponible en esta terminal
    echo 💡 Usa la terminal integrada de VS Code (Ctrl+`) y ejecuta:
    echo.
    echo    git add .
    echo    git commit -m "feat: persistencia global ultima actualizacion y refresh automatico"
    echo    git push origin main
    echo.
    pause
    exit /b 1
)

:: Agregar archivos
echo 📁 Agregando archivos...
git add .

:: Verificar si hay cambios
git diff --staged --quiet
if errorlevel 1 (
    echo 💾 Haciendo commit...
    git commit -m "feat: persistencia global ultima actualizacion y refresh automatico - Backend: endpoints GET/POST /ultima-actualizacion - Frontend: carga automatica desde servidor - Frontend: refresh automatico de tarjetas y tablas - Logging extensivo para debugging"
    
    echo ⬆️ Subiendo a GitHub...
    git push origin main
    
    if errorlevel 0 (
        echo ✅ Cambios subidos exitosamente!
        echo 🚀 GitHub Actions desplegará automáticamente en 2-3 minutos
    ) else (
        echo ❌ Error al hacer push
    )
) else (
    echo ℹ️ No hay cambios para subir
)

pause
