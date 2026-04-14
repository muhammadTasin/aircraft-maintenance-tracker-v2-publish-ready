import Defect from '../models/Defect.js';
import Aircraft from '../models/Aircraft.js';
import { addAircraftHistory } from '../utils/addAircraftHistory.js';
import { generateReference } from '../utils/generateReference.js';
import {
  deriveAircraftStatusFromImpact,
  deriveAirworthinessStatus,
  isApprovalRole,
  mergeAircraftStatus,
  mergeAirworthinessStatus,
} from '../constants/domain.js';
import { parseOptionalDate, safeTrim } from '../utils/normalizers.js';

function severityFromPriority(priority) {
  if (priority === 'Critical') {
    return 'Critical';
  }
  if (priority === 'High') {
    return 'Warning';
  }
  return 'Info';
}

function resolveImpact(priority, requestedImpact) {
  if (priority === 'Critical' && (!requestedImpact || requestedImpact === 'Monitoring')) {
    return 'Unserviceable';
  }
  return requestedImpact || 'Monitoring';
}

async function escalateAircraftIfNeeded(aircraftRecord, defect, actingUser) {
  if (!aircraftRecord || defect.status === 'Resolved') {
    return;
  }

  const proposedStatus = deriveAircraftStatusFromImpact(defect.impact);
  const proposedAirworthiness = deriveAirworthinessStatus({
    status: proposedStatus,
    impact: defect.impact,
  });

  const nextStatus = mergeAircraftStatus(aircraftRecord.status, proposedStatus);
  const nextAirworthiness = mergeAirworthinessStatus(aircraftRecord.airworthinessStatus, proposedAirworthiness);

  if (nextStatus === aircraftRecord.status && nextAirworthiness === aircraftRecord.airworthinessStatus) {
    return;
  }

  const previousStatus = aircraftRecord.status;
  const previousAirworthiness = aircraftRecord.airworthinessStatus;

  aircraftRecord.status = nextStatus;
  aircraftRecord.airworthinessStatus = nextAirworthiness;
  await aircraftRecord.save();

  let details = `Aircraft impact reviewed because of defect ${defect.defectNumber}.`;
  if (previousStatus !== nextStatus) {
    details += ` Status changed from ${previousStatus} to ${nextStatus}.`;
  }
  if (previousAirworthiness !== nextAirworthiness) {
    details += ` Airworthiness changed from ${previousAirworthiness} to ${nextAirworthiness}.`;
  }

  await addAircraftHistory(aircraftRecord._id, 'Aircraft Risk Escalated', details, actingUser.name, {
    actorRole: actingUser.role,
    severity: severityFromPriority(defect.priority),
    reference: defect.defectNumber,
  });
}

function validateHighRiskResolution(nextStatus, nextImpact, nextPriority, user) {
  const isHighRisk = nextPriority === 'Critical' || ['Unserviceable', 'AOG'].includes(nextImpact);
  if (isHighRisk && ['Resolved', 'Deferred'].includes(nextStatus) && !isApprovalRole(user.role)) {
    const error = new Error('Only supervisory roles can defer or resolve critical or service-impacting defects.');
    error.statusCode = 403;
    throw error;
  }
}

export async function getDefects(req, res, next) {
  try {
    const query = {};
    if (req.query.aircraftId) {
      query.aircraft = req.query.aircraftId;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    const defects = await Defect.find(query)
      .populate('aircraft', 'registration model status airworthinessStatus')
      .populate('reportedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json(defects);
  } catch (error) {
    next(error);
  }
}

export async function createDefect(req, res, next) {
  try {
    const { aircraft, title, description } = req.body;

    if (!aircraft || !title || !description) {
      res.status(400);
      throw new Error('Aircraft, title, and description are required.');
    }

    const aircraftRecord = await Aircraft.findById(aircraft);
    if (!aircraftRecord) {
      res.status(404);
      throw new Error('Aircraft not found for defect reporting.');
    }

    const priority = req.body.priority || 'Medium';
    const impact = resolveImpact(priority, req.body.impact);
    const status = req.body.status || 'Open';
    const deferredUntil = parseOptionalDate(req.body.deferredUntil, 'Deferred until');

    validateHighRiskResolution(status, impact, priority, req.user);

    if (status === 'Deferred' && !deferredUntil) {
      res.status(400);
      throw new Error('Deferred defects require a deferred-until date.');
    }

    const defect = await Defect.create({
      defectNumber: generateReference('DEF'),
      aircraft,
      title: safeTrim(title),
      description: safeTrim(description),
      priority,
      status,
      impact,
      ataChapter: safeTrim(req.body.ataChapter),
      rootCause: safeTrim(req.body.rootCause),
      correctiveAction: safeTrim(req.body.correctiveAction),
      deferredUntil: status === 'Deferred' ? deferredUntil : null,
      reportedBy: req.user._id,
      resolvedAt: status === 'Resolved' ? new Date() : null,
    });

    await addAircraftHistory(
      aircraft,
      'Defect Reported',
      `Defect ${defect.defectNumber} (${defect.title}) was reported with ${defect.priority} priority, ${defect.impact} impact, and status ${defect.status}.`,
      req.user.name,
      {
        actorRole: req.user.role,
        severity: severityFromPriority(defect.priority),
        reference: defect.defectNumber,
      }
    );

    await escalateAircraftIfNeeded(aircraftRecord, defect, req.user);

    const populatedDefect = await Defect.findById(defect._id)
      .populate('aircraft', 'registration model status airworthinessStatus')
      .populate('reportedBy', 'name email role');

    res.status(201).json(populatedDefect);
  } catch (error) {
    next(error);
  }
}

export async function updateDefect(req, res, next) {
  try {
    const defect = await Defect.findById(req.params.id).populate('aircraft', 'registration model status airworthinessStatus');

    if (!defect) {
      res.status(404);
      throw new Error('Defect not found.');
    }

    const aircraftRecord = await Aircraft.findById(defect.aircraft._id);
    const previousStatus = defect.status;
    const previousPriority = defect.priority;
    const previousImpact = defect.impact;

    if (req.body.title !== undefined) {
      defect.title = safeTrim(req.body.title) || defect.title;
    }
    if (req.body.description !== undefined) {
      defect.description = safeTrim(req.body.description) || defect.description;
    }
    if (req.body.priority !== undefined) {
      defect.priority = req.body.priority;
    }

    defect.impact = resolveImpact(defect.priority, req.body.impact !== undefined ? req.body.impact : defect.impact);

    const nextStatus = req.body.status || defect.status;
    validateHighRiskResolution(nextStatus, defect.impact, defect.priority, req.user);

    defect.status = nextStatus;
    defect.ataChapter = req.body.ataChapter !== undefined ? safeTrim(req.body.ataChapter) : defect.ataChapter;
    defect.rootCause = req.body.rootCause !== undefined ? safeTrim(req.body.rootCause) : defect.rootCause;
    defect.correctiveAction =
      req.body.correctiveAction !== undefined ? safeTrim(req.body.correctiveAction) : defect.correctiveAction;

    const deferredUntil = req.body.deferredUntil !== undefined
      ? parseOptionalDate(req.body.deferredUntil, 'Deferred until')
      : defect.deferredUntil;

    if (defect.status === 'Deferred' && !deferredUntil) {
      res.status(400);
      throw new Error('Deferred defects require a deferred-until date.');
    }

    defect.deferredUntil = defect.status === 'Deferred' ? deferredUntil : null;
    defect.resolvedAt = defect.status === 'Resolved' ? new Date() : null;

    await defect.save();
    await escalateAircraftIfNeeded(aircraftRecord, defect, req.user);

    let historyDetails = `Defect ${defect.defectNumber} (${defect.title}) was updated.`;
    if (previousStatus !== defect.status) {
      historyDetails += ` Status changed from ${previousStatus} to ${defect.status}.`;
    }
    if (previousPriority !== defect.priority) {
      historyDetails += ` Priority changed from ${previousPriority} to ${defect.priority}.`;
    }
    if (previousImpact !== defect.impact) {
      historyDetails += ` Impact changed from ${previousImpact} to ${defect.impact}.`;
    }
    if (defect.status === 'Resolved') {
      historyDetails += ' The defect was marked resolved, but aircraft recovery remains a controlled manual action.';
    }

    await addAircraftHistory(defect.aircraft._id, 'Defect Updated', historyDetails, req.user.name, {
      actorRole: req.user.role,
      severity: severityFromPriority(defect.priority),
      reference: defect.defectNumber,
    });

    const populatedDefect = await Defect.findById(defect._id)
      .populate('aircraft', 'registration model status airworthinessStatus')
      .populate('reportedBy', 'name email role');

    res.json(populatedDefect);
  } catch (error) {
    next(error);
  }
}
