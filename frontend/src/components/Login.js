import React, { useState } from 'react';
import '../styles/Login.css';

// Use environment variable for API URL, fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL ||
  (window.location.origin.includes('localhost') ? 'http://localhost:3001' : window.location.origin);

function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'guest'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Guest login failed');
      }

      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="game-title">⚡ ELEMENT FORGE ⚡</h1>
        <p className="game-tagline">Master the Elements. Forge Your Destiny.</p>

        {error && <div className="error-message">{error}</div>}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="login-form">
            <h2>Login</h2>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <p className="switch-mode">
              Don't have an account?{' '}
              <span onClick={() => setMode('register')}>Register</span>
            </p>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="login-form">
            <h2>Register</h2>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
            <p className="switch-mode">
              Already have an account?{' '}
              <span onClick={() => setMode('login')}>Login</span>
            </p>
          </form>
        )}

        <div className="guest-section">
          <div className="divider">
            <span>OR</span>
          </div>
          <button
            className="guest-button"
            onClick={handleGuestLogin}
            disabled={loading}
          >
            🎮 Play as Guest
          </button>
          <p className="guest-info">
            * Guest progress is not saved. Register to save your collection!
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
