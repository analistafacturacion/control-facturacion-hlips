# Script de migración de base de datos para Control Facturación
# Migra maindb.sql desde local hacia PostgreSQL en Render

param(
    [string]$DBHost,
    [string]$Database,
    [string]$Username,
    [string]$Password,
    [int]$Port = 5432
)

Write-Host ""
Write-Host "🚀 Control Facturación - Migración de Base de Datos" -ForegroundColor Blue
Write-Host "=" * 60 -ForegroundColor Blue

# Verificar que psql esté disponible
Write-Host ""
Write-Host "🔍 Verificando PostgreSQL client (psql)..." -ForegroundColor Yellow

try {
    $psqlVersion = & psql --version 2>$null
    if (-not $psqlVersion) {
        throw "psql no encontrado"
    }
    Write-Host "✅ psql encontrado: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ psql no está instalado." -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Para instalar PostgreSQL:" -ForegroundColor Yellow
    Write-Host "1. Ve a: https://www.postgresql.org/download/windows/"
    Write-Host "2. Descarga e instala PostgreSQL"
    Write-Host "3. Reinicia PowerShell y ejecuta este script de nuevo"
    Write-Host ""
    Write-Host "📋 Alternativa - usar pgAdmin:" -ForegroundColor Yellow
    Write-Host "1. Descarga pgAdmin: https://www.pgadmin.org/download/"
    Write-Host "2. Conecta con las credenciales de Render"
    Write-Host "3. Restaura el archivo maindb.sql"
    exit 1
}

# Verificar archivo maindb.sql
$sqlFile = Join-Path $PSScriptRoot "maindb.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ No se encontró maindb.sql en la carpeta actual" -ForegroundColor Red
    Write-Host "📁 Archivo esperado: $sqlFile" -ForegroundColor Yellow
    exit 1
}

$fileSize = (Get-Item $sqlFile).Length / 1MB
Write-Host "✅ Archivo encontrado: maindb.sql ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green

# Solicitar credenciales si no se proporcionaron
if (-not $DBHost) {
    Write-Host ""
    Write-Host "📋 Ingresa las credenciales de tu base de datos PostgreSQL en Render:" -ForegroundColor Yellow
    Write-Host "   (Puedes encontrarlas en: https://dashboard.render.com)" -ForegroundColor Cyan
    Write-Host ""
    
    $DBHost = Read-Host "🔗 Host (ej: dpg-xxxxx-a.oregon-postgres.render.com)"
    $Database = Read-Host "🗄️  Database (ej: control_facturacion_xxxxx)"
    $Username = Read-Host "👤 Username (ej: control_facturacion_xxxxx_user)"
    $Password = Read-Host -AsSecureString "🔐 Password"
}

# Convertir SecureString a texto plano para psql si es necesario
if ($Password -is [System.Security.SecureString]) {
    $PlainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password))
} else {
    $PlainPassword = $Password
}

# Verificar credenciales
if (-not $DBHost -or -not $Database -or -not $Username -or -not $PlainPassword) {
    Write-Host "❌ Faltan credenciales. Todas son requeridas." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Probando conexión..." -ForegroundColor Yellow

# Probar conexión
$env:PGPASSWORD = $PlainPassword
$testCommand = "psql -h $DBHost -p $Port -U $Username -d $Database -c '\dt'"

try {
    $result = Invoke-Expression $testCommand 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Conexión exitosa a PostgreSQL en Render" -ForegroundColor Green
    } else {
        throw "Error de conexión"
    }
} catch {
    Write-Host "❌ Error de conexión. Verifica las credenciales." -ForegroundColor Red
    Write-Host "💡 Asegúrate de que:" -ForegroundColor Yellow
    Write-Host "   - Las credenciales son correctas"
    Write-Host "   - La base de datos está activa en Render"
    Write-Host "   - Tu IP tiene acceso (Render permite conexiones externas)"
    exit 1
}

# Confirmación antes de migrar
Write-Host ""
Write-Host "⚠️  ADVERTENCIA: Esta operación puede sobrescribir datos existentes" -ForegroundColor Red
Write-Host "🎯 Base de datos destino: $Database en $DBHost" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "¿Continuar con la migración? (s/N)"

if ($confirm -ne "s" -and $confirm -ne "S" -and $confirm -ne "si" -and $confirm -ne "SI") {
    Write-Host "❌ Migración cancelada por el usuario" -ForegroundColor Yellow
    exit 0
}

# Ejecutar migración
Write-Host ""
Write-Host "🚀 Iniciando migración..." -ForegroundColor Green
Write-Host "⏳ Esto puede tomar varios minutos dependiendo del tamaño de los datos..." -ForegroundColor Yellow

$migrateCommand = "psql -h $DBHost -p $Port -U $Username -d $Database -f `"$sqlFile`""

try {
    Write-Host "📄 Ejecutando: psql -h $DBHost -p $Port -U $Username -d $Database -f maindb.sql" -ForegroundColor Cyan
    $result = Invoke-Expression $migrateCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ ¡Migración completada exitosamente!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔍 Verificación recomendada:" -ForegroundColor Yellow
        Write-Host "1. API Health: https://control-facturacion-hlips.onrender.com/api/health"
        Write-Host "2. Frontend: https://analistafacturacion.github.io/control-facturacion-hlips/"
        Write-Host "3. Prueba el login con tus credenciales existentes"
        Write-Host ""
        Write-Host "🎉 ¡Tu sistema está ahora completamente en la nube!" -ForegroundColor Green
    } else {
        throw "Error en migración"
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error durante la migración" -ForegroundColor Red
    Write-Host "💡 Posibles soluciones:" -ForegroundColor Yellow
    Write-Host "   - Verifica que el archivo maindb.sql sea válido"
    Write-Host "   - Confirma que tienes permisos de escritura en la BD"
    Write-Host "   - Intenta con pgAdmin como alternativa"
    exit 1
} finally {
    # Limpiar variable de password
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "🎯 Migración finalizada" -ForegroundColor Green
