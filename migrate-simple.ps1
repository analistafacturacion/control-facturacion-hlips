# Script de migracion de base de datos para Control Facturacion
# Migra maindb.sql desde local hacia PostgreSQL en Render

param(
    [string]$DBHost,
    [string]$Database,
    [string]$Username,
    [string]$Password,
    [int]$Port = 5432
)

Write-Host ""
Write-Host "Control Facturacion - Migracion de Base de Datos" -ForegroundColor Blue
Write-Host "=" * 50 -ForegroundColor Blue

# Verificar que psql este disponible
Write-Host ""
Write-Host "Verificando PostgreSQL client (psql)..." -ForegroundColor Yellow

try {
    $psqlVersion = & psql --version 2>$null
    if (-not $psqlVersion) {
        throw "psql no encontrado"
    }
    Write-Host "psql encontrado: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: psql no esta instalado." -ForegroundColor Red
    Write-Host ""
    Write-Host "Para instalar PostgreSQL:" -ForegroundColor Yellow
    Write-Host "1. Ve a: https://www.postgresql.org/download/windows/"
    Write-Host "2. Descarga e instala PostgreSQL"
    Write-Host "3. Reinicia PowerShell y ejecuta este script de nuevo"
    exit 1
}

# Verificar archivo maindb.sql
$sqlFile = Join-Path $PSScriptRoot "maindb.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "Error: No se encontro maindb.sql en la carpeta actual" -ForegroundColor Red
    Write-Host "Archivo esperado: $sqlFile" -ForegroundColor Yellow
    exit 1
}

$fileSize = (Get-Item $sqlFile).Length / 1MB
Write-Host "Archivo encontrado: maindb.sql ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green

# Solicitar credenciales si no se proporcionaron
if (-not $DBHost) {
    Write-Host ""
    Write-Host "Ingresa las credenciales de tu base de datos PostgreSQL en Render:" -ForegroundColor Yellow
    Write-Host ""
    
    $DBHost = Read-Host "Host (ej: dpg-xxxxx-a.oregon-postgres.render.com)"
    $Database = Read-Host "Database (ej: control_facturacion_xxxxx)"
    $Username = Read-Host "Username (ej: control_facturacion_xxxxx_user)"
    $Password = Read-Host "Password"
}

# Verificar credenciales
if (-not $DBHost -or -not $Database -or -not $Username -or -not $Password) {
    Write-Host "Error: Faltan credenciales. Todas son requeridas." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Probando conexion..." -ForegroundColor Yellow

# Probar conexion
$env:PGPASSWORD = $Password

try {
    & psql -h $DBHost -p $Port -U $Username -d $Database -c "SELECT version();" 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Conexion exitosa a PostgreSQL en Render" -ForegroundColor Green
    } else {
        Write-Host "Error de conexion. Verifica las credenciales." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error de conexion: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Confirmacion antes de migrar
Write-Host ""
Write-Host "ADVERTENCIA: Esta operacion puede sobrescribir datos existentes" -ForegroundColor Red
Write-Host "Base de datos destino: $Database en $DBHost" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Continuar con la migracion? (s/N)"

if ($confirm -ne "s" -and $confirm -ne "S" -and $confirm -ne "si" -and $confirm -ne "SI") {
    Write-Host "Migracion cancelada por el usuario" -ForegroundColor Yellow
    exit 0
}

# Ejecutar migracion
Write-Host ""
Write-Host "Iniciando migracion..." -ForegroundColor Green
Write-Host "Esto puede tomar varios minutos..." -ForegroundColor Yellow

try {
    Write-Host "Ejecutando: psql -h $DBHost -p $Port -U $Username -d $Database -f maindb.sql" -ForegroundColor Cyan
    & psql -h $DBHost -p $Port -U $Username -d $Database -f $sqlFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Migracion completada exitosamente!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Verificacion recomendada:" -ForegroundColor Yellow
        Write-Host "1. API Health: https://control-facturacion-hlips.onrender.com/api/health"
        Write-Host "2. Frontend: https://analistafacturacion.github.io/control-facturacion-hlips/"
        Write-Host "3. Prueba el login con tus credenciales existentes"
        Write-Host ""
        Write-Host "Tu sistema esta ahora completamente en la nube!" -ForegroundColor Green
    } else {
        Write-Host "Error durante la migracion" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "Error durante la migracion: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Limpiar variable de password
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Migracion finalizada" -ForegroundColor Green
