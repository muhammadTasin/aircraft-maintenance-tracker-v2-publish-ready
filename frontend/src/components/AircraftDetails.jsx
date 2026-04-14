import { useEffect, useState } from 'react';

function formatDateInput(value) {
  return value ? new Date(value).toISOString().split('T')[0] : '';
}

function statusClassName(status) {
  return `status-badge status-${status.toLowerCase().replace(/\s+/g, '-')}`;
}

function airworthinessClassName(status) {
  return `badge badge-${status.toLowerCase().replace(/\s+/g, '-')}`;
}

export default function AircraftDetails({ details, onUpdateAircraft, loading, canManage }) {
  const [formState, setFormState] = useState({
    manufacturer: '',
    serialNumber: '',
    status: 'Serviceable',
    airworthinessStatus: 'Airworthy',
    location: 'Main Base',
    baseStation: 'Main Base',
    lastInspectionDate: '',
    nextCheckType: '',
    nextCheckDueDate: '',
    totalFlightHours: '',
    totalFlightCycles: '',
  });

  useEffect(() => {
    if (!details?.aircraft) {
      return;
    }

    setFormState({
      manufacturer: details.aircraft.manufacturer || '',
      serialNumber: details.aircraft.serialNumber || '',
      status: details.aircraft.status,
      airworthinessStatus: details.aircraft.airworthinessStatus || 'Airworthy',
      location: details.aircraft.location || 'Main Base',
      baseStation: details.aircraft.baseStation || 'Main Base',
      lastInspectionDate: formatDateInput(details.aircraft.lastInspectionDate),
      nextCheckType: details.aircraft.nextCheckType || '',
      nextCheckDueDate: formatDateInput(details.aircraft.nextCheckDueDate),
      totalFlightHours: details.aircraft.totalFlightHours ?? '',
      totalFlightCycles: details.aircraft.totalFlightCycles ?? '',
    });
  }, [details]);

  if (!details?.aircraft) {
    return <div className="panel empty-panel">Select an aircraft to review its current technical status.</div>;
  }

  const { aircraft } = details;

  async function handleSubmit(event) {
    event.preventDefault();
    await onUpdateAircraft(aircraft._id, formState);
  }

  return (
    <div className="panel">
      <div className="panel-header-row">
        <div>
          <h2>{aircraft.registration}</h2>
          <p className="muted-text">{aircraft.manufacturer ? `${aircraft.manufacturer} • ${aircraft.model}` : aircraft.model}</p>
        </div>
        <div className="badge-stack">
          <span className={statusClassName(aircraft.status)}>{aircraft.status}</span>
          <span className={airworthinessClassName(aircraft.airworthinessStatus)}>{aircraft.airworthinessStatus}</span>
        </div>
      </div>

      <div className="details-grid detail-grid-wide">
        <div>
          <span className="label">Serial number</span>
          <strong>{aircraft.serialNumber || 'Not set'}</strong>
        </div>
        <div>
          <span className="label">Location / base</span>
          <strong>{aircraft.location} • {aircraft.baseStation || 'Main Base'}</strong>
        </div>
        <div>
          <span className="label">Last inspection</span>
          <strong>{aircraft.lastInspectionDate ? new Date(aircraft.lastInspectionDate).toLocaleDateString() : 'Not set'}</strong>
        </div>
        <div>
          <span className="label">Next check</span>
          <strong>{aircraft.nextCheckType || 'Not set'} {aircraft.nextCheckDueDate ? `• ${new Date(aircraft.nextCheckDueDate).toLocaleDateString()}` : ''}</strong>
        </div>
        <div>
          <span className="label">Flight hours</span>
          <strong>{aircraft.totalFlightHours ?? 0}</strong>
        </div>
        <div>
          <span className="label">Flight cycles</span>
          <strong>{aircraft.totalFlightCycles ?? 0}</strong>
        </div>
        <div>
          <span className="label">Tasks</span>
          <strong>{details.tasks.length}</strong>
        </div>
        <div>
          <span className="label">Defects</span>
          <strong>{details.defects.length}</strong>
        </div>
      </div>

      {canManage ? (
        <form className="stacked-form compact-form top-gap" onSubmit={handleSubmit}>
          <div className="form-grid-two">
            <label>
              Manufacturer
              <input value={formState.manufacturer} onChange={(event) => setFormState({ ...formState, manufacturer: event.target.value })} />
            </label>
            <label>
              Serial number
              <input value={formState.serialNumber} onChange={(event) => setFormState({ ...formState, serialNumber: event.target.value })} />
            </label>
          </div>

          <div className="form-grid-three">
            <label>
              Aircraft status
              <select value={formState.status} onChange={(event) => setFormState({ ...formState, status: event.target.value })}>
                <option>Serviceable</option>
                <option>Unserviceable</option>
                <option>AOG</option>
              </select>
            </label>
            <label>
              Airworthiness
              <select
                value={formState.airworthinessStatus}
                onChange={(event) => setFormState({ ...formState, airworthinessStatus: event.target.value })}
              >
                <option>Airworthy</option>
                <option>Restricted</option>
                <option>Not Airworthy</option>
              </select>
            </label>
            <label>
              Last inspection date
              <input
                type="date"
                value={formState.lastInspectionDate}
                onChange={(event) => setFormState({ ...formState, lastInspectionDate: event.target.value })}
              />
            </label>
          </div>

          <div className="form-grid-two">
            <label>
              Location
              <input value={formState.location} onChange={(event) => setFormState({ ...formState, location: event.target.value })} />
            </label>
            <label>
              Base station
              <input value={formState.baseStation} onChange={(event) => setFormState({ ...formState, baseStation: event.target.value })} />
            </label>
          </div>

          <div className="form-grid-two">
            <label>
              Next check type
              <input value={formState.nextCheckType} onChange={(event) => setFormState({ ...formState, nextCheckType: event.target.value })} />
            </label>
            <label>
              Next check due date
              <input
                type="date"
                value={formState.nextCheckDueDate}
                onChange={(event) => setFormState({ ...formState, nextCheckDueDate: event.target.value })}
              />
            </label>
          </div>

          <div className="form-grid-two">
            <label>
              Total flight hours
              <input
                type="number"
                min="0"
                value={formState.totalFlightHours}
                onChange={(event) => setFormState({ ...formState, totalFlightHours: event.target.value })}
              />
            </label>
            <label>
              Total flight cycles
              <input
                type="number"
                min="0"
                value={formState.totalFlightCycles}
                onChange={(event) => setFormState({ ...formState, totalFlightCycles: event.target.value })}
              />
            </label>
          </div>

          <button className="secondary-button" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Update aircraft details'}
          </button>
        </form>
      ) : (
        <div className="inline-note top-gap">This account can review aircraft records but cannot change fleet master data.</div>
      )}
    </div>
  );
}
