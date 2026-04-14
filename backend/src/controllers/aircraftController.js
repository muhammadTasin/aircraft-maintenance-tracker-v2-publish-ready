import Aircraft from '../models/Aircraft.js';
import MaintenanceTask from '../models/MaintenanceTask.js';
import Defect from '../models/Defect.js';
import { addAircraftHistory } from '../utils/addAircraftHistory.js';
import {
  deriveAirworthinessStatus,
  mergeAirworthinessStatus,
} from '../constants/domain.js';
import {
  normalizeRegistration,
  parseOptionalDate,
  parseNonNegativeNumberOrDefault,
  safeTrim,
} from '../utils/normalizers.js';
import { buildOperationalAlerts } from '../utils/alertHelpers.js';

function buildAircraftSearchQuery(req) {
  const query = {};
  const search = safeTrim(req.query.search).trim();
  const status = safeTrim(req.query.status).trim();
  const airworthinessStatus = safeTrim(req.query.airworthinessStatus).trim();

  if (search) {
    query.$or = [
      { registration: { $regex: search, $options: 'i' } },
      { model: { $regex: search, $options: 'i' } },
      { manufacturer: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
      { serialNumber: { $regex: search, $options: 'i' } },
    ];
  }

  if (status) {
    query.status = status;
  }

  if (airworthinessStatus) {
    query.airworthinessStatus = airworthinessStatus;
  }

  return query;
}

function calculateSeverityFromStatus(status) {
  if (status === 'AOG') {
    return 'Critical';
  }
  if (status === 'Unserviceable') {
    return 'Warning';
  }
  return 'Info';
}

export async function getDashboard(req, res, next) {
  try {
    const aircraft = await Aircraft.find(buildAircraftSearchQuery(req)).sort({ registration: 1 });
    const activeTasks = await MaintenanceTask.find({ status: { $ne: 'Completed' } })
      .populate('aircraft', 'registration model status totalFlightHours totalFlightCycles')
      .sort({ dueDate: 1, createdAt: -1 });
    const activeDefects = await Defect.find({ status: { $ne: 'Resolved' } })
      .populate('aircraft', 'registration model status')
      .sort({ createdAt: -1 });

    const alerts = buildOperationalAlerts({ tasks: activeTasks, defects: activeDefects, aircraft });

    res.json({
      summary: {
        totalAircraft: aircraft.length,
        serviceable: aircraft.filter((item) => item.status === 'Serviceable').length,
        unserviceable: aircraft.filter((item) => item.status === 'Unserviceable').length,
        aog: aircraft.filter((item) => item.status === 'AOG').length,
        groundedAircraft: alerts.groundedAircraft.length,
        openTasks: activeTasks.length,
        openDefects: activeDefects.length,
        overdueTasks: alerts.overdueTasks.length,
        dueSoonTasks: alerts.dueSoonTasks.length,
        criticalDefects: alerts.criticalDefects.length,
        upcomingChecks: alerts.upcomingChecks.length,
        overdueChecks: alerts.overdueChecks.length,
      },
      aircraft,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAircraft(req, res, next) {
  try {
    const aircraft = await Aircraft.find(buildAircraftSearchQuery(req)).sort({ registration: 1 });
    res.json(aircraft);
  } catch (error) {
    next(error);
  }
}

export async function getAircraftById(req, res, next) {
  try {
    const aircraft = await Aircraft.findById(req.params.id);
    if (!aircraft) {
      res.status(404);
      throw new Error('Aircraft not found.');
    }

    const tasks = await MaintenanceTask.find({ aircraft: aircraft._id }).sort({ dueDate: 1, createdAt: -1 });
    const defects = await Defect.find({ aircraft: aircraft._id })
      .populate('reportedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ aircraft, tasks, defects });
  } catch (error) {
    next(error);
  }
}

export async function createAircraft(req, res, next) {
  try {
    const { registration, model } = req.body;

    if (!registration || !model) {
      res.status(400);
      throw new Error('Registration and model are required.');
    }

    const normalizedRegistration = normalizeRegistration(registration);
    const normalizedModel = safeTrim(model);

    const status = req.body.status || 'Serviceable';
    const airworthinessStatus = mergeAirworthinessStatus(
      req.body.airworthinessStatus || 'Airworthy',
      deriveAirworthinessStatus({ status })
    );

    const aircraft = await Aircraft.create({
      registration: normalizedRegistration,
      manufacturer: safeTrim(req.body.manufacturer),
      model: normalizedModel,
      serialNumber: safeTrim(req.body.serialNumber),
      status,
      airworthinessStatus,
      location: safeTrim(req.body.location, 'Main Base') || 'Main Base',
      baseStation: safeTrim(req.body.baseStation, 'Main Base') || 'Main Base',
      lastInspectionDate: parseOptionalDate(req.body.lastInspectionDate, 'Last inspection date') || new Date(),
      nextCheckType: safeTrim(req.body.nextCheckType),
      nextCheckDueDate: parseOptionalDate(req.body.nextCheckDueDate, 'Next check due date'),
      totalFlightHours: parseNonNegativeNumberOrDefault(req.body.totalFlightHours, 0, 'Total flight hours'),
      totalFlightCycles: parseNonNegativeNumberOrDefault(req.body.totalFlightCycles, 0, 'Total flight cycles'),
      history: [
        {
          action: 'Aircraft Created',
          details: `Aircraft ${normalizedRegistration} was added to the system and initialized as ${status}.`,
          createdBy: req.user.name,
          actorRole: req.user.role,
          severity: calculateSeverityFromStatus(status),
          reference: normalizedRegistration,
          timestamp: new Date(),
        },
      ],
    });

    res.status(201).json(aircraft);
  } catch (error) {
    next(error);
  }
}

export async function updateAircraft(req, res, next) {
  try {
    const aircraft = await Aircraft.findById(req.params.id);

    if (!aircraft) {
      res.status(404);
      throw new Error('Aircraft not found.');
    }

    const previousSnapshot = {
      registration: aircraft.registration,
      status: aircraft.status,
      airworthinessStatus: aircraft.airworthinessStatus,
      location: aircraft.location,
      totalFlightHours: aircraft.totalFlightHours,
      totalFlightCycles: aircraft.totalFlightCycles,
      nextCheckDueDate: aircraft.nextCheckDueDate,
    };

    if (req.body.registration !== undefined) {
      const normalizedRegistration = normalizeRegistration(req.body.registration);
      if (!normalizedRegistration) {
        res.status(400);
        throw new Error('Registration cannot be empty.');
      }
      aircraft.registration = normalizedRegistration;
    }

    if (req.body.manufacturer !== undefined) {
      aircraft.manufacturer = safeTrim(req.body.manufacturer);
    }

    if (req.body.model !== undefined) {
      const normalizedModel = safeTrim(req.body.model);
      if (!normalizedModel) {
        res.status(400);
        throw new Error('Model cannot be empty.');
      }
      aircraft.model = normalizedModel;
    }

    if (req.body.serialNumber !== undefined) {
      aircraft.serialNumber = safeTrim(req.body.serialNumber);
    }

    if (req.body.status !== undefined) {
      aircraft.status = req.body.status;
    }

    const requestedAirworthiness =
      req.body.airworthinessStatus !== undefined
        ? req.body.airworthinessStatus
        : aircraft.airworthinessStatus;
    aircraft.airworthinessStatus = mergeAirworthinessStatus(
      requestedAirworthiness,
      deriveAirworthinessStatus({ status: aircraft.status })
    );

    if (req.body.location !== undefined) {
      aircraft.location = safeTrim(req.body.location, aircraft.location) || aircraft.location;
    }

    if (req.body.baseStation !== undefined) {
      aircraft.baseStation = safeTrim(req.body.baseStation, aircraft.baseStation) || aircraft.baseStation;
    }

    if (req.body.lastInspectionDate !== undefined) {
      aircraft.lastInspectionDate =
        parseOptionalDate(req.body.lastInspectionDate, 'Last inspection date') || aircraft.lastInspectionDate;
    }

    if (req.body.nextCheckType !== undefined) {
      aircraft.nextCheckType = safeTrim(req.body.nextCheckType);
    }

    if (req.body.nextCheckDueDate !== undefined) {
      aircraft.nextCheckDueDate = parseOptionalDate(req.body.nextCheckDueDate, 'Next check due date');
    }

    if (req.body.totalFlightHours !== undefined) {
      aircraft.totalFlightHours = parseNonNegativeNumberOrDefault(
        req.body.totalFlightHours,
        aircraft.totalFlightHours,
        'Total flight hours'
      );
    }

    if (req.body.totalFlightCycles !== undefined) {
      aircraft.totalFlightCycles = parseNonNegativeNumberOrDefault(
        req.body.totalFlightCycles,
        aircraft.totalFlightCycles,
        'Total flight cycles'
      );
    }

    await aircraft.save();

    const changeMessages = [];
    if (previousSnapshot.registration !== aircraft.registration) {
      changeMessages.push(`Registration changed from ${previousSnapshot.registration} to ${aircraft.registration}.`);
    }
    if (previousSnapshot.status !== aircraft.status) {
      changeMessages.push(`Status changed from ${previousSnapshot.status} to ${aircraft.status}.`);
    }
    if (previousSnapshot.airworthinessStatus !== aircraft.airworthinessStatus) {
      changeMessages.push(
        `Airworthiness status changed from ${previousSnapshot.airworthinessStatus} to ${aircraft.airworthinessStatus}.`
      );
    }
    if (previousSnapshot.location !== aircraft.location) {
      changeMessages.push(`Location moved from ${previousSnapshot.location} to ${aircraft.location}.`);
    }
    if (previousSnapshot.totalFlightHours !== aircraft.totalFlightHours) {
      changeMessages.push(
        `Total flight hours updated from ${previousSnapshot.totalFlightHours} to ${aircraft.totalFlightHours}.`
      );
    }
    if (previousSnapshot.totalFlightCycles !== aircraft.totalFlightCycles) {
      changeMessages.push(
        `Total flight cycles updated from ${previousSnapshot.totalFlightCycles} to ${aircraft.totalFlightCycles}.`
      );
    }

    const previousCheckDate = previousSnapshot.nextCheckDueDate
      ? new Date(previousSnapshot.nextCheckDueDate).toISOString().split('T')[0]
      : 'not set';
    const currentCheckDate = aircraft.nextCheckDueDate
      ? new Date(aircraft.nextCheckDueDate).toISOString().split('T')[0]
      : 'not set';
    if (previousCheckDate !== currentCheckDate) {
      changeMessages.push(`Next check due date changed from ${previousCheckDate} to ${currentCheckDate}.`);
    }

    await addAircraftHistory(
      aircraft._id,
      'Aircraft Updated',
      changeMessages.length
        ? changeMessages.join(' ')
        : `Aircraft ${aircraft.registration} details were reviewed with no visible field changes.`,
      req.user.name,
      {
        actorRole: req.user.role,
        severity: calculateSeverityFromStatus(aircraft.status),
        reference: aircraft.registration,
      }
    );

    res.json(aircraft);
  } catch (error) {
    next(error);
  }
}

export async function getAircraftHistory(req, res, next) {
  try {
    const aircraft = await Aircraft.findById(req.params.id).select('registration model history');

    if (!aircraft) {
      res.status(404);
      throw new Error('Aircraft not found.');
    }

    const sortedHistory = [...aircraft.history].sort(
      (first, second) => new Date(second.timestamp) - new Date(first.timestamp)
    );

    res.json({
      aircraft: {
        id: aircraft._id,
        registration: aircraft.registration,
        model: aircraft.model,
      },
      history: sortedHistory,
    });
  } catch (error) {
    next(error);
  }
}
