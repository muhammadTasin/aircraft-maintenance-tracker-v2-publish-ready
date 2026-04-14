export const USER_ROLES = ['Admin', 'Maintenance Manager', 'Engineer', 'Quality Inspector'];

export const AIRCRAFT_STATUSES = ['Serviceable', 'Unserviceable', 'AOG'];
export const AIRWORTHINESS_STATUSES = ['Airworthy', 'Restricted', 'Not Airworthy'];

export const TASK_STATUSES = ['Open', 'In Progress', 'Completed Pending Sign-off', 'Completed'];
export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const TASK_CATEGORIES = ['Scheduled', 'Unscheduled', 'Inspection', 'Repair', 'Deferred', 'AD/SB'];

export const DEFECT_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const DEFECT_STATUSES = ['Open', 'Under Review', 'Deferred', 'Resolved'];
export const DEFECT_IMPACTS = ['Monitoring', 'Serviceable With Restrictions', 'Unserviceable', 'AOG'];

const approvalRoles = new Set(['Admin', 'Maintenance Manager', 'Quality Inspector']);
const aircraftStatusSeverity = {
  Serviceable: 0,
  Unserviceable: 1,
  AOG: 2,
};
const airworthinessSeverity = {
  Airworthy: 0,
  Restricted: 1,
  'Not Airworthy': 2,
};

export function isApprovalRole(role) {
  return approvalRoles.has(role);
}

export function mergeAircraftStatus(currentStatus = 'Serviceable', proposedStatus = 'Serviceable') {
  return aircraftStatusSeverity[proposedStatus] > aircraftStatusSeverity[currentStatus]
    ? proposedStatus
    : currentStatus;
}

export function mergeAirworthinessStatus(currentStatus = 'Airworthy', proposedStatus = 'Airworthy') {
  return airworthinessSeverity[proposedStatus] > airworthinessSeverity[currentStatus]
    ? proposedStatus
    : currentStatus;
}

export function deriveAircraftStatusFromImpact(impact = 'Monitoring') {
  if (impact === 'AOG') {
    return 'AOG';
  }
  if (impact === 'Unserviceable') {
    return 'Unserviceable';
  }
  return 'Serviceable';
}

export function deriveAirworthinessStatus({ status = 'Serviceable', impact = 'Monitoring' } = {}) {
  if (impact === 'Serviceable With Restrictions') {
    return 'Restricted';
  }
  if (impact === 'Unserviceable' || impact === 'AOG') {
    return 'Not Airworthy';
  }
  if (status === 'Serviceable') {
    return 'Airworthy';
  }
  return 'Not Airworthy';
}
