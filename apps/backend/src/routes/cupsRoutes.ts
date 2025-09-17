import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';

const router = Router();

// GET / -> list all
router.get('/', async (req: Request, res: Response) => {
  try {
    const repo = getRepository(require('../entity/Cup').Cup);
    const items = await repo.find();
    res.json(items);
  } catch (err) {
    console.error('Error fetching cups', err);
    res.status(500).json({ error: 'Error fetching cups' });
  }
});

// GET /:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const repo = getRepository(require('../entity/Cup').Cup);
    const item = await repo.findOne({ where: { id: Number(req.params.id) } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error('Error fetching cup', err);
    res.status(500).json({ error: 'Error fetching cup' });
  }
});

// POST /
router.post('/', async (req: Request, res: Response) => {
  try {
    const repo = getRepository(require('../entity/Cup').Cup);
    const data = req.body;
    const item = repo.create(data);
    await repo.save(item);
    res.status(201).json(item);
  } catch (err) {
    console.error('Error creating cup', err);
    res.status(500).json({ error: 'Error creating cup' });
  }
});

// PUT /:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const repo = getRepository(require('../entity/Cup').Cup);
    const id = Number(req.params.id);
    let item = await repo.findOne({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    repo.merge(item, req.body);
    await repo.save(item);
    res.json(item);
  } catch (err) {
    console.error('Error updating cup', err);
    res.status(500).json({ error: 'Error updating cup' });
  }
});

// DELETE /:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const repo = getRepository(require('../entity/Cup').Cup);
    const id = Number(req.params.id);
    await repo.delete(id);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting cup', err);
    res.status(500).json({ error: 'Error deleting cup' });
  }
});

export default router;
