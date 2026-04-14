const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getThresholdConfig() {
  return {
    dueSoonDays: Number(process.env.TASK_DUE_SOON_DAYS || 7),
    checkDueSoonDays: Number(process.env.CHECK_DUE_SOON_DAYS || 14),
    hoursMargin: Number(process.env.HOURS_DUE_SOON_MARGIN || 5),
    cyclesMargin: Number(process.env.CYCLES_DUE_SOON_MARGIN || 3),
  };
}

export function getTaskDueState(task) {
  const { dueSoonDays, hoursMargin, cyclesMargin } = getThresholdConfig();
  const now = new Date();
  const reasons = [];
  let overdue = false;
  let dueSoon = false;

  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    if (dueDate < now) {
      overdue = true;
      reasons.push(`Date overdue since ${dueDate.toLocaleDateString()}`);
    } else if (dueDate.getTime() - now.getTime() <= dueSoonDays * DAY_IN_MS) {
      dueSoon = true;
      reasons.push(`Due by date on ${dueDate.toLocaleDateString()}`);
    }
  }

  const aircraft = task.aircraft;
  if (aircraft) {
    if (typeof task.dueFlightHours === 'number') {
      const remainingHours = task.dueFlightHours - (aircraft.totalFlightHours || 0);
      if (remainingHours <= 0) {
        overdue = true;
        reasons.push('Flight-hour limit reached');
      } else if (remainingHours <= hoursMargin) {
        dueSoon = true;
        reasons.push(`${remainingHours} flight hour(s) remaining`);
      }
    }

    if (typeof task.dueFlightCycles === 'number') {
      const remainingCycles = task.dueFlightCycles - (aircraft.totalFlightCycles || 0);
      if (remainingCycles <= 0) {
        overdue = true;
        reasons.push('Flight-cycle limit reached');
      } else if (remainingCycles <= cyclesMargin) {
        dueSoon = true;
        reasons.push(`${remainingCycles} flight cycle(s) remaining`);
      }
    }
  }

  return {
    overdue,
    dueSoon,
    reasons,
  };
}

function taskSortKey(task) {
  return new Date(task.dueDate || task.createdAt || Date.now()).getTime();
}

function mapTaskAlert(task, state) {
  const taskObject = task.toObject ? task.toObject() : task;
  return {
    ...taskObject,
    alertReason: state.reasons.join(' • '),
  };
}

function mapAircraftCheck(aircraft, now) {
  const checkDate = new Date(aircraft.nextCheckDueDate);
  const diffMs = checkDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / DAY_IN_MS);

  return {
    ...(aircraft.toObject ? aircraft.toObject() : aircraft),
    daysRemaining,
  };
}

export function buildOperationalAlerts({ tasks = [], defects = [], aircraft = [] }) {
  const { checkDueSoonDays } = getThresholdConfig();
  const now = new Date();

  const activeTasks = tasks.filter((task) => task.status !== 'Completed');
  const evaluatedTasks = activeTasks.map((task) => ({ task, state: getTaskDueState(task) }));

  const overdueTasks = evaluatedTasks
    .filter(({ state }) => state.overdue)
    .map(({ task, state }) => mapTaskAlert(task, state))
    .sort((first, second) => taskSortKey(first) - taskSortKey(second));

  const dueSoonTasks = evaluatedTasks
    .filter(({ state }) => !state.overdue && state.dueSoon)
    .map(({ task, state }) => mapTaskAlert(task, state))
    .sort((first, second) => taskSortKey(first) - taskSortKey(second));

  const criticalDefects = defects
    .filter(
      (defect) =>
        defect.status !== 'Resolved' &&
        (defect.priority === 'Critical' || ['Unserviceable', 'AOG'].includes(defect.impact))
    )
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));

  const groundedAircraft = aircraft
    .filter((item) => item.status !== 'Serviceable')
    .sort((first, second) => first.registration.localeCompare(second.registration));

  const aircraftWithChecks = aircraft.filter((item) => item.nextCheckDueDate);

  const overdueChecks = aircraftWithChecks
    .filter((item) => new Date(item.nextCheckDueDate) < now)
    .map((item) => mapAircraftCheck(item, now))
    .sort((first, second) => new Date(first.nextCheckDueDate) - new Date(second.nextCheckDueDate));

  const upcomingChecks = aircraftWithChecks
    .filter((item) => {
      const checkDate = new Date(item.nextCheckDueDate);
      return checkDate >= now && checkDate.getTime() - now.getTime() <= checkDueSoonDays * DAY_IN_MS;
    })
    .map((item) => mapAircraftCheck(item, now))
    .sort((first, second) => new Date(first.nextCheckDueDate) - new Date(second.nextCheckDueDate));

  return {
    overdueTasks,
    dueSoonTasks,
    criticalDefects,
    overdueChecks,
    upcomingChecks,
    groundedAircraft,
  };
}
