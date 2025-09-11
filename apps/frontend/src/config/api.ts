// Configuración de la API
const API_CONFIG = {
  // URL de producción (Render)
  PRODUCTION_URL: 'https://control-facturacion-hlips.onrender.com/api',
  
  // URL de desarrollo local
  DEVELOPMENT_URL: 'http://localhost:3001/api',
  
  // Detectar automáticamente el entorno
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://control-facturacion-hlips.onrender.com/api'
    : window.location.hostname === 'localhost' 
      ? 'http://localhost:3001/api'
      : 'https://control-facturacion-hlips.onrender.com/api'
};

export default API_CONFIG;
