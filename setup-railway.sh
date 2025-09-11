#!/bin/bash

echo "🚀 CONFIGURACIÓN AUTOMÁTICA PARA RAILWAY"
echo "======================================"

# Colores para mejor visualización
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. Verificando dependencias...${NC}"

# Verificar Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js instalado: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js no encontrado. Instálalo desde https://nodejs.org/${NC}"
    exit 1
fi

# Verificar npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm instalado: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm no encontrado${NC}"
    exit 1
fi

# Verificar git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo -e "${GREEN}✅ Git instalado: $GIT_VERSION${NC}"
else
    echo -e "${RED}❌ Git no encontrado. Instálalo desde https://git-scm.com/${NC}"
    exit 1
fi

echo -e "${YELLOW}2. Instalando dependencias del proyecto...${NC}"

# Instalar dependencias raíz
npm install

# Instalar dependencias backend
cd apps/backend
npm install
cd ../..

# Instalar dependencias frontend  
cd apps/frontend
npm install
cd ../..

echo -e "${GREEN}✅ Dependencias instaladas correctamente${NC}"

echo -e "${YELLOW}3. Configurando Git...${NC}"

# Inicializar git si no existe
if [ ! -d ".git" ]; then
    git init
    echo -e "${GREEN}✅ Repositorio Git inicializado${NC}"
else
    echo -e "${GREEN}✅ Repositorio Git ya existe${NC}"
fi

# Agregar archivos
git add .

# Hacer commit
if git diff --staged --quiet; then
    echo -e "${YELLOW}⚠️ No hay cambios para commitear${NC}"
else
    git commit -m "Configuración inicial para Railway deployment"
    echo -e "${GREEN}✅ Cambios commiteados${NC}"
fi

echo -e "${YELLOW}4. Verificando estructura de archivos...${NC}"

# Verificar archivos importantes
FILES=("railway.json" "nixpacks.toml" "apps/backend/.env.production" "apps/frontend/.env.production" "migrate.sh")

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file no encontrado${NC}"
    fi
done

echo ""
echo -e "${GREEN}🎉 ¡CONFIGURACIÓN COMPLETADA!${NC}"
echo ""
echo -e "${YELLOW}PRÓXIMOS PASOS:${NC}"
echo "1. Crear repositorio en GitHub"
echo "2. Subir código: git remote add origin <URL> && git push"
echo "3. Crear proyecto en Railway (https://railway.app)"
echo "4. Conectar repositorio GitHub"
echo "5. Configurar variables de entorno"
echo ""
echo -e "${YELLOW}LEE LA GUÍA COMPLETA:${NC} GUIA_RAILWAY_DEPLOY.md"
echo ""
echo -e "${GREEN}¡Tu aplicación estará lista en Railway en 15-30 minutos! 🚀${NC}"
