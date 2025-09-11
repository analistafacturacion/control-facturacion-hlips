#!/usr/bin/env pwsh

# Script para gestionar duplicados en la base de datos de facturación
# Uso: .\manage-duplicates.ps1

param(
    [Parameter()]
    [string]$Action = "detect",  # detect, remove-all, remove-specific
    
    [Parameter()]
    [string]$NumeroFactura = "",
    
    [Parameter()]
    [string]$BaseUrl = "https://control-facturacion-hlips.onrender.com/api/migration"
)

Write-Host "🔍 Gestión de Duplicados - Control Facturación" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

switch ($Action.ToLower()) {
    "detect" {
        Write-Host "🔍 Detectando duplicados..." -ForegroundColor Yellow
        
        try {
            $response = Invoke-WebRequest -Uri "$BaseUrl/detect-duplicates" -Method GET
            $data = $response.Content | ConvertFrom-Json
            
            if ($data.success) {
                Write-Host "✅ Detección completada!" -ForegroundColor Green
                Write-Host ""
                Write-Host "📊 ESTADÍSTICAS:" -ForegroundColor White
                Write-Host "  • Duplicados por número: $($data.statistics.duplicatesByNumber)" -ForegroundColor White
                Write-Host "  • Duplicados por clave: $($data.statistics.duplicatesByKey)" -ForegroundColor White
                Write-Host "  • Duplicados recientes (30 días): $($data.statistics.recentDuplicates)" -ForegroundColor White
                
                if ($data.duplicates.recent.Count -gt 0) {
                    Write-Host ""
                    Write-Host "🚨 DUPLICADOS RECIENTES:" -ForegroundColor Red
                    foreach ($dup in $data.duplicates.recent) {
                        Write-Host "  • Factura: $($dup.numeroFactura) - Cantidad: $($dup.cantidad) - IDs: $($dup.ids)" -ForegroundColor Yellow
                    }
                }
                
                if ($data.duplicates.byNumber.Count -gt 0) {
                    Write-Host ""
                    Write-Host "📋 PRIMEROS 10 DUPLICADOS:" -ForegroundColor White
                    $top10 = $data.duplicates.byNumber | Select-Object -First 10
                    foreach ($dup in $top10) {
                        Write-Host "  • $($dup.numeroFactura): $($dup.cantidad) copias (IDs: $($dup.ids))" -ForegroundColor White
                    }
                }
            }
        } catch {
            Write-Host "❌ Error detectando duplicados: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    "remove-all" {
        Write-Host "⚠️  ELIMINANDO TODOS LOS DUPLICADOS..." -ForegroundColor Red
        Write-Host "Esto conservará solo el registro más reciente de cada factura." -ForegroundColor Yellow
        
        $confirm = Read-Host "¿Estás seguro? (escribe 'SI' para continuar)"
        if ($confirm -eq "SI") {
            try {
                $response = Invoke-WebRequest -Uri "$BaseUrl/remove-all-duplicates" -Method POST
                $data = $response.Content | ConvertFrom-Json
                
                if ($data.success) {
                    Write-Host "✅ Duplicados eliminados: $($data.deletedCount)" -ForegroundColor Green
                } else {
                    Write-Host "❌ Error: $($data.message)" -ForegroundColor Red
                }
            } catch {
                Write-Host "❌ Error eliminando duplicados: $($_.Exception.Message)" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ Operación cancelada." -ForegroundColor Yellow
        }
    }
    
    "remove-specific" {
        if ($NumeroFactura -eq "") {
            Write-Host "❌ Se requiere -NumeroFactura para eliminar duplicados específicos" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "🗑️  Eliminando duplicados de factura: $NumeroFactura" -ForegroundColor Yellow
        
        try {
            $body = @{ numeroFactura = $NumeroFactura } | ConvertTo-Json
            $response = Invoke-WebRequest -Uri "$BaseUrl/remove-duplicates" -Method POST -Body $body -ContentType "application/json"
            $data = $response.Content | ConvertFrom-Json
            
            if ($data.success) {
                Write-Host "✅ $($data.message)" -ForegroundColor Green
                Write-Host "📊 Registros eliminados: $($data.deletedCount)" -ForegroundColor White
            } else {
                Write-Host "❌ Error: $($data.message)" -ForegroundColor Red
            }
        } catch {
            Write-Host "❌ Error eliminando duplicados: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    default {
        Write-Host "❌ Acción no válida. Usa: detect, remove-all, remove-specific" -ForegroundColor Red
        Write-Host ""
        Write-Host "📖 EJEMPLOS DE USO:" -ForegroundColor White
        Write-Host "  .\manage-duplicates.ps1 -Action detect" -ForegroundColor Gray
        Write-Host "  .\manage-duplicates.ps1 -Action remove-specific -NumeroFactura 'FAC123'" -ForegroundColor Gray
        Write-Host "  .\manage-duplicates.ps1 -Action remove-all" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🔗 Para más ayuda, revisa el archivo DUPLICATES_MANAGEMENT.md" -ForegroundColor Cyan
