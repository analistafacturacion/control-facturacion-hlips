# Script para actualizar URLs de API en el frontend
$frontendPath = "apps\frontend\src"
$files = Get-ChildItem -Recurse -Path $frontendPath -Include "*.ts", "*.tsx" | Where-Object { $_.Name -ne "api.ts" }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "localhost:3001") {
        Write-Host "Actualizando: $($file.FullName)"
        
        # Agregar import de API_CONFIG si no existe
        if ($content -notmatch "import.*API_CONFIG") {
            $importLine = "import API_CONFIG from '../config/api';"
            $relativePath = (Resolve-Path $file.FullName -Relative).Replace("$frontendPath\", "").Replace("\", "/")
            $depth = ($relativePath.Split("/")).Count - 1
            $importPath = ("../" * $depth) + "config/api"
            $importLine = "import API_CONFIG from '$importPath';"
            
            if ($content -match "^import") {
                $content = $content -replace "(import.*?\n)", "`$1$importLine`n"
            }
        }
        
        # Reemplazar URLs
        $content = $content -replace "http://localhost:3001/api", "`${API_CONFIG.BASE_URL}"
        $content = $content -replace "'http://localhost:3001/api/([^']*)'", "```${API_CONFIG.BASE_URL}/`$1```"
        
        Set-Content $file.FullName $content -Encoding UTF8
    }
}

Write-Host "✅ URLs actualizadas en el frontend"
