# Script Mejorado para Importar Base de Datos PostgreSQL
# Proyecto: Control de Facturación

Write-Host "=== IMPORTADOR DE BASE DE DATOS ===" -ForegroundColor Green
Write-Host ""

# Configuración
$base_datos = "control_usuarios"
$usuario = "postgres"
$password = "Sistemas1234*"
$host_db = "localhost"
$puerto = "5432"

# Buscar archivos de backup disponibles
Write-Host "🔍 Buscando archivos de backup..." -ForegroundColor Yellow
$archivos_sql = Get-ChildItem -Path "." -Filter "*.sql" | Sort-Object LastWriteTime -Descending
$archivos_dump = Get-ChildItem -Path "." -Filter "*.dump" | Sort-Object LastWriteTime -Descending

if ($archivos_sql.Count -eq 0 -and $archivos_dump.Count -eq 0) {
    Write-Host "❌ No se encontraron archivos de backup (.sql o .dump)" -ForegroundColor Red
    Write-Host "Copia el archivo maindb.sql del computador origen a esta carpeta" -ForegroundColor Yellow
    pause
    exit
}

Write-Host "📁 Archivos disponibles:" -ForegroundColor Cyan
$contador = 1
$todos_archivos = @()

foreach ($archivo in $archivos_sql) {
    Write-Host "$contador. $($archivo.Name) (SQL - $([math]::Round($archivo.Length/1KB, 2)) KB - $($archivo.LastWriteTime.ToString('yyyy-MM-dd HH:mm')))" -ForegroundColor White
    $todos_archivos += $archivo
    $contador++
}

foreach ($archivo in $archivos_dump) {
    Write-Host "$contador. $($archivo.Name) (DUMP - $([math]::Round($archivo.Length/1KB, 2)) KB - $($archivo.LastWriteTime.ToString('yyyy-MM-dd HH:mm')))" -ForegroundColor White
    $todos_archivos += $archivo
    $contador++
}

Write-Host ""
if ($todos_archivos.Count -eq 1) {
    Write-Host "🎯 Se usará automáticamente: $($todos_archivos[0].Name)" -ForegroundColor Green
    $archivo_seleccionado = $todos_archivos[0]
} else {
    $seleccion = Read-Host "Selecciona el número del archivo a importar"
    try {
        $indice = [int]$seleccion - 1
        if ($indice -ge 0 -and $indice -lt $todos_archivos.Count) {
            $archivo_seleccionado = $todos_archivos[$indice]
            Write-Host "✅ Archivo seleccionado: $($archivo_seleccionado.Name)" -ForegroundColor Green
        } else {
            throw "Índice fuera de rango"
        }
    } catch {
        Write-Host "❌ Selección inválida" -ForegroundColor Red
        pause
        exit
    }
}

Write-Host ""
Write-Host "⚠️  ADVERTENCIA: Esta operación:" -ForegroundColor Yellow
Write-Host "   - Eliminará la base de datos '$base_datos' si existe" -ForegroundColor Red
Write-Host "   - Creará una nueva base de datos vacía" -ForegroundColor Yellow  
Write-Host "   - Importará todos los datos desde $($archivo_seleccionado.Name)" -ForegroundColor Yellow
Write-Host ""

$confirmacion = Read-Host "¿Continuar? (s/N)"
if ($confirmacion -ne "s" -and $confirmacion -ne "S") {
    Write-Host "❌ Operación cancelada" -ForegroundColor Red
    pause
    exit
}

Write-Host ""
Write-Host "🚀 Iniciando proceso de importación..." -ForegroundColor Green

# Configurar variable de entorno para contraseña
$env:PGPASSWORD = $password

try {
    Write-Host ""
    Write-Host "1️⃣ Eliminando base de datos existente (si existe)..." -ForegroundColor Yellow
    $eliminar_output = & dropdb -h $host_db -p $puerto -U $usuario $base_datos --if-exists 2>&1
    Write-Host "   Resultado: $eliminar_output" -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "2️⃣ Creando nueva base de datos '$base_datos'..." -ForegroundColor Yellow
    $crear_output = & createdb -h $host_db -p $puerto -U $usuario $base_datos 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Base de datos creada exitosamente" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error creando base de datos: $crear_output" -ForegroundColor Red
        throw "Error en creación de base de datos"
    }
    
    Write-Host ""
    Write-Host "3️⃣ Importando datos desde $($archivo_seleccionado.Name)..." -ForegroundColor Yellow
    
    if ($archivo_seleccionado.Extension -eq ".sql") {
        # Importar archivo SQL
        Write-Host "   Usando psql para archivo SQL..." -ForegroundColor Gray
        $import_output = & psql -h $host_db -p $puerto -U $usuario -d $base_datos -f $archivo_seleccionado.FullName 2>&1
    } else {
        # Importar archivo DUMP
        Write-Host "   Usando pg_restore para archivo DUMP..." -ForegroundColor Gray
        $import_output = & pg_restore -h $host_db -p $puerto -U $usuario -d $base_datos $archivo_seleccionado.FullName 2>&1
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Datos importados exitosamente" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Advertencias durante la importación:" -ForegroundColor Yellow
        Write-Host "   $import_output" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "4️⃣ Verificando importación..." -ForegroundColor Yellow
    
    # Verificar tablas
    $verificar_tablas = & psql -h $host_db -p $puerto -U $usuario -d $base_datos -c "\dt" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Tablas verificadas correctamente" -ForegroundColor Green
        
        # Contar registros en tablas principales
        Write-Host ""
        Write-Host "📊 Resumen de datos importados:" -ForegroundColor Cyan
        
        $tablas = @("anulacion", "sede", "`"user`"", "facturacion_evento")
        foreach ($tabla in $tablas) {
            $count_output = & psql -h $host_db -p $puerto -U $usuario -d $base_datos -t -c "SELECT COUNT(*) FROM $tabla;" 2>&1
            if ($LASTEXITCODE -eq 0) {
                $count = $count_output.Trim()
                Write-Host "   • $($tabla.Replace('`"', '').Replace('"', '')): $count registros" -ForegroundColor White
            }
        }
    } else {
        Write-Host "   ⚠️  Advertencia al verificar tablas: $verificar_tablas" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🎉 ¡IMPORTACIÓN COMPLETADA!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "1. Verificar que el archivo ormconfig.json tenga la configuración correcta" -ForegroundColor White
    Write-Host "2. Probar la conexión desde la aplicación" -ForegroundColor White
    Write-Host "3. Verificar que todos los datos se importaron correctamente" -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "❌ ERROR durante la importación:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Posibles soluciones:" -ForegroundColor Yellow
    Write-Host "• Verificar que PostgreSQL esté ejecutándose" -ForegroundColor White
    Write-Host "• Verificar usuario y contraseña" -ForegroundColor White
    Write-Host "• Verificar que pg_restore/psql estén en el PATH" -ForegroundColor White
}

# Limpiar variable de entorno
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
