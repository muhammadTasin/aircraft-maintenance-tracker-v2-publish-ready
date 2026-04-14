import { useMemo, useState } from 'react';

function statusClassName(status) {
  return `status-badge status-${status.toLowerCase().replace(/\s+/g, '-')}`;
}

function airworthinessClassName(status) {
  return `badge badge-${status.toLowerCase().replace(/\s+/g, '-')}`;
}

export default function AircraftList({ aircraft, selectedAircraftId, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredAircraft = useMemo(() => {
    return aircraft.filter((item) => {
      const matchesSearch = [item.registration, item.model, item.manufacturer, item.location, item.serialNumber]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [aircraft, searchTerm, statusFilter]);

  return (
    <div className="panel">
      <div className="panel-header-row">
        <h2>Aircraft Fleet</h2>
        <span className="pill">{filteredAircraft.length} visible</span>
      </div>

      <div className="toolbar-row compact-gap">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search registration, model, station..."
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option>All</option>
          <option>Serviceable</option>
          <option>Unserviceable</option>
          <option>AOG</option>
        </select>
      </div>

      {!filteredAircraft.length ? (
        <div className="panel empty-panel nested-panel">No aircraft match the current filters.</div>
      ) : (
        <div className="aircraft-list top-gap">
          {filteredAircraft.map((item) => (
            <button
              key={item._id}
              className={`aircraft-item ${selectedAircraftId === item._id ? 'selected' : ''}`}
              onClick={() => onSelect(item._id)}
            >
              <div>
                <strong>{item.registration}</strong>
                <p>{item.manufacturer ? `${item.manufacturer} • ${item.model}` : item.model}</p>
                <small>{item.serialNumber || 'Serial not recorded'}</small>
              </div>
              <div className="aircraft-meta">
                <span className={statusClassName(item.status)}>{item.status}</span>
                <span className={airworthinessClassName(item.airworthinessStatus)}>{item.airworthinessStatus}</span>
                <small>{item.location}</small>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
