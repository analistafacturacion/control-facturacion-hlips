# CONFIGURACIÓN EXACTA PARA RENDER

## BACKEND WEB SERVICE
- **Name**: control-facturacion-backend
- **Region**: Oregon (US West)
- **Branch**: main
- **Root Directory**: apps/backend
- **Runtime**: Node
- **Build Command**: npm install && npm run build
- **Start Command**: npm start
- **Instance Type**: Free

## VERIFICACIONES IMPORTANTES
1. Root Directory debe ser exactamente: `apps/backend`
2. NO usar: `backend`, `src/backend`, `/apps/backend`
3. Solo: `apps/backend`

## SI NECESITAS RECREAR EL SERVICIO:
1. Delete el servicio actual
2. New + → Web Service
3. Seleccionar tu repo: analistafacturacion/control-facturacion-hlips
4. Configurar exactamente como arriba

## ESTRUCTURA ESPERADA:
```
Repository Root/
├── apps/
│   ├── backend/          ← Root Directory debe apuntar aquí
│   │   ├── package.json
│   │   ├── src/
│   │   └── ...
│   └── frontend/
├── docs/
└── ...
```
