import express from 'express';
import { getOverdueAlerts } from '../controllers/alertController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/overdue-maintenance', protect, getOverdueAlerts);
router.get('/operational', protect, getOverdueAlerts);

export default router;
