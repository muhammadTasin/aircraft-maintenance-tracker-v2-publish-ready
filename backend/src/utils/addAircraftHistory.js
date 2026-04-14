import Aircraft from '../models/Aircraft.js';

export async function addAircraftHistory(
  aircraftId,
  action,
  details,
  createdBy,
  options = {}
) {
  const historyEntry = {
    action,
    details,
    createdBy,
    actorRole: options.actorRole || 'System',
    severity: options.severity || 'Info',
    reference: options.reference || '',
    timestamp: options.timestamp || new Date(),
  };

  await Aircraft.findByIdAndUpdate(aircraftId, {
    $push: {
      history: {
        $each: [historyEntry],
        $slice: -250,
      },
    },
  });
}
