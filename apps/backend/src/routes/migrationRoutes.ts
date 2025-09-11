import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import bcrypt from 'bcryptjs';

const router = Router();

// Endpoint para insertar el usuario real JUAN BENAVIDES
router.post('/migrate-user', async (req: Request, res: Response) => {
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

export { router as default };
