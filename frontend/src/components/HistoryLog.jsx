function severityClassName(severity = 'Info') {
  return `badge history-${severity.toLowerCase()}`;
}

export default function HistoryLog({ history }) {
  return (
    <div className="panel">
      <div className="panel-header-row">
        <h2>Maintenance History Log</h2>
      </div>

      {!history.length ? (
        <p className="muted-text">No history entries yet.</p>
      ) : (
        <div className="history-list">
          {history.map((entry, index) => (
            <div className="history-item" key={`${entry.timestamp}-${index}`}>
              <div className="panel-header-row compact-header">
                <strong>{entry.action}</strong>
                <div className="badge-stack horizontal-wrap">
                  {entry.reference && <span className="pill">{entry.reference}</span>}
                  {entry.severity && <span className={severityClassName(entry.severity)}>{entry.severity}</span>}
                </div>
              </div>
              <p>{entry.details}</p>
              <small>
                {entry.createdBy}
                {entry.actorRole ? ` • ${entry.actorRole}` : ''}
                {' • '}
                {new Date(entry.timestamp).toLocaleString()}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
