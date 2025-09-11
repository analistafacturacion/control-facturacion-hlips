# Script Alternativo para Exportar Base de Datos
# Múltiples métodos de exportación disponibles

Write-Host "=== EXPORTADOR DE BASE DE DATOS - MÉTODOS ALTERNATIVOS ===" -ForegroundColor Cyan
Write-Host ""

$base_datos = "control_usuarios"
$fecha = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

Write-Host "Selecciona el método de exportación:" -ForegroundColor Yellow
Write-Host "1. Usar pg_dump (comando línea)" -ForegroundColor White
Write-Host "2. Generar script SQL para pgAdmin" -ForegroundColor White  
Write-Host "3. Usar psql para exportar" -ForegroundColor White
Write-Host "4. Exportar usando Node.js (si está disponible)" -ForegroundColor White
Write-Host "5. Mostrar instrucciones manuales" -ForegroundColor White
Write-Host ""

$opcion = Read-Host "Ingresa tu opción (1-5)"

switch ($opcion) {
    "1" {
        Write-Host "Método 1: pg_dump" -ForegroundColor Green
        Write-Host "Intentando ejecutar pg_dump..." -ForegroundColor Yellow
        
        try {
            if (!(Test-Path "respaldos")) { New-Item -ItemType Directory -Name "respaldos" }
            
            Write-Host "Ejecutando: pg_dump -h localhost -p 5432 -U postgres -d $base_datos" -ForegroundColor White
            $env:PGPASSWORD = "Sistemas1234*"
            & pg_dump -h localhost -p 5432 -U postgres -d $base_datos > "respaldos\control_usuarios_$fecha.sql"
            
            if (Test-Path "respaldos\control_usuarios_$fecha.sql") {
                $size = (Get-Item "respaldos\control_usuarios_$fecha.sql").Length
                Write-Host "✓ Exportación exitosa: control_usuarios_$fecha.sql ($([math]::Round($size/1KB, 2)) KB)" -ForegroundColor Green
            }
        } catch {
            Write-Host "❌ Error con pg_dump: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "Intenta con otra opción" -ForegroundColor Yellow
        }
    }
    
    "2" {
        Write-Host "Método 2: Script SQL para pgAdmin" -ForegroundColor Green
        Write-Host ""
        Write-Host "INSTRUCCIONES PARA PGADMIN:" -ForegroundColor Yellow
        Write-Host "1. Abrir pgAdmin 4" -ForegroundColor White
        Write-Host "2. Conectar al servidor PostgreSQL" -ForegroundColor White
        Write-Host "3. Hacer clic derecho en la base de datos 'control_usuarios'" -ForegroundColor White
        Write-Host "4. Seleccionar 'Backup...'" -ForegroundColor White
        Write-Host "5. Configurar:" -ForegroundColor White
        Write-Host "   - Filename: control_usuarios_backup_$fecha" -ForegroundColor Gray
        Write-Host "   - Format: Custom" -ForegroundColor Gray
        Write-Host "   - Encoding: UTF8" -ForegroundColor Gray
        Write-Host "6. Click 'Backup'" -ForegroundColor White
        Write-Host ""
        Write-Host "El archivo se guardará en la ubicación que selecciones" -ForegroundColor Green
    }
    
    "3" {
        Write-Host "Método 3: psql" -ForegroundColor Green
        Write-Host "Generando script de exportación con psql..." -ForegroundColor Yellow
        
        $script_sql = @"
-- Script generado automáticamente para exportar estructura
-- Fecha: $(Get-Date)
-- Base de datos: $base_datos

-- Para ejecutar este script:
-- psql -h localhost -p 5432 -U postgres -d $base_datos -f export_commands.sql

\copy anulacion TO 'anulacion_$fecha.csv' CSV HEADER;
\copy sede TO 'sede_$fecha.csv' CSV HEADER;
\copy "user" TO 'user_$fecha.csv' CSV HEADER;
\copy facturacion_evento TO 'facturacion_evento_$fecha.csv' CSV HEADER;

-- También puedes usar:
-- \dt para listar tablas
-- \d+ nombre_tabla para ver estructura
-- SELECT * FROM information_schema.tables WHERE table_schema = 'public';
"@
        
        $script_sql | Out-File -FilePath "export_commands.sql" -Encoding UTF8
        Write-Host "✓ Script creado: export_commands.sql" -ForegroundColor Green
        Write-Host "Ejecuta: psql -h localhost -p 5432 -U postgres -d $base_datos -f export_commands.sql" -ForegroundColor Yellow
    }
    
    "4" {
        Write-Host "Método 4: Node.js" -ForegroundColor Green
        
        $node_script = @"
const { execSync } = require('child_process');
const fs = require('fs');

console.log('Exportando base de datos con Node.js...');

try {
    // Configurar variable de entorno para la contraseña
    process.env.PGPASSWORD = 'Sistemas1234*';
    
    // Crear directorio si no existe
    if (!fs.existsSync('respaldos')) {
        fs.mkdirSync('respaldos');
    }
    
    const fecha = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const comando = `pg_dump -h localhost -p 5432 -U postgres -d control_usuarios > respaldos/control_usuarios_`+fecha+`.sql`;
    
    console.log('Ejecutando:', comando);
    execSync(comando, { stdio: 'inherit' });
    
    console.log('✓ Exportación completada');
} catch (error) {
    console.error('❌ Error:', error.message);
    console.log('Verifica que PostgreSQL esté instalado y en el PATH');
}
"@
        
        $node_script | Out-File -FilePath "export_db.js" -Encoding UTF8
        Write-Host "✓ Script de Node.js creado: export_db.js" -ForegroundColor Green
        Write-Host "Ejecuta: node export_db.js" -ForegroundColor Yellow
    }
    
    "5" {
        Write-Host "Método 5: Instrucciones Manuales" -ForegroundColor Green
        Write-Host ""
        Write-Host "EXPORTACIÓN MANUAL PASO A PASO:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "OPCIÓN A - Usando pgAdmin:" -ForegroundColor Cyan
        Write-Host "1. Abrir pgAdmin desde el menú inicio" -ForegroundColor White
        Write-Host "2. Conectar al servidor (localhost, puerto 5432)" -ForegroundColor White
        Write-Host "3. Expandir Servers > PostgreSQL > Databases" -ForegroundColor White
        Write-Host "4. Clic derecho en 'control_usuarios' > Backup" -ForegroundColor White
        Write-Host "5. Elegir ubicación y formato (Custom recomendado)" -ForegroundColor White
        Write-Host "6. Click Backup" -ForegroundColor White
        Write-Host ""
        Write-Host "OPCIÓN B - Encontrar PostgreSQL manualmente:" -ForegroundColor Cyan
        Write-Host "1. Buscar carpeta PostgreSQL en:" -ForegroundColor White
        Write-Host "   - C:\Program Files\PostgreSQL\" -ForegroundColor Gray
        Write-Host "   - C:\Program Files (x86)\PostgreSQL\" -ForegroundColor Gray
        Write-Host "2. Ir a la subcarpeta \bin\" -ForegroundColor White
        Write-Host "3. Abrir Command Prompt en esa ubicación" -ForegroundColor White
        Write-Host "4. Ejecutar: pg_dump -h localhost -p 5432 -U postgres -d control_usuarios > backup.sql" -ForegroundColor White
        Write-Host ""
        Write-Host "OPCIÓN C - Verificar servicios:" -ForegroundColor Cyan
        Write-Host "1. Abrir 'services.msc'" -ForegroundColor White
        Write-Host "2. Buscar servicio 'postgresql-*'" -ForegroundColor White
        Write-Host "3. Verificar que esté 'Running'" -ForegroundColor White
        Write-Host "4. Si no está, hacer clic derecho > Start" -ForegroundColor White
    }
    
    default {
        Write-Host "Opción no válida" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
