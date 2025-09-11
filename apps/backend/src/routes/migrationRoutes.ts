import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import { FacturacionEvento } from '../entity/FacturacionEvento';
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

// Endpoint para detectar facturas duplicadas
router.get('/detect-duplicates', async (req: Request, res: Response) => {
  try {
    const connection = await AppDataSource.initialize();
    
    // Detectar duplicados por número de factura
    const duplicatesByNumber = await connection.query(`
      SELECT 
        "numeroFactura",
        COUNT(*) as cantidad,
        STRING_AGG(id::text, ', ') as ids,
        STRING_AGG(fecha::text, ', ') as fechas,
        STRING_AGG(valor::text, ', ') as valores
      FROM facturacion_evento 
      GROUP BY "numeroFactura" 
      HAVING COUNT(*) > 1
      ORDER BY cantidad DESC, "numeroFactura";
    `);
    
    // Detectar duplicados por combinación de campos clave
    const duplicatesByKey = await connection.query(`
      SELECT 
        "numeroFactura",
        fecha,
        valor,
        aseguradora,
        COUNT(*) as cantidad,
        STRING_AGG(id::text, ', ') as ids
      FROM facturacion_evento 
      GROUP BY "numeroFactura", fecha, valor, aseguradora
      HAVING COUNT(*) > 1
      ORDER BY cantidad DESC;
    `);
    
    // Duplicados del último mes
    const recentDuplicates = await connection.query(`
      SELECT 
        "numeroFactura",
        COUNT(*) as cantidad,
        STRING_AGG(id::text, ', ') as ids,
        STRING_AGG(fecha::text, ', ') as fechas
      FROM facturacion_evento 
      WHERE fecha >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY "numeroFactura" 
      HAVING COUNT(*) > 1
      ORDER BY cantidad DESC;
    `);
    
    res.json({
      success: true,
      statistics: {
        duplicatesByNumber: duplicatesByNumber.length,
        duplicatesByKey: duplicatesByKey.length,
        recentDuplicates: recentDuplicates.length
      },
      duplicates: {
        byNumber: duplicatesByNumber,
        byKey: duplicatesByKey,
        recent: recentDuplicates
      }
    });
    
  } catch (error) {
    console.error('Error detecting duplicates:', error);
    res.status(500).json({
      success: false,
      message: 'Error al detectar duplicados',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Endpoint para eliminar duplicados específicos (solo conserva el más reciente)
router.post('/remove-duplicates', async (req: Request, res: Response) => {
  try {
    const { numeroFactura, keepNewest = true } = req.body;
    const connection = await AppDataSource.initialize();
    
    if (numeroFactura) {
      // Eliminar duplicados de una factura específica
      const orderBy = keepNewest ? 'DESC' : 'ASC';
      const result = await connection.query(`
        DELETE FROM facturacion_evento 
        WHERE id NOT IN (
          SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (
              PARTITION BY "numeroFactura" 
              ORDER BY id ${orderBy}
            ) as rn
            FROM facturacion_evento 
            WHERE "numeroFactura" = $1
          ) t WHERE rn = 1
        ) AND "numeroFactura" = $1;
      `, [numeroFactura]);
      
      res.json({
        success: true,
        message: `Duplicados eliminados para factura ${numeroFactura}`,
        deletedCount: result.rowCount || 0
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Se requiere el numeroFactura'
      });
    }
    
  } catch (error) {
    console.error('Error removing duplicates:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar duplicados',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Endpoint para eliminar TODOS los duplicados automáticamente (conserva el más reciente)
router.post('/remove-all-duplicates', async (req: Request, res: Response) => {
  try {
    const connection = await AppDataSource.initialize();
    
    // Eliminar duplicados conservando el registro con ID más alto (más reciente)
    const result = await connection.query(`
      DELETE FROM facturacion_evento 
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (
            PARTITION BY "numeroFactura" 
            ORDER BY id DESC
          ) as rn
          FROM facturacion_evento
        ) t WHERE rn = 1
      );
    `);
    
    res.json({
      success: true,
      message: 'Todos los duplicados han sido eliminados (conservando el más reciente)',
      deletedCount: result.rowCount || 0
    });
    
  } catch (error) {
    console.error('Error removing all duplicates:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar todos los duplicados',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export { router as default };
