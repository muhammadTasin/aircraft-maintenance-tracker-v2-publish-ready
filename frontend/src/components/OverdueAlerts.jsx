function priorityClassName(priority) {
  return `badge priority-${priority.toLowerCase()}`;
}

function impactClassName(impact) {
  return `badge impact-${impact.toLowerCase().replace(/\s+/g, '-')}`;
}

function sectionTable(title, items, columns, renderRow, emptyText) {
  return (
    <div className="subpanel">
      <div className="panel-header-row compact-header">
        <h3>{title}</h3>
        <span className="pill">{items.length}</span>
      </div>
      {!items.length ? (
        <p className="muted-text">{emptyText}</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>{items.map(renderRow)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function OverdueAlerts({ alerts }) {
  const overdueTasks = alerts?.overdueTasks || [];
  const dueSoonTasks = alerts?.dueSoonTasks || [];
  const criticalDefects = alerts?.criticalDefects || [];
  const overdueChecks = alerts?.overdueChecks || [];
  const upcomingChecks = alerts?.upcomingChecks || [];
  const groundedAircraft = alerts?.groundedAircraft || [];

  return (
    <div className="panel">
      <div className="panel-header-row">
        <div>
          <h2>Operational Alerts</h2>
          <p className="muted-text">Overdue work, soon-due work, critical defects, and fleet readiness watchlist.</p>
        </div>
        <span className="pill">{overdueTasks.length + criticalDefects.length + overdueChecks.length} immediate</span>
      </div>

      <div className="alert-grid">
        {sectionTable(
          'Overdue tasks',
          overdueTasks,
          ['Aircraft', 'Task', 'Reason', 'Status'],
          (item) => (
            <tr key={item._id}>
              <td>{item.aircraft?.registration}</td>
              <td>
                <strong>{item.taskNumber}</strong>
                <div className="muted-text small-text">{item.title}</div>
              </td>
              <td>{item.alertReason || '-'}</td>
              <td>{item.status}</td>
            </tr>
          ),
          'No overdue tasks.'
        )}

        {sectionTable(
          'Due soon tasks',
          dueSoonTasks,
          ['Aircraft', 'Task', 'Window', 'Priority'],
          (item) => (
            <tr key={item._id}>
              <td>{item.aircraft?.registration}</td>
              <td>
                <strong>{item.taskNumber}</strong>
                <div className="muted-text small-text">{item.title}</div>
              </td>
              <td>{item.alertReason || '-'}</td>
              <td><span className={priorityClassName(item.priority)}>{item.priority}</span></td>
            </tr>
          ),
          'No due-soon tasks.'
        )}

        {sectionTable(
          'Critical / service-impacting defects',
          criticalDefects,
          ['Aircraft', 'Defect', 'Impact', 'Priority'],
          (item) => (
            <tr key={item._id}>
              <td>{item.aircraft?.registration}</td>
              <td>
                <strong>{item.defectNumber}</strong>
                <div className="muted-text small-text">{item.title}</div>
              </td>
              <td><span className={impactClassName(item.impact)}>{item.impact}</span></td>
              <td><span className={priorityClassName(item.priority)}>{item.priority}</span></td>
            </tr>
          ),
          'No critical or service-impacting defects.'
        )}

        {sectionTable(
          'Maintenance checks',
          [...overdueChecks, ...upcomingChecks],
          ['Aircraft', 'Check', 'Due date', 'State'],
          (item) => (
            <tr key={`${item._id}-${item.nextCheckDueDate}`}>
              <td>{item.registration}</td>
              <td>{item.nextCheckType || 'Planned check'}</td>
              <td>{item.nextCheckDueDate ? new Date(item.nextCheckDueDate).toLocaleDateString() : '-'}</td>
              <td>{item.daysRemaining < 0 ? 'Overdue' : `${item.daysRemaining} day(s) left`}</td>
            </tr>
          ),
          'No maintenance checks in the watch window.'
        )}
      </div>

      <div className="subpanel top-gap">
        <div className="panel-header-row compact-header">
          <h3>Grounded aircraft</h3>
          <span className="pill">{groundedAircraft.length}</span>
        </div>
        {!groundedAircraft.length ? (
          <p className="muted-text">No grounded aircraft at the moment.</p>
        ) : (
          <div className="chip-row">
            {groundedAircraft.map((item) => (
              <span key={item._id} className="aircraft-chip">
                {item.registration} • {item.status}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
