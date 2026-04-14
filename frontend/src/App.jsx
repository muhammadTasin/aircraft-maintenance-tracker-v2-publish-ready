import { useEffect, useState } from 'react';
import AuthForm from './components/AuthForm.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import { apiRequest, clearAuth, getStoredUser, saveAuth } from './services/api.js';

export default function App() {
  const [authMode, setAuthMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(Boolean(getStoredUser()));
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function validateStoredSession() {
      if (!currentUser) {
        setSessionLoading(false);
        return;
      }

      try {
        const user = await apiRequest('/auth/me');
        setCurrentUser(user);
      } catch (error) {
        clearAuth();
        setCurrentUser(null);
      } finally {
        setSessionLoading(false);
      }
    }

    validateStoredSession();
  }, []);

  async function handleAuthentication(formPayload) {
    setLoading(true);
    setErrorMessage('');
    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/signup';
      const response = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(formPayload),
      });

      saveAuth(response);
      setCurrentUser(response.user);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearAuth();
    setCurrentUser(null);
    setAuthMode('login');
  }

  if (sessionLoading) {
    return <div className="auth-page"><div className="auth-card">Checking saved session...</div></div>;
  }

  if (currentUser) {
    return <DashboardPage user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="auth-page">
      <AuthForm
        mode={authMode}
        onSubmit={handleAuthentication}
        loading={loading}
        errorMessage={errorMessage}
      />
      <button
        className="text-button"
        onClick={() => {
          setErrorMessage('');
          setAuthMode(authMode === 'login' ? 'signup' : 'login');
        }}
      >
        {authMode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Login'}
      </button>
    </div>
  );
}
