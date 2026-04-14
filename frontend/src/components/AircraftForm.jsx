import { useState } from 'react';

const initialForm = {
  registration: '',
  manufacturer: '',
  model: '',
  serialNumber: '',
  status: 'Serviceable',
  airworthinessStatus: 'Airworthy',
  location: 'Main Base',
  baseStation: 'Main Base',
  lastInspectionDate: new Date().toISOString().split('T')[0],
  nextCheckType: '',
  nextCheckDueDate: '',
  totalFlightHours: '',
  totalFlightCycles: '',
};

export default function AircraftForm({ onSubmit, loading, canManage }) {
  const [formState, setFormState] = useState(initialForm);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormState({ ...formState, [name]: value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(formState);
    setFormState(initialForm);
  }

  return (
    <div className="panel">
      <h2>Add Aircraft</h2>
      {!canManage ? (
        <p className="muted-text">Aircraft master records can be created by Admin or Maintenance Manager accounts.</p>
      ) : (
        <form className="stacked-form" onSubmit={handleSubmit}>
          <div className="form-grid-two">
            <label>
              Registration
              <input name="registration" value={formState.registration} onChange={handleChange} required placeholder="S2-ACT" />
            </label>
            <label>
              Model
              <input name="model" value={formState.model} onChange={handleChange} required placeholder="Airbus A320neo" />
            </label>
          </div>

          <div className="form-grid-two">
            <label>
              Manufacturer
              <input name="manufacturer" value={formState.manufacturer} onChange={handleChange} placeholder="Airbus" />
            </label>
            <label>
              Serial number
              <input name="serialNumber" value={formState.serialNumber} onChange={handleChange} placeholder="MSN 12345" />
            </label>
          </div>

          <div className="form-grid-three">
            <label>
              Status
              <select name="status" value={formState.status} onChange={handleChange}>
                <option>Serviceable</option>
                <option>Unserviceable</option>
                <option>AOG</option>
              </select>
            </label>
            <label>
              Airworthiness
              <select name="airworthinessStatus" value={formState.airworthinessStatus} onChange={handleChange}>
                <option>Airworthy</option>
                <option>Restricted</option>
                <option>Not Airworthy</option>
              </select>
            </label>
            <label>
              Last inspection date
              <input type="date" name="lastInspectionDate" value={formState.lastInspectionDate} onChange={handleChange} />
            </label>
          </div>

          <div className="form-grid-two">
            <label>
              Current location
              <input name="location" value={formState.location} onChange={handleChange} />
            </label>
            <label>
              Base station
              <input name="baseStation" value={formState.baseStation} onChange={handleChange} />
            </label>
          </div>

          <div className="form-grid-two">
            <label>
              Next check type
              <input name="nextCheckType" value={formState.nextCheckType} onChange={handleChange} placeholder="A-Check" />
            </label>
            <label>
              Next check due date
              <input type="date" name="nextCheckDueDate" value={formState.nextCheckDueDate} onChange={handleChange} />
            </label>
          </div>

          <div className="form-grid-two">
            <label>
              Total flight hours
              <input type="number" min="0" name="totalFlightHours" value={formState.totalFlightHours} onChange={handleChange} placeholder="12540" />
            </label>
            <label>
              Total flight cycles
              <input type="number" min="0" name="totalFlightCycles" value={formState.totalFlightCycles} onChange={handleChange} placeholder="6850" />
            </label>
          </div>

          <button className="primary-button" disabled={loading} type="submit">
            {loading ? 'Saving...' : 'Add aircraft'}
          </button>
        </form>
      )}
    </div>
  );
}
