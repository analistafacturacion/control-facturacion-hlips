import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import fetch from 'node-fetch';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// Endpoint de login
router.post('/login', async (req: Request, res: Response) => {
  const repo = getRepository(User);
  const { usuario, password, rol } = req.body;
  if (!usuario || !password || !rol) {
    return res.status(400).json({ error: 'Usuario, contraseña y rol son obligatorios' });
  }
  const user = await repo.findOne({ where: { usuario } });
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  // Validar rol (sin importar mayúsculas/minúsculas)
  if (user.rol.toLowerCase() !== rol.toLowerCase()) {
    return res.status(403).json({ error: 'No tiene permisos para acceder con este rol' });
  }
  let validPassword = false;
  if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
    validPassword = await bcrypt.compare(password, user.password);
  } else {
    validPassword = user.password === password;
  }
  if (!validPassword) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  // Obtener token de Pergamo
  let pergamoToken = null;
  try {
    const pergamoPayload = { username: usuario, password };
    const pergamoRes = await fetch('https://backpergamo.hlips.com.co/api/login', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': 'https://pergamo.hlips.com.co',
        'Referer': 'https://pergamo.hlips.com.co/',
        'User-Agent': 'Mozilla/5.0',
        'Accept-Language': 'es-419,es;q=0.9'
      },
      body: JSON.stringify(pergamoPayload)
    });
    const pergamoText = await pergamoRes.text();
    let pergamoData;
    try {
      pergamoData = JSON.parse(pergamoText);
    } catch {
      pergamoData = { raw: pergamoText };
    }
    if (pergamoRes.ok && pergamoData.access_token) {
      pergamoToken = pergamoData.access_token;
    } else {
      pergamoToken = null;
    }
  } catch (e) {
    pergamoToken = null;
  }

  const token = jwt.sign({ id: user.id, usuario: user.usuario, rol: user.rol }, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });
  res.json({ token, usuario: user.usuario, rol: user.rol, nombre: user.nombre, pergamoToken });
});

// Obtener todos los usuarios
router.get('/', async (req: Request, res: Response) => {
  const repo = getRepository(User);
  const users = await repo.find();
  res.json(users);
});

// Endpoint temporal para debugging - mostrar info detallada de usuarios
router.get('/debug', async (req: Request, res: Response) => {
  const repo = getRepository(User);
  const users = await repo.find();
  const debug = users.map((user: User) => ({
    id: user.id,
    usuario: user.usuario,
    rol: user.rol,
    nombre: user.nombre,
    estado: user.estado,
    aseguradoras: user.aseguradoras,
    passwordHash: user.password,
    passwordLength: user.password.length,
    isBcrypt: user.password.startsWith('$2a$') || user.password.startsWith('$2b$')
  }));
  res.json(debug);
});

// Endpoint para mostrar configuración de base de datos (solo para debugging)
router.get('/config', async (req: Request, res: Response) => {
  const config = {
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL ? 'CONFIGURADA' : 'NO CONFIGURADA',
    databaseUrlLength: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    database: process.env.DB_NAME
  };
  res.json(config);
});

// Endpoint para migrar el usuario real JUAN BENAVIDES
router.post('/migrate-real-user', async (req: Request, res: Response) => {
  try {
    const repo = getRepository(User);
    
    // Datos del usuario real
    const userData = {
      nombre: 'JUAN BENAVIDES',
      usuario: '1100967623',
      rol: 'admin',
      aseguradoras: [],
      password: 'Heli2025*', // Password que me diste
      estado: true
    };
    
    // Hashear el password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Verificar si el usuario ya existe
    const existingUser = await repo.findOne({ where: { usuario: userData.usuario } });
    
    if (existingUser) {
      // Actualizar usuario existente
      existingUser.nombre = userData.nombre;
      existingUser.rol = userData.rol;
      existingUser.password = hashedPassword;
      existingUser.estado = userData.estado;
      existingUser.aseguradoras = userData.aseguradoras;
      
      const updatedUser = await repo.save(existingUser);
      res.json({ 
        success: true, 
        action: 'updated',
        user: {
          id: updatedUser.id,
          nombre: updatedUser.nombre,
          usuario: updatedUser.usuario,
          rol: updatedUser.rol,
          estado: updatedUser.estado
        }
      });
    } else {
      // Crear nuevo usuario
      const newUser = repo.create({
        nombre: userData.nombre,
        usuario: userData.usuario,
        rol: userData.rol,
        aseguradoras: userData.aseguradoras,
        password: hashedPassword,
        estado: userData.estado
      });
      
      const savedUser = await repo.save(newUser);
      res.json({ 
        success: true, 
        action: 'created',
        user: {
          id: savedUser.id,
          nombre: savedUser.nombre,
          usuario: savedUser.usuario,
          rol: savedUser.rol,
          estado: savedUser.estado
        }
      });
    }
    
  } catch (error) {
    console.error('Error migrating user:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
});

// Crear usuario
router.post('/', async (req: Request, res: Response) => {
  const repo = getRepository(User);
  const { nombre, usuario, rol, aseguradoras, password } = req.body;
  if (!nombre || !usuario || !rol || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  const existingUser = await repo.findOne({ where: { usuario } });
  if (existingUser) {
    return res.status(409).json({ error: 'El usuario ya existe. No se puede registrar dos veces.' });
  }
  if (Array.isArray(rol)) {
    return res.status(400).json({ error: 'Solo se puede asignar un rol por usuario.' });
  }
  try {
    const pergamoPayload = { username: usuario, password };
    const pergamoRes = await fetch('https://backpergamo.hlips.com.co/api/login', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': 'https://pergamo.hlips.com.co',
        'Referer': 'https://pergamo.hlips.com.co/',
        'User-Agent': 'Mozilla/5.0',
        'Accept-Language': 'es-419,es;q=0.9'
      },
      body: JSON.stringify(pergamoPayload)
    });
    const pergamoText = await pergamoRes.text();
    let pergamoData;
    try {
      pergamoData = JSON.parse(pergamoText);
    } catch {
      pergamoData = { raw: pergamoText };
    }
    if (!pergamoRes.ok || !pergamoData.access_token) {
      let pergamoMsg = pergamoData.message || pergamoData.error || '';
      if (
        pergamoMsg.toString().toLowerCase().includes('credential_invalid') ||
        pergamoMsg.toString().toLowerCase().includes('credencial')
      ) {
        pergamoMsg = 'No se puede crear usuario, credenciales inválidas';
      } else if (!pergamoMsg) {
        pergamoMsg = 'No se puede crear usuario, credenciales inválidas';
      }
      return res.status(401).json({ error: pergamoMsg });
    }
  } catch (e) {
    return res.status(502).json({ error: 'Error validando con Pergamo' });
  }
  const user = repo.create({ nombre, usuario, rol, aseguradoras, password, estado: true });
  await repo.save(user);
  res.status(201).json({ success: true, message: 'Usuario Registrado Exitosamente', user });
});

// Editar usuario
router.put('/:id', async (req: Request, res: Response) => {
  const repo = getRepository(User);
  const { id } = req.params;
  const { nombre, usuario, rol, aseguradoras, password, estado } = req.body;
  try {
    const user = await repo.findOne({ where: { id: Number(id) } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    user.nombre = nombre ?? user.nombre;
    user.usuario = usuario ?? user.usuario;
    user.rol = rol ?? user.rol;
    user.aseguradoras = aseguradoras ?? user.aseguradoras;
    user.password = password ?? user.password;
    if (typeof estado === 'boolean') user.estado = estado;
    await repo.save(user);
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Error al editar usuario' });
  }
});

// Eliminar usuario
router.delete('/:id', async (req: Request, res: Response) => {
  const repo = getRepository(User);
  const { id } = req.params;
  try {
    const user = await repo.findOne({ where: { id: Number(id) } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    await repo.remove(user);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// Endpoint para ver resumen de toda la base de datos
router.get('/database-summary', async (req: Request, res: Response) => {
  try {
    const { getConnection } = require('typeorm');
    const connection = getConnection();
    
    // Obtener conteos de todas las tablas
    const userCount = await connection.query('SELECT COUNT(*) FROM "user"');
    const aseguradoraCount = await connection.query('SELECT COUNT(*) FROM "aseguradora"');
    const sedeCount = await connection.query('SELECT COUNT(*) FROM "sede"');
    const anulacionCount = await connection.query('SELECT COUNT(*) FROM "anulacion"');
    const facturacionEventoCount = await connection.query('SELECT COUNT(*) FROM "facturacion_evento"');
    const reporteRipsCount = await connection.query('SELECT COUNT(*) FROM "reporte_rips"');
    const ripsFacturaCount = await connection.query('SELECT COUNT(*) FROM "rips_factura"');
    
    const summary = {
      tablas: {
        usuarios: parseInt(userCount[0].count),
        aseguradoras: parseInt(aseguradoraCount[0].count),
        sedes: parseInt(sedeCount[0].count),
        anulaciones: parseInt(anulacionCount[0].count),
        facturacion_eventos: parseInt(facturacionEventoCount[0].count),
        reportes_rips: parseInt(reporteRipsCount[0].count),
        rips_facturas: parseInt(ripsFacturaCount[0].count)
      },
      total_registros: parseInt(userCount[0].count) + 
                     parseInt(aseguradoraCount[0].count) + 
                     parseInt(sedeCount[0].count) + 
                     parseInt(anulacionCount[0].count) + 
                     parseInt(facturacionEventoCount[0].count) + 
                     parseInt(reporteRipsCount[0].count) + 
                     parseInt(ripsFacturaCount[0].count),
      endpoints_disponibles: {
        usuarios: '/api/users',
        usuarios_debug: '/api/users/debug',
        aseguradoras: '/api/aseguradoras',
        sedes: '/api/sedes',
        anulaciones: '/api/anulaciones'
      }
    };
    
    res.json(summary);
    
  } catch (error) {
    console.error('Error getting database summary:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
});

export default router;