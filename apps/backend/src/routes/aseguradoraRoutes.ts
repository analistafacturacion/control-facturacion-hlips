import { Router } from 'express';
import { getRepository } from 'typeorm';
import { Aseguradora } from '../entity/Aseguradora';

const router = Router();

// Obtener todas las aseguradoras
router.get('/', async (req, res) => {
  const repo = getRepository(Aseguradora);
  const aseguradoras = await repo.find();
  res.json(aseguradoras);
});

// Crear aseguradora
router.post('/', async (req, res) => {
  const repo = getRepository(Aseguradora);
  const { nombrePergamo, nombre, iniciales } = req.body;
  if (!nombrePergamo || !nombre || !iniciales || iniciales.length !== 3) {
    return res.status(400).json({ error: 'Todos los campos son requeridos y las iniciales deben tener 3 letras' });
  }
  const aseguradora = repo.create({ nombrePergamo, nombre, iniciales: iniciales.toUpperCase() });
  await repo.save(aseguradora);
  res.status(201).json(aseguradora);
});


// Editar aseguradora
router.put('/:id', async (req, res) => {
  const repo = getRepository(Aseguradora);
  const { id } = req.params;
  const { nombrePergamo, nombre, iniciales } = req.body;
  const aseguradora = await repo.findOne({ where: { id: parseInt(id) } });
  if (!aseguradora) return res.status(404).json({ error: 'No encontrada' });
  aseguradora.nombrePergamo = nombrePergamo;
  aseguradora.nombre = nombre;
  aseguradora.iniciales = iniciales.toUpperCase();
  await repo.save(aseguradora);
  res.json(aseguradora);
});

// Eliminar aseguradora
router.delete('/:id', async (req, res) => {
  const repo = getRepository(Aseguradora);
  const { id } = req.params;
  const aseguradora = await repo.findOne({ where: { id: parseInt(id) } });
  if (!aseguradora) return res.status(404).json({ error: 'No encontrada' });
  await repo.remove(aseguradora);
  res.json({ success: true });
});

export default router;
