
import "reflect-metadata";
import { AppDataSource } from './data-source';
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Cargar variables de entorno
require('dotenv').config();

AppDataSource.initialize().then(() => {
  console.log("✅ Conexión a base de datos establecida");
  const app = express();
  
  // Configurar CORS para producción
  const corsOptions = {
    origin: [
      'https://analistafacturacion.github.io',
      'http://localhost:5173',
      'http://localhost:3000',
      'https://control-facturacion-hlips.onrender.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  };
  
  app.use(cors(corsOptions));
  
  // Middleware adicional para manejar preflight OPTIONS
  app.use((req: any, res: any, next: any) => {
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Origin', req.headers.origin);
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.status(200).end();
      return;
    }
    next();
  });
  
  app.use(express.json());

  // Health check endpoint para Render
  app.get('/api/health', (req: any, res: any) => {
    res.status(200).json({ 
      status: 'OK', 
      message: 'Control Facturación API está funcionando',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Crear servidor HTTP y Socket.IO
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: [
        'https://analistafacturacion.github.io',
        'http://localhost:5173',
        'http://localhost:3000',
        'https://control-facturacion-hlips.onrender.com'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  // Exponer io para las rutas
  app.set('io', io);

  // Rutas de usuarios
  const userRoutes = require('./routes/userRoutes').default;
  app.use('/api/users', userRoutes);

  // Rutas de facturación evento
  const facturacionEventoRoutes = require('./routes/facturacionEventoRoutes').default;
  app.use('/api/facturacion', (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {
    (req as any).io = io;
    next();
  }, facturacionEventoRoutes);

  // Rutas de anulaciones
  const anulacionRoutes = require('./routes/anulacionRoutes').default;
  app.use('/api/anulaciones', anulacionRoutes);

  // Rutas de aseguradoras
  const aseguradoraRoutes = require('./routes/aseguradoraRoutes').default;
  app.use('/api/aseguradoras', aseguradoraRoutes);

  // Rutas de sedes
  const sedeRoutes = require('./routes/sedeRoutes').default;
  app.use('/api/sedes', sedeRoutes);

  // Rutas de cups (configuración)
  const cupsRoutes = require('./routes/cupsRoutes').default;
  app.use('/api/cups', cupsRoutes);

  // Rutas de migración
  const migrationRoutes = require('./routes/migrationRoutes').default;
  app.use('/api/migration', migrationRoutes);

    // Rutas de validación avanzada
    const validacionRoutes = require('./routes/validacionRoutes').default;
    app.use('/api/validacion', validacionRoutes);

  // Documentación OpenAPI
  const openapiPath = path.join(__dirname, '../../docs/api/openapi.yaml');
  const openapiSpec = fs.existsSync(openapiPath) ? fs.readFileSync(openapiPath, 'utf8') : '';
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(undefined, { swaggerOptions: { url: '/api/openapi.yaml' } }));
  app.get('/api/openapi.yaml', (req: any, res: any) => {
    res.setHeader('Content-Type', 'text/yaml');
    res.send(openapiSpec);
  });

  // Endpoint de prueba
  app.get('/api/health', (req: import('express').Request, res: import('express').Response) => res.json({ status: 'ok' }));

  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`Backend escuchando en http://localhost:${PORT}`);
    console.log('Socket.IO listo');
  });
}).catch((error: any) => {
  console.error('Error al conectar con la base de datos:', error);
  console.error('DATABASE_URL configurada:', process.env.DATABASE_URL ? 'SÍ' : 'NO');
  console.error('NODE_ENV:', process.env.NODE_ENV);
});
