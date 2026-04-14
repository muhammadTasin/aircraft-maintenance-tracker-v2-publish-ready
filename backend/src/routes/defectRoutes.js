import express from 'express';
import { createDefect, getDefects, updateDefect } from '../controllers/defectController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getDefects);
router.post('/', protect, createDefect);
router.put('/:id', protect, updateDefect);

export default router;
