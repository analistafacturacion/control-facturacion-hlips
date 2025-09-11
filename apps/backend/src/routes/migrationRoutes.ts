import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../data-source';

const router = Router();

// Endpoint para arreglar la secuencia del ID de la tabla user
router.post('/fix-user-sequence', async (req: Request, res: Response) => {
  try {
    const connection = await AppDataSource.initialize();
    
    // 1. Crear la secuencia si no existe
    await connection.query(`CREATE SEQUENCE IF NOT EXISTS user_id_seq;`);
    
    // 2. Establecer el valor actual de la secuencia basado en el máximo ID existente
    await connection.query(`SELECT setval('user_id_seq', COALESCE((SELECT MAX(id) FROM "user"), 0) + 1, false);`);
    
    // 3. Alterar la tabla para usar la secuencia como default
    await connection.query(`ALTER TABLE "user" ALTER COLUMN id SET DEFAULT nextval('user_id_seq');`);
    
    // 4. Establecer la secuencia como propiedad de la columna
    await connection.query(`ALTER SEQUENCE user_id_seq OWNED BY "user".id;`);
    
    // Verificar la configuración
    const result = await connection.query(`
      SELECT 
        column_name, 
        column_default, 
        is_nullable, 
        data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user' AND column_name = 'id';
    `);
    
    res.json({
      success: true,
      message: 'Secuencia de ID de user arreglada exitosamente',
      configuration: result[0]
    });
    
  } catch (error) {
    console.error('Error arreglando secuencia de user:', error);
    res.status(500).json({
      success: false,
      message: 'Error al arreglar la secuencia de ID de user',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Endpoint para arreglar todas las secuencias ID de las tablas principales
router.post('/fix-all-sequences', async (req: Request, res: Response) => {
  try {
    const connection = await AppDataSource.initialize();
    const tables = ['user', 'aseguradora', 'sede', 'anulacion', 'facturacion_evento', 'reporte_rips', 'rips_factura'];
    const results: any[] = [];
    
    for (const table of tables) {
      try {
        // 1. Crear la secuencia si no existe
        await connection.query(`CREATE SEQUENCE IF NOT EXISTS ${table}_id_seq;`);
        
        // 2. Establecer el valor actual de la secuencia basado en el máximo ID existente
        await connection.query(`SELECT setval('${table}_id_seq', COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false);`);
        
        // 3. Alterar la tabla para usar la secuencia como default
        await connection.query(`ALTER TABLE "${table}" ALTER COLUMN id SET DEFAULT nextval('${table}_id_seq');`);
        
        // 4. Establecer la secuencia como propiedad de la columna
        await connection.query(`ALTER SEQUENCE ${table}_id_seq OWNED BY "${table}".id;`);
        
        // Verificar la configuración
        const result = await connection.query(`
          SELECT 
            column_name, 
            column_default, 
            is_nullable, 
            data_type 
          FROM information_schema.columns 
          WHERE table_name = '${table}' AND column_name = 'id';
        `);
        
        results.push({
          table: table,
          success: true,
          configuration: result[0]
        });
        
      } catch (tableError) {
        results.push({
          table: table,
          success: false,
          error: tableError instanceof Error ? tableError.message : String(tableError)
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Proceso de corrección de secuencias completado',
      results: results
    });
    
  } catch (error) {
    console.error('Error arreglando secuencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al arreglar las secuencias de ID',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

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
