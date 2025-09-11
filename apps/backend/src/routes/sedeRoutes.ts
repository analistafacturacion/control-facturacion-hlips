import { Router } from 'express';
import { getRepository } from 'typeorm';
import { Sede } from '../entity/Sede';

const router = Router();

// Obtener todas las sedes
router.get('/', async (req, res) => {
  const repo = getRepository(Sede);
  const sedes = await repo.find();
  res.json(sedes);
});

// Crear sede
router.post('/', async (req, res) => {
  const repo = getRepository(Sede);
  const { nombre, regional, zonal, indicadorFacturacion, iniciales } = req.body;
  if (!nombre || !regional || !zonal || !indicadorFacturacion || !iniciales) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  const sede = repo.create({ nombre, regional, zonal, indicadorFacturacion, iniciales });
  await repo.save(sede);
  res.status(201).json(sede);
});

// Actualizar sede
router.put('/:id', async (req, res) => {
  const repo = getRepository(Sede);
  const { id } = req.params;
  const { nombre, regional, zonal, indicadorFacturacion, iniciales } = req.body;
  const sede = await repo.findOne({ where: { id: Number(id) } });
  if (!sede) return res.status(404).json({ error: 'Sede no encontrada' });
  sede.nombre = nombre;
  sede.regional = regional;
  sede.zonal = zonal;
  sede.indicadorFacturacion = indicadorFacturacion;
  sede.iniciales = iniciales;
  await repo.save(sede);
  res.json(sede);
});

// Eliminar sede
router.delete('/:id', async (req, res) => {
  const repo = getRepository(Sede);
  const { id } = req.params;
  const sede = await repo.findOne({ where: { id: Number(id) } });
  if (!sede) return res.status(404).json({ error: 'Sede no encontrada' });
  await repo.remove(sede);
  res.json({ ok: true });
});

export default router;
