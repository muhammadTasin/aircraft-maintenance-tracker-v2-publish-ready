import { useMemo, useState } from 'react';

const initialForm = {
  title: '',
  description: '',
  priority: 'Medium',
  status: 'Open',
  impact: 'Monitoring',
  ataChapter: '',
  rootCause: '',
  correctiveAction: '',
  deferredUntil: '',
};

function priorityClassName(priority) {
  return `badge priority-${priority.toLowerCase()}`;
}

function impactClassName(impact) {
  return `badge impact-${impact.toLowerCase().replace(/\s+/g, '-')}`;
}

function statusClassName(status) {
  return `badge defect-status-${status.toLowerCase().replace(/\s+/g, '-')}`;
}

export default function DefectManager({ selectedAircraftId, defects, onCreateDefect, onUpdateDefect, loading }) {
  const [formState, setFormState] = useState(initialForm);

  const sortedDefects = useMemo(
    () => [...defects].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt)),
    [defects]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    await onCreateDefect({ ...formState, aircraft: selectedAircraftId });
    setFormState(initialForm);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setFormState({ ...formState, [name]: value });
  }

  return (
    <div className="panel">
      <div className="panel-header-row">
        <div>
          <h2>Defect Reporting</h2>
          <p className="muted-text">Capture ATA chapter, operational impact, and defer/resolve states.</p>
        </div>
      </div>

      {selectedAircraftId ? (
        <form className="stacked-form compact-form" onSubmit={handleSubmit}>
          <div className="form-grid-two">
            <label>
              Defect title
              <input name="title" value={formState.title} onChange={updateField} required />
            </label>
            <label>
              ATA chapter
              <input name="ataChapter" value={formState.ataChapter} onChange={updateField} placeholder="27-10" />
            </label>
          </div>

          <label>
            Description
            <textarea name="description" value={formState.description} onChange={updateField} rows="3" required />
          </label>

          <div className="form-grid-three">
            <label>
              Priority
              <select name="priority" value={formState.priority} onChange={updateField}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </label>
            <label>
              Status
              <select name="status" value={formState.status} onChange={updateField}>
                <option>Open</option>
                <option>Under Review</option>
                <option>Deferred</option>
                <option>Resolved</option>
              </select>
            </label>
            <label>
              Operational impact
              <select name="impact" value={formState.impact} onChange={updateField}>
                <option>Monitoring</option>
                <option>Serviceable With Restrictions</option>
                <option>Unserviceable</option>
                <option>AOG</option>
              </select>
            </label>
          </div>

          <div className="form-grid-two">
            <label>
              Root cause
              <input name="rootCause" value={formState.rootCause} onChange={updateField} />
            </label>
            <label>
              Corrective action
              <input name="correctiveAction" value={formState.correctiveAction} onChange={updateField} />
            </label>
          </div>

          <label>
            Deferred until
            <input type="date" name="deferredUntil" value={formState.deferredUntil} onChange={updateField} />
          </label>

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Report defect'}
          </button>
        </form>
      ) : (
        <p className="muted-text">Select an aircraft to report a defect.</p>
      )}

      <div className="table-wrapper top-gap">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Defect</th>
              <th>Impact</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {!sortedDefects.length ? (
              <tr>
                <td colSpan="6">No defects for the selected aircraft.</td>
              </tr>
            ) : (
              sortedDefects.map((defect) => (
                <tr key={defect._id}>
                  <td>
                    <strong>{defect.defectNumber}</strong>
                    <div className="muted-text small-text">{new Date(defect.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td>
                    <strong>{defect.title}</strong>
                    <div className="muted-text small-text">{defect.description}</div>
                    {defect.ataChapter && <div className="muted-text small-text">ATA {defect.ataChapter}</div>}
                  </td>
                  <td><span className={impactClassName(defect.impact)}>{defect.impact}</span></td>
                  <td><span className={priorityClassName(defect.priority)}>{defect.priority}</span></td>
                  <td>
                    <span className={statusClassName(defect.status)}>{defect.status}</span>
                    {defect.deferredUntil && defect.status === 'Deferred' && (
                      <div className="muted-text small-text">Until {new Date(defect.deferredUntil).toLocaleDateString()}</div>
                    )}
                  </td>
                  <td>
                    <select
                      value={defect.status}
                      onChange={(event) => onUpdateDefect(defect._id, { status: event.target.value })}
                    >
                      <option>Open</option>
                      <option>Under Review</option>
                      <option>Deferred</option>
                      <option>Resolved</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
