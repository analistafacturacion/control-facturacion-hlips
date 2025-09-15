// Script para insertar aseguradoras de prueba
import "reflect-metadata";
import { AppDataSource } from './src/data-source';
import { getRepository } from 'typeorm';
import { Aseguradora } from './src/entity/Aseguradora';

const aseguradorasDePrueba = [
  { nombrePergamo: "NUEVA EPS", nombre: "NUEVA EPS S.A.", iniciales: "NEP" },
  { nombrePergamo: "SURA", nombre: "SURA EPS", iniciales: "SUR" },
  { nombrePergamo: "SANITAS", nombre: "SANITAS S.A.", iniciales: "SAN" },
  { nombrePergamo: "FAMISANAR", nombre: "FAMISANAR EPS", iniciales: "FAM" },
  { nombrePergamo: "COMPENSAR", nombre: "COMPENSAR EPS", iniciales: "COM" },
  { nombrePergamo: "SALUD TOTAL", nombre: "SALUD TOTAL S.A.", iniciales: "STO" },
  { nombrePergamo: "MEDIMAS", nombre: "MEDIMAS EPS", iniciales: "MED" },
  { nombrePergamo: "CAFESALUD", nombre: "CAFESALUD EPS", iniciales: "CAF" }
];

async function insertarAseguradorasDePrueba() {
  try {
    console.log('Conectando a la base de datos...');
    await AppDataSource.initialize();
    
    console.log('Obteniendo repositorio de aseguradoras...');
    const aseguradoraRepo = getRepository(Aseguradora);
    
    // Verificar si ya existen aseguradoras
    const aseguradorasExistentes = await aseguradoraRepo.count();
    console.log(`Aseguradoras existentes: ${aseguradorasExistentes}`);
    
    if (aseguradorasExistentes === 0) {
      console.log('Insertando aseguradoras de prueba...');
      
      for (const aseg of aseguradorasDePrueba) {
        const nuevaAseguradora = aseguradoraRepo.create(aseg);
        await aseguradoraRepo.save(nuevaAseguradora);
        console.log(`✅ Insertada: ${aseg.nombre}`);
      }
      
      console.log('🎉 Todas las aseguradoras de prueba han sido insertadas');
    } else {
      console.log('⚠️ Ya existen aseguradoras en la base de datos. No se insertarán duplicados.');
      
      // Mostrar las aseguradoras existentes
      const aseguradoras = await aseguradoraRepo.find();
      console.log('Aseguradoras actuales:');
      aseguradoras.forEach(aseg => {
        console.log(`- ${aseg.nombre} (${aseg.iniciales})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error al insertar aseguradoras:', error);
  } finally {
    console.log('Cerrando conexión...');
    process.exit(0);
  }
}

insertarAseguradorasDePrueba();