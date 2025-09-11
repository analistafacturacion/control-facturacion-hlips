#!/bin/bash

# Script de despliegue para control-facturacion-hlips
# Este script hace commit y push de todos los cambios para desplegar automáticamente

echo "🚀 Iniciando proceso de despliegue..."

# Verificar si estamos en un repositorio git
if [ ! -d ".git" ]; then
    echo "❌ Error: No se encontró repositorio git"
    exit 1
fi

# Agregar todos los cambios
echo "📁 Agregando archivos modificados..."
git add .

# Verificar si hay cambios para hacer commit
if git diff --staged --quiet; then
    echo "ℹ️  No hay cambios para hacer commit"
    echo "✅ Repositorio ya está actualizado"
    exit 0
fi

# Solicitar mensaje de commit
read -p "💬 Ingresa el mensaje de commit (presiona Enter para usar mensaje automático): " commit_message

# Usar mensaje automático si no se proporciona uno
if [ -z "$commit_message" ]; then
    commit_message="feat: actualización automática - $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Hacer commit
echo "💾 Haciendo commit: $commit_message"
git commit -m "$commit_message"

# Push a la rama main
echo "⬆️  Subiendo cambios a GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡Despliegue iniciado exitosamente!"
    echo ""
    echo "📌 Próximos pasos:"
    echo "   1. GitHub Actions construirá y desplegará automáticamente"
    echo "   2. Frontend estará disponible en GitHub Pages en ~2-3 minutos"
    echo "   3. Backend se desplegará automáticamente en Render"
    echo ""
    echo "🔗 Monitorear progreso en:"
    echo "   - GitHub Actions: https://github.com/tu-usuario/control-facturacion-hlips/actions"
    echo "   - Render Dashboard: https://dashboard.render.com/"
    echo ""
else
    echo "❌ Error durante el push. Revisa la configuración de Git."
    exit 1
fi
