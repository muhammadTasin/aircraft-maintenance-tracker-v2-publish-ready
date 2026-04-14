import { useMemo, useState } from 'react';

const initialForm = {
  title: '',
  description: '',
  dueDate: '',
  dueFlightHours: '',
  dueFlightCycles: '',
  status: 'Open',
  assignedEngineer: '',
  maintenanceType: 'Routine',
  priority: 'Medium',
  category: 'Scheduled',
  workPackage: '',
  estimatedHours: '',
  actualHours: '',
  requiresSignOff: false,
  completionNotes: '',
};

function priorityClassName(priority) {
  return `badge priority-${priority.toLowerCase()}`;
}

function statusClassName(status) {
  return `badge task-status-${status.toLowerCase().replace(/\s+/g, '-')}`;
}

function dueText(task) {
  const dueBits = [];
  if (task.dueDate) {
    dueBits.push(new Date(task.dueDate).toLocaleDateString());
  }
  if (task.dueFlightHours !== null && task.dueFlightHours !== undefined) {
    dueBits.push(`FH ${task.dueFlightHours}`);
  }
  if (task.dueFlightCycles !== null && task.dueFlightCycles !== undefined) {
    dueBits.push(`FC ${task.dueFlightCycles}`);
  }
  return dueBits.length ? dueBits.join(' • ') : '-';
}

export default function TaskManager({ selectedAircraftId, tasks, onCreateTask, onUpdateTask, loading, canSignOff }) {
  const [formState, setFormState] = useState(initialForm);

  const sortedTasks = useMemo(
    () => [...tasks].sort((first, second) => new Date(first.dueDate) - new Date(second.dueDate)),
    [tasks]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    await onCreateTask({ ...formState, aircraft: selectedAircraftId });
    setFormState(initialForm);
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setFormState({
      ...formState,
      [name]: type === 'checkbox' ? checked : value,
    });
  }

  return (
    <div className="panel">
      <div className="panel-header-row">
        <div>
          <h2>Maintenance Tasks</h2>
          <p className="muted-text">Support scheduled work, unscheduled findings, and sign-off controlled closures.</p>
        </div>
        {canSignOff && <span className="pill">Sign-off enabled</span>}
      </div>

      {selectedAircraftId ? (
        <form className="stacked-form compact-form" onSubmit={handleSubmit}>
          <div className="form-grid-two">
            <label>
              Task title
              <input name="title" value={formState.title} onChange={updateField} required />
            </label>
            <label>
              Work package
              <input name="workPackage" value={formState.workPackage} onChange={updateField} placeholder="A-CHECK-0426" />
            </label>
          </div>

          <label>
            Description
            <textarea name="description" value={formState.description} onChange={updateField} rows="3" />
          </label>

          <div className="form-grid-three">
            <label>
              Due date
              <input type="date" name="dueDate" value={formState.dueDate} onChange={updateField} required />
            </label>
            <label>
              Due flight hours
              <input type="number" min="0" name="dueFlightHours" value={formState.dueFlightHours} onChange={updateField} />
            </label>
            <label>
              Due flight cycles
              <input type="number" min="0" name="dueFlightCycles" value={formState.dueFlightCycles} onChange={updateField} />
            </label>
          </div>

          <div className="form-grid-three">
            <label>
              Assigned engineer
              <input name="assignedEngineer" value={formState.assignedEngineer} onChange={updateField} />
            </label>
            <label>
              Maintenance type
              <input name="maintenanceType" value={formState.maintenanceType} onChange={updateField} />
            </label>
            <label>
              Category
              <select name="category" value={formState.category} onChange={updateField}>
                <option>Scheduled</option>
                <option>Unscheduled</option>
                <option>Inspection</option>
                <option>Repair</option>
                <option>Deferred</option>
                <option>AD/SB</option>
              </select>
            </label>
          </div>

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
              Estimated hours
              <input type="number" min="0" step="0.1" name="estimatedHours" value={formState.estimatedHours} onChange={updateField} />
            </label>
            <label>
              Actual hours
              <input type="number" min="0" step="0.1" name="actualHours" value={formState.actualHours} onChange={updateField} />
            </label>
          </div>

          <div className="form-grid-two">
            <label>
              Initial status
              <select name="status" value={formState.status} onChange={updateField}>
                <option>Open</option>
                <option>In Progress</option>
                <option>Completed Pending Sign-off</option>
                <option>Completed</option>
              </select>
            </label>
            <label className="checkbox-label">
              <input type="checkbox" name="requiresSignOff" checked={formState.requiresSignOff} onChange={updateField} />
              Requires supervisory sign-off
            </label>
          </div>

          <label>
            Completion notes
            <textarea name="completionNotes" value={formState.completionNotes} onChange={updateField} rows="2" />
          </label>

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Add task'}
          </button>
        </form>
      ) : (
        <p className="muted-text">Select an aircraft to create a maintenance task.</p>
      )}

      <div className="table-wrapper top-gap">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Task</th>
              <th>Priority</th>
              <th>Due</th>
              <th>Status</th>
              <th>Engineer</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {!sortedTasks.length ? (
              <tr>
                <td colSpan="7">No tasks for the selected aircraft.</td>
              </tr>
            ) : (
              sortedTasks.map((task) => (
                <tr key={task._id}>
                  <td>
                    <strong>{task.taskNumber}</strong>
                    <div className="muted-text small-text">{task.workPackage || 'No package'}</div>
                  </td>
                  <td>
                    <strong>{task.title}</strong>
                    <div className="muted-text small-text">{task.category} • {task.maintenanceType}</div>
                    {task.requiresSignOff && <div className="muted-text small-text">Sign-off required</div>}
                  </td>
                  <td><span className={priorityClassName(task.priority)}>{task.priority}</span></td>
                  <td>{dueText(task)}</td>
                  <td>
                    <span className={statusClassName(task.status)}>{task.status}</span>
                    {task.signOff?.signedOffByName && (
                      <div className="muted-text small-text">Signed off by {task.signOff.signedOffByName}</div>
                    )}
                  </td>
                  <td>{task.assignedEngineer || '-'}</td>
                  <td>
                    <select
                      value={task.status}
                      onChange={(event) => onUpdateTask(task._id, { status: event.target.value })}
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Completed Pending Sign-off</option>
                      <option>Completed</option>
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
