import MaintenanceTask from '../models/MaintenanceTask.js';
import Defect from '../models/Defect.js';
import Aircraft from '../models/Aircraft.js';
import { buildOperationalAlerts } from '../utils/alertHelpers.js';

export async function getOverdueAlerts(req, res, next) {
  try {
    const tasks = await MaintenanceTask.find({ status: { $ne: 'Completed' } })
      .populate('aircraft', 'registration model status totalFlightHours totalFlightCycles')
      .sort({ dueDate: 1 });
    const defects = await Defect.find({ status: { $ne: 'Resolved' } })
      .populate('aircraft', 'registration model status airworthinessStatus')
      .sort({ createdAt: -1 });
    const aircraft = await Aircraft.find().sort({ registration: 1 });

    const alerts = buildOperationalAlerts({ tasks, defects, aircraft });

    res.json({
      count: alerts.overdueTasks.length,
      items: alerts.overdueTasks,
      ...alerts,
    });
  } catch (error) {
    next(error);
  }
}
