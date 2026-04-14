import MaintenanceTask from '../models/MaintenanceTask.js';
import Aircraft from '../models/Aircraft.js';
import { addAircraftHistory } from '../utils/addAircraftHistory.js';
import { generateReference } from '../utils/generateReference.js';
import {
  isApprovalRole,
  TASK_PRIORITIES,
} from '../constants/domain.js';
import {
  parseNonNegativeNumberOrDefault,
  parseOptionalNonNegativeNumber,
  parseRequiredDate,
  safeTrim,
  toBoolean,
} from '../utils/normalizers.js';

function severityFromPriority(priority) {
  if (priority === 'Critical') {
    return 'Critical';
  }
  if (priority === 'High') {
    return 'Warning';
  }
  return 'Info';
}

function resetCompletionState(task) {
  task.completedAt = null;
  task.completedBy = null;
  task.completedByName = '';
  task.signOff = {
    signedOffBy: null,
    signedOffByName: '',
    certificateNumber: '',
    signedOffAt: null,
    notes: '',
  };
}

function applyCompletionState(task, requestedStatus, user, signOffNotes = '') {
  if (requestedStatus === 'Completed Pending Sign-off') {
    task.requiresSignOff = true;
    task.status = 'Completed Pending Sign-off';
    task.completedAt = new Date();
    task.completedBy = user._id;
    task.completedByName = user.name;
    task.signOff = {
      signedOffBy: null,
      signedOffByName: '',
      certificateNumber: '',
      signedOffAt: null,
      notes: signOffNotes || '',
    };
    return 'Task is awaiting sign-off.';
  }

  if (requestedStatus === 'Completed') {
    task.completedAt = new Date();
    task.completedBy = user._id;
    task.completedByName = user.name;

    if (task.requiresSignOff) {
      if (isApprovalRole(user.role)) {
        task.status = 'Completed';
        task.signOff = {
          signedOffBy: user._id,
          signedOffByName: user.name,
          certificateNumber: user.certificateNumber || '',
          signedOffAt: new Date(),
          notes: signOffNotes || task.completionNotes || '',
        };
        return 'Task completed and signed off.';
      }

      task.status = 'Completed Pending Sign-off';
      task.signOff = {
        signedOffBy: null,
        signedOffByName: '',
        certificateNumber: '',
        signedOffAt: null,
        notes: signOffNotes || task.completionNotes || '',
      };
      return 'Task completed but still requires supervisory sign-off.';
    }

    task.status = 'Completed';
    task.signOff = {
      signedOffBy: null,
      signedOffByName: '',
      certificateNumber: '',
      signedOffAt: null,
      notes: signOffNotes || '',
    };
    return 'Task completed.';
  }

  task.status = requestedStatus;
  if (['Open', 'In Progress'].includes(requestedStatus)) {
    resetCompletionState(task);
  }
  return `Task moved to ${requestedStatus}.`;
}

export async function getTasks(req, res, next) {
  try {
    const query = {};
    if (req.query.aircraftId) {
      query.aircraft = req.query.aircraftId;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.priority && TASK_PRIORITIES.includes(req.query.priority)) {
      query.priority = req.query.priority;
    }

    const tasks = await MaintenanceTask.find(query)
      .populate('aircraft', 'registration model status totalFlightHours totalFlightCycles')
      .sort({ dueDate: 1, createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
}

export async function createTask(req, res, next) {
  try {
    const { aircraft, title } = req.body;

    if (!aircraft || !title) {
      res.status(400);
      throw new Error('Aircraft and title are required.');
    }

    const aircraftRecord = await Aircraft.findById(aircraft);
    if (!aircraftRecord) {
      res.status(404);
      throw new Error('Aircraft not found for task creation.');
    }

    const task = new MaintenanceTask({
      taskNumber: generateReference('TASK'),
      aircraft,
      title: safeTrim(title),
      description: safeTrim(req.body.description),
      category: req.body.category || 'Scheduled',
      priority: req.body.priority || 'Medium',
      dueDate: parseRequiredDate(req.body.dueDate, 'Due date'),
      dueFlightHours: parseOptionalNonNegativeNumber(req.body.dueFlightHours, 'Due flight hours'),
      dueFlightCycles: parseOptionalNonNegativeNumber(req.body.dueFlightCycles, 'Due flight cycles'),
      status: 'Open',
      assignedEngineer: safeTrim(req.body.assignedEngineer),
      maintenanceType: safeTrim(req.body.maintenanceType, 'Routine') || 'Routine',
      workPackage: safeTrim(req.body.workPackage),
      estimatedHours: parseNonNegativeNumberOrDefault(req.body.estimatedHours, 0, 'Estimated hours'),
      actualHours: parseNonNegativeNumberOrDefault(req.body.actualHours, 0, 'Actual hours'),
      requiresSignOff: toBoolean(req.body.requiresSignOff),
      completionNotes: safeTrim(req.body.completionNotes),
      createdBy: req.user._id,
    });

    const requestedStatus = req.body.status || 'Open';
    applyCompletionState(task, requestedStatus, req.user, safeTrim(req.body.completionNotes));
    if (requestedStatus === 'Open') {
      task.status = 'Open';
      resetCompletionState(task);
    }

    await task.save();

    await addAircraftHistory(
      aircraft,
      'Task Added',
      `Maintenance task ${task.taskNumber} (${task.title}) was created with ${task.priority} priority and status ${task.status}.`,
      req.user.name,
      {
        actorRole: req.user.role,
        severity: severityFromPriority(task.priority),
        reference: task.taskNumber,
      }
    );

    const populatedTask = await MaintenanceTask.findById(task._id).populate(
      'aircraft',
      'registration model status totalFlightHours totalFlightCycles'
    );
    res.status(201).json(populatedTask);
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req, res, next) {
  try {
    const task = await MaintenanceTask.findById(req.params.id).populate('aircraft', 'registration model');

    if (!task) {
      res.status(404);
      throw new Error('Maintenance task not found.');
    }

    const previousStatus = task.status;
    const previousPriority = task.priority;
    const previousDueDate = task.dueDate;

    if (req.body.title !== undefined) {
      task.title = safeTrim(req.body.title) || task.title;
    }
    if (req.body.description !== undefined) {
      task.description = safeTrim(req.body.description);
    }
    if (req.body.category !== undefined) {
      task.category = req.body.category;
    }
    if (req.body.priority !== undefined) {
      task.priority = req.body.priority;
    }
    if (req.body.dueDate !== undefined) {
      task.dueDate = parseRequiredDate(req.body.dueDate, 'Due date');
    }
    if (req.body.dueFlightHours !== undefined) {
      task.dueFlightHours = parseOptionalNonNegativeNumber(req.body.dueFlightHours, 'Due flight hours');
    }
    if (req.body.dueFlightCycles !== undefined) {
      task.dueFlightCycles = parseOptionalNonNegativeNumber(req.body.dueFlightCycles, 'Due flight cycles');
    }
    if (req.body.assignedEngineer !== undefined) {
      task.assignedEngineer = safeTrim(req.body.assignedEngineer);
    }
    if (req.body.maintenanceType !== undefined) {
      task.maintenanceType = safeTrim(req.body.maintenanceType, task.maintenanceType) || task.maintenanceType;
    }
    if (req.body.workPackage !== undefined) {
      task.workPackage = safeTrim(req.body.workPackage);
    }
    if (req.body.estimatedHours !== undefined) {
      task.estimatedHours = parseNonNegativeNumberOrDefault(req.body.estimatedHours, task.estimatedHours, 'Estimated hours');
    }
    if (req.body.actualHours !== undefined) {
      task.actualHours = parseNonNegativeNumberOrDefault(req.body.actualHours, task.actualHours, 'Actual hours');
    }
    if (req.body.requiresSignOff !== undefined) {
      task.requiresSignOff = toBoolean(req.body.requiresSignOff, task.requiresSignOff);
    }
    if (req.body.completionNotes !== undefined) {
      task.completionNotes = safeTrim(req.body.completionNotes);
    }

    let taskMessage = 'Task metadata updated.';
    if (req.body.status !== undefined) {
      taskMessage = applyCompletionState(
        task,
        req.body.status,
        req.user,
        safeTrim(req.body.completionNotes)
      );
    }

    await task.save();

    const historyChanges = [`Maintenance task ${task.taskNumber} (${task.title}) was updated.`];
    if (previousStatus !== task.status) {
      historyChanges.push(`Status changed from ${previousStatus} to ${task.status}.`);
    }
    if (previousPriority !== task.priority) {
      historyChanges.push(`Priority changed from ${previousPriority} to ${task.priority}.`);
    }
    if (new Date(previousDueDate).getTime() !== new Date(task.dueDate).getTime()) {
      historyChanges.push(
        `Due date moved from ${new Date(previousDueDate).toLocaleDateString()} to ${new Date(task.dueDate).toLocaleDateString()}.`
      );
    }
    historyChanges.push(taskMessage);

    await addAircraftHistory(task.aircraft._id, 'Task Updated', historyChanges.join(' '), req.user.name, {
      actorRole: req.user.role,
      severity: severityFromPriority(task.priority),
      reference: task.taskNumber,
    });

    const populatedTask = await MaintenanceTask.findById(task._id).populate(
      'aircraft',
      'registration model status totalFlightHours totalFlightCycles'
    );
    res.json(populatedTask);
  } catch (error) {
    next(error);
  }
}
