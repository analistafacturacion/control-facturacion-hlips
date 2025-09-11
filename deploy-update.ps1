# Script de PowerShell para subir cambios a Git
# Actualización: Persistencia global de última actualización y refresh automático

Write-Host "🚀 Subiendo cambios de persistencia global y actualización automática..." -ForegroundColor Green

# Verificar si estamos en un repositorio git
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: No se encontró repositorio git" -ForegroundColor Red
    exit 1
}

# Mostrar estado actual
Write-Host "📋 Estado actual del repositorio:" -ForegroundColor Yellow
git status --porcelain

# Agregar todos los cambios
Write-Host "📁 Agregando archivos modificados..." -ForegroundColor Blue
git add .

# Verificar si hay cambios para hacer commit
$status = git status --porcelain
if ([string]::IsNullOrEmpty($status)) {
    Write-Host "ℹ️  No hay cambios para hacer commit" -ForegroundColor Yellow
    Write-Host "✅ Repositorio ya está actualizado" -ForegroundColor Green
    exit 0
}

# Mensaje de commit específico para esta actualización
$commitMessage = "feat: implementar persistencia global última actualización y refresh automático

- Agregar endpoints GET/POST /ultima-actualizacion en backend
- Implementar carga automática desde servidor en frontend  
- Agregar refresh automático de tarjetas y tablas tras actualización
- Mejorar manejo de errores con fallback a localStorage
- Agregar logging extensivo para debugging
- Asegurar persistencia cross-device independiente del cache"

# Hacer commit
Write-Host "💾 Haciendo commit..." -ForegroundColor Blue
git commit -m $commitMessage

# Push a la rama main
Write-Host "⬆️  Subiendo cambios a GitHub..." -ForegroundColor Blue
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ ¡Cambios subidos exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📌 Cambios incluidos:" -ForegroundColor Yellow
    Write-Host "   • Backend: Endpoints para persistencia global (/ultima-actualizacion)" -ForegroundColor White
    Write-Host "   • Frontend: Carga automática desde servidor al iniciar" -ForegroundColor White
    Write-Host "   • Frontend: Refresh automático tras botones de actualización" -ForegroundColor White
    Write-Host "   • Logging extensivo para debugging" -ForegroundColor White
    Write-Host ""
    Write-Host "🔄 GitHub Actions desplegará automáticamente en ~2-3 minutos" -ForegroundColor Cyan
    Write-Host "🌐 Los cambios estarán disponibles en producción tras el despliegue" -ForegroundColor Cyan
} else {
    Write-Host "❌ Error durante el push. Revisa la configuración de Git." -ForegroundColor Red
    exit 1
}
