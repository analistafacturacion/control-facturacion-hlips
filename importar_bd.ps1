# Script para importar la base de datos PostgreSQL
# Control de Facturación

Write-Host "=== IMPORTADOR DE BASE DE DATOS PostgreSQL ===" -ForegroundColor Cyan
Write-Host ""

$host_db = "localhost"
$puerto = "5432"
$usuario = "postgres"  
$base_datos = "control_usuarios"

Write-Host "Configuración:" -ForegroundColor Yellow
Write-Host "Host: $host_db"
Write-Host "Puerto: $puerto"
Write-Host "Usuario: $usuario"
Write-Host "Base de datos: $base_datos"
Write-Host ""

# Buscar archivos de respaldo
$archivos_sql = Get-ChildItem "respaldos\*.sql" -ErrorAction SilentlyContinue
$archivos_dump = Get-ChildItem "respaldos\*.dump" -ErrorAction SilentlyContinue

if ($archivos_sql.Count -eq 0 -and $archivos_dump.Count -eq 0) {
    Write-Host "No se encontraron archivos de respaldo en la carpeta 'respaldos'" -ForegroundColor Red
    Write-Host "Asegúrate de que los archivos .sql o .dump estén en la carpeta 'respaldos'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Archivos encontrados:" -ForegroundColor Green
$archivos_sql | ForEach-Object { Write-Host "  SQL: $($_.Name)" -ForegroundColor White }
$archivos_dump | ForEach-Object { Write-Host "  DUMP: $($_.Name)" -ForegroundColor White }
Write-Host ""

# Seleccionar archivo más reciente
$archivo_mas_reciente = $null
$tipo_archivo = ""

if ($archivos_dump.Count -gt 0) {
    $archivo_mas_reciente = $archivos_dump | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    $tipo_archivo = "DUMP"
} elseif ($archivos_sql.Count -gt 0) {
    $archivo_mas_reciente = $archivos_sql | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    $tipo_archivo = "SQL"
}

Write-Host "Usando archivo: $($archivo_mas_reciente.Name) (formato: $tipo_archivo)" -ForegroundColor Green
Write-Host ""

try {
    # Verificar si la base de datos existe
    Write-Host "1. Verificando si la base de datos existe..." -ForegroundColor Yellow
    $db_exists = & psql -h $host_db -p $puerto -U $usuario -lqt | Select-String $base_datos
    
    if ($db_exists) {
        Write-Host "   ⚠ La base de datos '$base_datos' ya existe" -ForegroundColor Yellow
        $respuesta = Read-Host "¿Deseas eliminarla y crearla nuevamente? (s/N)"
        
        if ($respuesta -eq "s" -or $respuesta -eq "S") {
            Write-Host "   Eliminando base de datos existente..." -ForegroundColor Yellow
            & dropdb -h $host_db -p $puerto -U $usuario $base_datos
        } else {
            Write-Host "   Operación cancelada por el usuario" -ForegroundColor Red
            exit 1
        }
    }
    
    # Crear la base de datos
    Write-Host "2. Creando la base de datos..." -ForegroundColor Yellow
    & createdb -h $host_db -p $puerto -U $usuario $base_datos
    Write-Host "   ✓ Base de datos '$base_datos' creada" -ForegroundColor Green
    
    # Importar los datos
    Write-Host "3. Importando datos..." -ForegroundColor Yellow
    
    if ($tipo_archivo -eq "DUMP") {
        & pg_restore -h $host_db -p $puerto -U $usuario -d $base_datos $archivo_mas_reciente.FullName
    } else {
        Get-Content $archivo_mas_reciente.FullName | & psql -h $host_db -p $puerto -U $usuario -d $base_datos
    }
    
    Write-Host "   ✓ Datos importados exitosamente" -ForegroundColor Green
    Write-Host ""
    
    # Verificar importación
    Write-Host "4. Verificando importación..." -ForegroundColor Yellow
    $tabla_count = & psql -h $host_db -p $puerto -U $usuario -d $base_datos -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
    Write-Host "   ✓ Número de tablas importadas: $($tabla_count.Trim())" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "=== IMPORTACIÓN COMPLETADA ===" -ForegroundColor Cyan
    Write-Host "La base de datos ha sido restaurada exitosamente en el nuevo computador" -ForegroundColor Green

} catch {
    Write-Host "Error durante la importación: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifica que:" -ForegroundColor Yellow
    Write-Host "- PostgreSQL esté instalado y ejecutándose"
    Write-Host "- El usuario tenga permisos de administrador"
    Write-Host "- Las credenciales sean correctas"
    Write-Host "- Los archivos de respaldo no estén corruptos"
}

Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
