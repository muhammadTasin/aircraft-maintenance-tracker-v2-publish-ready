import express from 'express';
import {
  createAircraft,
  getAircraft,
  getAircraftById,
  getAircraftHistory,
  getDashboard,
  updateAircraft,
} from '../controllers/aircraftController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, getDashboard);
router.get('/', protect, getAircraft);
router.post('/', protect, authorize('Admin', 'Maintenance Manager'), createAircraft);
router.get('/:id', protect, getAircraftById);
router.put('/:id', protect, authorize('Admin', 'Maintenance Manager'), updateAircraft);
router.get('/:id/history', protect, getAircraftHistory);

export default router;
