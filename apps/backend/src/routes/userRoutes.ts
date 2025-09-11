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

export default router;