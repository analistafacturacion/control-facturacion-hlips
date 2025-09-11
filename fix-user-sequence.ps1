#!/usr/bin/env pwsh

# Script para arreglar la secuencia del ID de la tabla user
# Uso: .\fix-user-sequence.ps1 -DatabaseUrl "postgresql://..."

param(
    [Parameter(Mandatory=$true)]
    [string]$DatabaseUrl
)

Write-Host "🔧 Ejecutando corrección de secuencia para tabla user..." -ForegroundColor Yellow

try {
    # Verificar si psql está disponible
    $psqlAvailable = Get-Command psql -ErrorAction SilentlyContinue
    if (-not $psqlAvailable) {
        Write-Host "❌ Error: psql no está disponible. Instala PostgreSQL client." -ForegroundColor Red
        exit 1
    }

    # Ejecutar el script SQL
    Write-Host "📊 Conectando a la base de datos..." -ForegroundColor Blue
    
    $sqlScript = Get-Content "fix-user-id-sequence.sql" -Raw
    $sqlScript | psql $DatabaseUrl

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Corrección aplicada exitosamente!" -ForegroundColor Green
        Write-Host "🔄 Ahora puedes intentar crear usuarios nuevamente." -ForegroundColor Cyan
    } else {
        Write-Host "❌ Error al ejecutar la corrección." -ForegroundColor Red
        exit 1
    }

} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Instrucciones para Render:" -ForegroundColor Yellow
Write-Host "1. Ve a tu dashboard de Render" -ForegroundColor White
Write-Host "2. Busca tu base de datos PostgreSQL" -ForegroundColor White
Write-Host "3. Ve a la pestaña 'Connect'" -ForegroundColor White
Write-Host "4. Copia la URL de conexión externa" -ForegroundColor White
Write-Host "5. Ejecuta: .\fix-user-sequence.ps1 -DatabaseUrl 'tu-url-aqui'" -ForegroundColor White
