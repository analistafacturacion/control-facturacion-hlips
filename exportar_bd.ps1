# Script para exportar la base de datos PostgreSQL
# Control de Facturación - Versión mejorada con detección automática

Write-Host "=== EXPORTADOR DE BASE DE DATOS PostgreSQL ===" -ForegroundColor Cyan
Write-Host ""

$host_db = "localhost"
$puerto = "5432" 
$usuario = "postgres"
$base_datos = "control_usuarios"
$fecha = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

Write-Host "Configuración:" -ForegroundColor Yellow
Write-Host "Host: $host_db"
Write-Host "Puerto: $puerto"
Write-Host "Usuario: $usuario"  
Write-Host "Base de datos: $base_datos"
Write-Host ""

# Función para buscar PostgreSQL
function Find-PostgreSQL {
    $posibles_rutas = @(
        "C:\Program Files\PostgreSQL\*\bin",
        "C:\Program Files (x86)\PostgreSQL\*\bin",
        "C:\PostgreSQL\*\bin",
        "$env:LOCALAPPDATA\Programs\PostgreSQL\*\bin",
        "$env:ProgramFiles\PostgreSQL\*\bin"
    )
    
    foreach ($ruta in $posibles_rutas) {
        $dirs = Get-ChildItem $ruta -ErrorAction SilentlyContinue
        foreach ($dir in $dirs) {
            $pg_dump_path = Join-Path $dir.FullName "pg_dump.exe"
            if (Test-Path $pg_dump_path) {
                return $dir.FullName
            }
        }
    }
    return $null
}

# Detectar PostgreSQL
Write-Host "Detectando instalación de PostgreSQL..." -ForegroundColor Yellow

# Primero intentar con PATH
try {
    $null = Get-Command pg_dump -ErrorAction Stop
    $pg_bin_path = ""
    Write-Host "✓ pg_dump encontrado en PATH" -ForegroundColor Green
} catch {
    Write-Host "⚠ pg_dump no está en PATH, buscando instalación..." -ForegroundColor Yellow
    $pg_bin_path = Find-PostgreSQL
    
    if ($pg_bin_path) {
        Write-Host "✓ PostgreSQL encontrado en: $pg_bin_path" -ForegroundColor Green
        $env:PATH += ";$pg_bin_path"
    } else {
        Write-Host "❌ PostgreSQL no encontrado" -ForegroundColor Red
        Write-Host ""
        Write-Host "SOLUCIONES:" -ForegroundColor Yellow
        Write-Host "1. Instalar PostgreSQL desde: https://www.postgresql.org/download/windows/" -ForegroundColor White
        Write-Host "2. O usar pgAdmin para exportar manualmente" -ForegroundColor White
        Write-Host "3. O agregar PostgreSQL al PATH del sistema" -ForegroundColor White
        Write-Host ""
        Write-Host "Para verificar si PostgreSQL está instalado:" -ForegroundColor Yellow
        Write-Host "- Buscar 'pgAdmin' en el menú inicio" -ForegroundColor White
        Write-Host "- O buscar carpeta PostgreSQL en Program Files" -ForegroundColor White
        
        Read-Host "Presiona Enter para continuar"
        return
    }
}

# Verificar conexión a la base de datos
Write-Host "Verificando conexión a la base de datos..." -ForegroundColor Yellow
try {
    $conexion_test = & pg_dump --version 2>&1
    Write-Host "✓ pg_dump versión: $($conexion_test)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error ejecutando pg_dump: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Presiona Enter para continuar"
    return
}

# Crear directorio de respaldos si no existe
if (!(Test-Path "respaldos")) {
    New-Item -ItemType Directory -Name "respaldos"
    Write-Host "Directorio 'respaldos' creado" -ForegroundColor Green
}

Write-Host "Iniciando exportación..." -ForegroundColor Green

try {
    # Exportación completa en formato SQL
    Write-Host "1. Exportando estructura + datos (formato SQL)..." -ForegroundColor Yellow
    $archivo_sql = "respaldos\control_usuarios_$fecha.sql"
    & pg_dump -h $host_db -p $puerto -U $usuario -d $base_datos > $archivo_sql
    
    if (Test-Path $archivo_sql) {
        $size_sql = (Get-Item $archivo_sql).Length
        Write-Host "   ✓ Archivo SQL creado: $archivo_sql ($([math]::Round($size_sql/1KB, 2)) KB)" -ForegroundColor Green
    }
    
    # Exportación en formato custom
    Write-Host "2. Exportando en formato custom (más eficiente)..." -ForegroundColor Yellow  
    $archivo_dump = "respaldos\control_usuarios_$fecha.dump"
    & pg_dump -h $host_db -p $puerto -U $usuario -d $base_datos -Fc > $archivo_dump
    
    if (Test-Path $archivo_dump) {
        $size_dump = (Get-Item $archivo_dump).Length  
        Write-Host "   ✓ Archivo DUMP creado: $archivo_dump ($([math]::Round($size_dump/1KB, 2)) KB)" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "=== EXPORTACIÓN COMPLETADA ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Archivos creados en la carpeta 'respaldos':" -ForegroundColor White
    Get-ChildItem "respaldos\*$fecha*" | ForEach-Object { 
        Write-Host "  - $($_.Name)" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "=== COMANDOS PARA IMPORTAR EN NUEVO COMPUTADOR ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. CREAR LA BASE DE DATOS:" -ForegroundColor Yellow
    Write-Host "   createdb -h localhost -p 5432 -U postgres control_usuarios" -ForegroundColor White
    Write-Host ""
    Write-Host "2a. IMPORTAR DESDE ARCHIVO SQL:" -ForegroundColor Yellow  
    Write-Host "   psql -h localhost -p 5432 -U postgres -d control_usuarios < $archivo_sql" -ForegroundColor White
    Write-Host ""
    Write-Host "2b. IMPORTAR DESDE ARCHIVO CUSTOM (RECOMENDADO):" -ForegroundColor Yellow
    Write-Host "   pg_restore -h localhost -p 5432 -U postgres -d control_usuarios $archivo_dump" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host "Error durante la exportación: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifica que:" -ForegroundColor Yellow
    Write-Host "- PostgreSQL esté instalado y en el PATH"
    Write-Host "- La base de datos exista y sea accesible"
    Write-Host "- Las credenciales sean correctas"
}

Write-Host "Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
