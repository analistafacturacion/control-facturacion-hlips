import { Router } from 'express';
import { getRepository } from 'typeorm';
import { FacturacionEvento } from '../entity/FacturacionEvento';
import { Anulacion } from '../entity/Anulacion';

const router = Router();

// POST /api/validar-filas
// Recibe: [{ numeroFactura, aseguradora, sede, ... }]
// Devuelve: [{ resultado, mensaje, color, ... }]
router.post('/validar-filas', async (req, res) => {
  try {
    const filas = req.body;
    if (!Array.isArray(filas)) {
      return res.status(400).json({ error: 'El cuerpo debe ser un array de filas' });
    }
    const facturacionRepo = getRepository(FacturacionEvento);
    const anulacionRepo = getRepository(Anulacion);
    // Pre-cargar todas las facturas y anulaciones para eficiencia
    const facturasBD = await facturacionRepo.find();
    const anulacionesBD = await anulacionRepo.find();
    const resultados = filas.map((fila, idx) => {
      const num = (fila.numeroFactura || fila.factura || '').replace(/[^a-zA-Z0-9]/g, '');
      const factura = facturasBD.find(f => (f.numeroFactura || '').replace(/[^a-zA-Z0-9]/g, '') === num);
      const anulacion = anulacionesBD.find(a => (a.numeroAnulacion || '').replace(/[^a-zA-Z0-9]/g, '') === num);
      console.log(`--- [VALIDACION] Fila ${idx+1} ---`);
      console.log('Factura recibida:', fila);
      console.log('Factura en BD:', factura);
      console.log('Anulacion en BD:', anulacion);
      if (!factura && !anulacion) {
        console.log('Resultado: No existe. No se encontró en la base de datos.');
        return { ...fila, resultado: 'No existe', mensaje: 'No se encontró en la base de datos', color: 'gray' };
      }
      if (anulacion) {
        if (anulacion.estado && anulacion.estado.trim().toUpperCase() === 'ANULADA') {
          console.log('Resultado: Anulada. Estado ANULADA en Anulacion.');
          return { ...fila, resultado: 'Anulada', mensaje: 'Factura anulada', color: 'red' };
        } else {
          console.log(`Resultado: Anulación registrada. Estado: ${anulacion.estado}`);
          return { ...fila, resultado: 'Anulación registrada', mensaje: `Estado: ${anulacion.estado || 'Desconocido'}`, color: 'orange' };
        }
      }
      if (factura) {
        let inconsistencias = [];
        if (fila.aseguradora && factura.aseguradora && fila.aseguradora.trim().toUpperCase() !== factura.aseguradora.trim().toUpperCase()) {
          inconsistencias.push('Aseguradora diferente');
        }
        if (fila.sede && factura.sede && fila.sede.trim().toUpperCase() !== factura.sede.nombre.trim().toUpperCase()) {
          inconsistencias.push('Sede diferente');
        }
        if (factura.periodo && factura.periodo.trim().toUpperCase() === 'ANULADA') {
          console.log('Resultado: Anulada. Estado ANULADA en FacturacionEvento.');
          return { ...fila, resultado: 'Anulada', mensaje: 'Factura anulada (evento)', color: 'red' };
        }
        if (inconsistencias.length > 0) {
          console.log('Resultado: Inconsistente.', inconsistencias.join(', '));
          return { ...fila, resultado: 'Inconsistente', mensaje: inconsistencias.join(', '), color: 'yellow' };
        }
        console.log('Resultado: Válida. Factura válida.');
        return { ...fila, resultado: 'Válida', mensaje: 'Factura válida', color: 'green' };
      }
      console.log('Resultado: No existe. Caso genérico.');
      return { ...fila, resultado: 'No existe', mensaje: 'No se encontró en la base de datos', color: 'gray' };
    });
    res.json({ ok: true, resultados });
  } catch (err) {
    res.status(500).json({ error: 'Error en la validación', details: err });
  }
});

export default router;
