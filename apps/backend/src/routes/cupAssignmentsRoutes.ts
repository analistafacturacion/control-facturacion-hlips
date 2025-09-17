import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';

const router = Router();

// GET / -> list all
router.get('/', async (req: Request, res: Response) => {
  try {
    const repo = getRepository(require('../entity/CupAssignment').CupAssignment);
    const items = await repo.find();
    res.json(items);
  } catch (err) {
    console.error('Error fetching cup assignments', err);
    res.status(500).json({ error: 'Error fetching cup assignments' });
  }
});

// GET /:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const repo = getRepository(require('../entity/CupAssignment').CupAssignment);
    const item = await repo.findOne({ where: { id: Number(req.params.id) } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error('Error fetching cup assignment', err);
    res.status(500).json({ error: 'Error fetching cup assignment' });
  }
});

// POST /
router.post('/', async (req: Request, res: Response) => {
  try {
    const repo = getRepository(require('../entity/CupAssignment').CupAssignment);
    const data = req.body;
    // basic validation: require at least cupId
    if (!data || !data.cupId) {
      return res.status(400).json({ error: 'cupId es obligatorio' });
    }
    const item = repo.create(data);
    await repo.save(item);
    res.status(201).json(item);
  } catch (err: any) {
    console.error('Error creating cup assignment', err);
    const payload: any = { error: 'Error creating cup assignment' };
    if (process.env.NODE_ENV !== 'production') payload.details = (err as any)?.message || String(err);
    res.status(500).json(payload);
  }
});

// PUT /:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const repo = getRepository(require('../entity/CupAssignment').CupAssignment);
    const id = Number(req.params.id);
    let item = await repo.findOne({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    const data = req.body;
    repo.merge(item, data);
    await repo.save(item);
    res.json(item);
  } catch (err: any) {
    console.error('Error updating cup assignment', err);
    const payload: any = { error: 'Error updating cup assignment' };
    if (process.env.NODE_ENV !== 'production') payload.details = (err as any)?.message || String(err);
    res.status(500).json(payload);
  }
});

// DELETE /:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const repo = getRepository(require('../entity/CupAssignment').CupAssignment);
    const id = Number(req.params.id);
    await repo.delete(id);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting cup assignment', err);
    res.status(500).json({ error: 'Error deleting cup assignment' });
  }
});

export default router;
