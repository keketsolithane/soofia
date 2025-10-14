// Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const navigate = useNavigate();

  const validCredentials = {
    username: 'soofiahigh',
    password: 'soofi@123',
    adminPassword: 'admin@123'
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    setTimeout(() => {
      if (username === validCredentials.username && password === validCredentials.password) {
        setIsAuthenticated(true);
        setMessage('Login successful! Select your role.');
      } else {
        setMessage('Invalid username or password.');
      }
      setLoading(false);
    }, 500);
  };

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
    if (role === 'security') {
      setMessage('Redirecting to Security Dashboard...');
      setTimeout(() => navigate('/dashboard'), 800);
    } else if (role === 'admin') {
      setShowAdminPassword(true);
    }
  };

  const handleAdminPasswordSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    setTimeout(() => {
      if (adminPassword === validCredentials.adminPassword) {
        setMessage('Admin access granted! Redirecting...');
        navigate('/UserManagement');
      } else {
        setMessage('Invalid admin password.');
        setAdminPassword('');
      }
      setLoading(false);
    }, 500);
  };

  const resetLogin = () => {
    setIsAuthenticated(false);
    setShowAdminPassword(false);
    setUsername('');
    setPassword('');
    setMessage('');
  };

  // Render based on authentication & admin state
  if (isAuthenticated && showAdminPassword) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Admin Access Required</h2>
          <form onSubmit={handleAdminPasswordSubmit}>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Access'}
            </button>
            <button type="button" onClick={() => setShowAdminPassword(false)}>Back</button>
          </form>
          {message && <div className="message">{message}</div>}
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Select Role</h2>
          <button onClick={() => handleRoleSelection('security')}>Security</button>
          <button onClick={() => handleRoleSelection('admin')}>Admin</button>
          <button onClick={resetLogin}>Logout</button>
          {message && <div className="message">{message}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoFocus
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        </form>
        {message && <div className="message">{message}</div>}
      </div>
    </div>
  );
};

export default Login;
