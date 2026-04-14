import { useState } from 'react';

const initialSignupState = {
  name: '',
  email: '',
  password: '',
  role: 'Engineer',
  certificateNumber: '',
  station: 'Main Base',
};

const initialLoginState = {
  email: '',
  password: '',
};

const roleOptions = ['Engineer', 'Maintenance Manager', 'Quality Inspector', 'Admin'];

export default function AuthForm({ mode, onSubmit, loading, errorMessage }) {
  const [loginForm, setLoginForm] = useState(initialLoginState);
  const [signupForm, setSignupForm] = useState(initialSignupState);

  const isSignup = mode === 'signup';

  function handleSubmit(event) {
    event.preventDefault();
    const payload = isSignup ? signupForm : loginForm;
    onSubmit(payload);
  }

  return (
    <div className="auth-card">
      <h1>Aircraft Maintenance Tracker</h1>
      <p>Structured for airline engineering teams with fleet status, technical records, controlled task closure, and operational alerts.</p>

      <form onSubmit={handleSubmit} className="stacked-form">
        {isSignup && (
          <>
            <label>
              Full name
              <input
                value={signupForm.name}
                onChange={(event) => setSignupForm({ ...signupForm, name: event.target.value })}
                placeholder="Engineer name"
                required
              />
            </label>

            <div className="form-grid-two">
              <label>
                Requested role
                <select
                  value={signupForm.role}
                  onChange={(event) => setSignupForm({ ...signupForm, role: event.target.value })}
                >
                  {roleOptions.map((roleOption) => (
                    <option key={roleOption}>{roleOption}</option>
                  ))}
                </select>
              </label>

              <label>
                Station
                <input
                  value={signupForm.station}
                  onChange={(event) => setSignupForm({ ...signupForm, station: event.target.value })}
                  placeholder="Main Base"
                />
              </label>
            </div>

            <label>
              Certificate number
              <input
                value={signupForm.certificateNumber}
                onChange={(event) => setSignupForm({ ...signupForm, certificateNumber: event.target.value })}
                placeholder="Optional certifying staff ID"
              />
            </label>

            <div className="inline-note">
              The first registered user becomes Admin automatically. After that, open role selection depends on backend configuration.
            </div>
          </>
        )}

        <label>
          Email
          <input
            type="email"
            value={isSignup ? signupForm.email : loginForm.email}
            onChange={(event) =>
              isSignup
                ? setSignupForm({ ...signupForm, email: event.target.value })
                : setLoginForm({ ...loginForm, email: event.target.value })
            }
            placeholder="name@airline.com"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={isSignup ? signupForm.password : loginForm.password}
            onChange={(event) =>
              isSignup
                ? setSignupForm({ ...signupForm, password: event.target.value })
                : setLoginForm({ ...loginForm, password: event.target.value })
            }
            placeholder={isSignup ? 'At least 8 chars, letters + numbers' : 'Enter password'}
            required
          />
        </label>

        {errorMessage && <div className="error-banner">{errorMessage}</div>}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Login'}
        </button>
      </form>
    </div>
  );
}
