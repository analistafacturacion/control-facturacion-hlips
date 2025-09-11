# Configuración para Railway - Control de Facturación
Write-Host "CONFIGURACION AUTOMATICA PARA RAILWAY" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

Write-Host "1. Verificando dependencias..." -ForegroundColor Yellow

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js no encontrado. Instalalo desde https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Verificar npm
try {
    $npmVersion = npm --version
    Write-Host "npm instalado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "npm no encontrado" -ForegroundColor Red
    exit 1
}

# Verificar git
try {
    $gitVersion = git --version
    Write-Host "Git instalado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "Git no encontrado. Instalalo desde https://git-scm.com/" -ForegroundColor Red
    exit 1
}

Write-Host "2. Instalando dependencias del proyecto..." -ForegroundColor Yellow

# Instalar dependencias raíz
npm install

# Instalar dependencias backend
Set-Location "apps\backend"
npm install
Set-Location "..\..\"

# Instalar dependencias frontend  
Set-Location "apps\frontend"
npm install
Set-Location "..\..\"

Write-Host "Dependencias instaladas correctamente" -ForegroundColor Green

Write-Host "3. Configurando Git..." -ForegroundColor Yellow

# Inicializar git si no existe
if (-not (Test-Path ".git")) {
    git init
    Write-Host "Repositorio Git inicializado" -ForegroundColor Green
} else {
    Write-Host "Repositorio Git ya existe" -ForegroundColor Green
}

# Agregar archivos
git add .

# Hacer commit
try {
    git commit -m "Configuracion inicial para Railway deployment"
    Write-Host "Cambios commiteados" -ForegroundColor Green
} catch {
    Write-Host "No hay cambios para commitear" -ForegroundColor Yellow
}

Write-Host "4. Verificando estructura de archivos..." -ForegroundColor Yellow

# Verificar archivos importantes
$files = @(
    "railway.json",
    "nixpacks.toml", 
    "apps\backend\.env.production",
    "apps\frontend\.env.production",
    "migrate.sh"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "EXISTE: $file" -ForegroundColor Green
    } else {
        Write-Host "FALTA: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "CONFIGURACION COMPLETADA!" -ForegroundColor Green
Write-Host ""
Write-Host "PROXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "1. Crear repositorio en GitHub"
Write-Host "2. Subir codigo: git remote add origin URL-DE-TU-REPO"
Write-Host "3. Hacer push: git push -u origin main"
Write-Host "4. Crear proyecto en Railway (https://railway.app)"
Write-Host "5. Conectar repositorio GitHub"
Write-Host "6. Configurar variables de entorno"
Write-Host ""
Write-Host "LEE LA GUIA COMPLETA: GUIA_RAILWAY_DEPLOY.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "Tu aplicacion estara lista en Railway en 15-30 minutos!" -ForegroundColor Green
