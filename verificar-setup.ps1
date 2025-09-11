# Script simple para verificar la instalación
Write-Host "VERIFICACION DE CONFIGURACION RAILWAY" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Verificar Node.js
if (Get-Command "node" -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "BIEN: Node.js $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "ERROR: Node.js no encontrado" -ForegroundColor Red
}

# Verificar npm
if (Get-Command "npm" -ErrorAction SilentlyContinue) {
    $npmVersion = npm --version
    Write-Host "BIEN: npm $npmVersion" -ForegroundColor Green
} else {
    Write-Host "ERROR: npm no encontrado" -ForegroundColor Red
}

# Verificar git
if (Get-Command "git" -ErrorAction SilentlyContinue) {
    $gitVersion = git --version
    Write-Host "BIEN: $gitVersion" -ForegroundColor Green
} else {
    Write-Host "PENDIENTE: Git no encontrado" -ForegroundColor Yellow
    Write-Host "Descarga Git desde: https://git-scm.com/download/windows" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "ARCHIVOS DE CONFIGURACION:" -ForegroundColor Cyan

$files = @("railway.json", "nixpacks.toml", "apps\backend\.env.production", "apps\frontend\.env.production", "migrate.sh")

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "LISTO: $file" -ForegroundColor Green
    } else {
        Write-Host "FALTA: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "SIGUIENTES PASOS:" -ForegroundColor Yellow
Write-Host "1. Si falta Git, descargarlo e instalarlo"
Write-Host "2. Crear repositorio en GitHub"
Write-Host "3. Subir codigo a GitHub"
Write-Host "4. Crear proyecto en Railway"
Write-Host ""
Write-Host "Lee GUIA_RAILWAY_DEPLOY.md para instrucciones detalladas" -ForegroundColor Cyan
