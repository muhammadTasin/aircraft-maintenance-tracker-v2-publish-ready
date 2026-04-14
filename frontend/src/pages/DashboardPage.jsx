import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api.js';
import SummaryCards from '../components/SummaryCards.jsx';
import AircraftForm from '../components/AircraftForm.jsx';
import AircraftList from '../components/AircraftList.jsx';
import AircraftDetails from '../components/AircraftDetails.jsx';
import TaskManager from '../components/TaskManager.jsx';
import DefectManager from '../components/DefectManager.jsx';
import HistoryLog from '../components/HistoryLog.jsx';
import OverdueAlerts from '../components/OverdueAlerts.jsx';

const aircraftManagerRoles = ['Admin', 'Maintenance Manager'];
const signOffRoles = ['Admin', 'Maintenance Manager', 'Quality Inspector'];

export default function DashboardPage({ user, onLogout }) {
  const [dashboardData, setDashboardData] = useState({ summary: null, aircraft: [] });
  const [selectedAircraftId, setSelectedAircraftId] = useState('');
  const [selectedAircraftDetails, setSelectedAircraftDetails] = useState(null);
  const [alerts, setAlerts] = useState({ count: 0, items: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState('');

  const canManageAircraft = aircraftManagerRoles.includes(user.role);
  const canSignOff = signOffRoles.includes(user.role);

  const currentHistory = useMemo(() => {
    const historyItems = selectedAircraftDetails?.aircraft?.history || [];
    return [...historyItems].sort((first, second) => new Date(second.timestamp) - new Date(first.timestamp));
  }, [selectedAircraftDetails]);

  async function loadAircraftDetails(aircraftId) {
    const detailsResponse = await apiRequest(`/aircraft/${aircraftId}`);
    setSelectedAircraftDetails(detailsResponse);
  }

  async function loadDashboard(preferredAircraftId) {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [dashboardResponse, alertsResponse] = await Promise.all([
        apiRequest('/aircraft/dashboard'),
        apiRequest('/alerts/operational'),
      ]);

      setDashboardData(dashboardResponse);
      setAlerts(alertsResponse);
      setLastUpdatedAt(new Date().toLocaleString());

      const nextAircraftId = preferredAircraftId || selectedAircraftId || dashboardResponse.aircraft?.[0]?._id || '';

      if (nextAircraftId) {
        setSelectedAircraftId(nextAircraftId);
        await loadAircraftDetails(nextAircraftId);
      } else {
        setSelectedAircraftDetails(null);
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleAircraftSelection(aircraftId) {
    setSelectedAircraftId(aircraftId);
    setErrorMessage('');
    try {
      await loadAircraftDetails(aircraftId);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleCreateAircraft(payload) {
    if (!canManageAircraft) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    try {
      const aircraft = await apiRequest('/aircraft', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await loadDashboard(aircraft._id);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateAircraft(aircraftId, payload) {
    setIsSaving(true);
    setErrorMessage('');
    try {
      await apiRequest(`/aircraft/${aircraftId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      await loadDashboard(aircraftId);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateTask(payload) {
    setIsSaving(true);
    setErrorMessage('');
    try {
      await apiRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await loadDashboard(selectedAircraftId);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateTask(taskId, partialPayload) {
    setIsSaving(true);
    setErrorMessage('');
    try {
      await apiRequest(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(partialPayload),
      });
      await loadDashboard(selectedAircraftId);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateDefect(payload) {
    setIsSaving(true);
    setErrorMessage('');
    try {
      await apiRequest('/defects', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await loadDashboard(selectedAircraftId);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateDefect(defectId, partialPayload) {
    setIsSaving(true);
    setErrorMessage('');
    try {
      await apiRequest(`/defects/${defectId}`, {
        method: 'PUT',
        body: JSON.stringify(partialPayload),
      });
      await loadDashboard(selectedAircraftId);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>Aircraft Maintenance Tracker v2</h1>
          <p className="muted-text">{user.name} • {user.role} • {user.station || 'Main Base'}</p>
        </div>
        <div className="toolbar-row">
          {lastUpdatedAt && <span className="inline-note">Last refreshed: {lastUpdatedAt}</span>}
          <button className="secondary-button" onClick={() => loadDashboard(selectedAircraftId)}>
            Refresh
          </button>
          <button className="secondary-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {errorMessage && <div className="error-banner page-banner">{errorMessage}</div>}

      {!canManageAircraft && (
        <div className="inline-note page-banner">
          This login can raise defects and manage tasks, but aircraft master data updates are restricted to Admin and Maintenance Manager roles.
        </div>
      )}

      {isLoading ? (
        <div className="panel">Loading dashboard...</div>
      ) : (
        <>
          <SummaryCards summary={dashboardData.summary} />

          <div className="dashboard-grid">
            <div className="left-column">
              <AircraftForm onSubmit={handleCreateAircraft} loading={isSaving} canManage={canManageAircraft} />
              <AircraftList
                aircraft={dashboardData.aircraft}
                selectedAircraftId={selectedAircraftId}
                onSelect={handleAircraftSelection}
              />
            </div>

            <div className="right-column">
              <AircraftDetails
                details={selectedAircraftDetails}
                onUpdateAircraft={handleUpdateAircraft}
                loading={isSaving}
                canManage={canManageAircraft}
              />
              <OverdueAlerts alerts={alerts} />
              <TaskManager
                selectedAircraftId={selectedAircraftId}
                tasks={selectedAircraftDetails?.tasks || []}
                onCreateTask={handleCreateTask}
                onUpdateTask={handleUpdateTask}
                loading={isSaving}
                canSignOff={canSignOff}
              />
              <DefectManager
                selectedAircraftId={selectedAircraftId}
                defects={selectedAircraftDetails?.defects || []}
                onCreateDefect={handleCreateDefect}
                onUpdateDefect={handleUpdateDefect}
                loading={isSaving}
              />
              <HistoryLog history={currentHistory} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
