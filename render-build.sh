# Render Build Script para Backend
echo "🚀 Configurando backend para Render..."

# Instalar dependencias
npm install

# Instalar dependencias específicas del backend
cd apps/backend
npm install

# Build del proyecto
npm run build

echo "✅ Backend listo para Render!"
