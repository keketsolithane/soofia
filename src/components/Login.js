// Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
          <div className="login-header">
            <div className="school-logo">
              <div className="logo-icon">🏫</div>
              <h1>Soofia International School</h1>
            </div>
            <h2>Admin Access Required</h2>
            <p>Enter admin password to continue</p>
          </div>
          <form onSubmit={handleAdminPasswordSubmit} className="login-form">
            <div className="input-group">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
                className="form-input"
              />
            </div>
            <div className="button-group">
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Verifying...
                  </>
                ) : 'Access Admin Panel'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowAdminPassword(false)}
                className="btn btn-secondary"
              >
                Back
              </button>
            </div>
          </form>
          {message && (
            <div className={`message ${message.includes('granted') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="school-logo">
              <div className="logo-icon">🏫</div>
              <h1>Soofia International School</h1>
            </div>
            <h2>Select Your Role</h2>
            <p>Choose how you want to access the system</p>
          </div>
          <div className="role-selection">
            <button 
              onClick={() => handleRoleSelection('security')}
              className="role-btn security"
            >
              <div className="role-icon">👮</div>
              <div className="role-content">
                <h3>Security Staff</h3>
                <p>Access attendance dashboard</p>
              </div>
            </button>
            <button 
              onClick={() => handleRoleSelection('admin')}
              className="role-btn admin"
            >
              <div className="role-icon">⚙️</div>
              <div className="role-content">
                <h3>Administrator</h3>
                <p>Full system access</p>
              </div>
            </button>
          </div>
          <div className="button-group">
            <button 
              onClick={resetLogin}
              className="btn btn-outline"
            >
              ← Back to Login
            </button>
          </div>
          {message && (
            <div className="message info">
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="school-logo">
            <div className="logo-icon">🏫</div>
            <h1>Soofia International School</h1>
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoFocus
              required
              className="form-input"
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="form-input"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : 'Sign In'}
          </button>
        </form>
        {message && (
          <div className="message error">
            {message}
          </div>
        )}
        <div className="login-footer">
          <p>Teacher Attendance System v1.0</p>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: url('/soofia.jpg') no-repeat center center fixed;
          background-size: cover;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative;
        }

        .login-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.0);
          z-index: 0;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.85);
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          padding: 40px;
          width: 100%;
          max-width: 440px;
          position: relative;
          overflow: hidden;
          z-index: 1;
        }

        .login-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(0,0,0,0.1);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .school-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .logo-icon {
          font-size: 2.5rem;
          background: rgba(255,255,255,0.5);
          border-radius: 12px;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .school-logo h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2d3748;
          margin: 0;
        }

        .login-header h2 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #2d3748;
          margin: 0 0 8px 0;
        }

        .login-header p {
          color: #718096;
          font-size: 1rem;
          margin: 0;
        }

        .login-form {
          margin-bottom: 24px;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .input-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #4a5568;
          font-size: 0.9rem;
        }

        .form-input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.2s ease;
          background: #fafafa;
        }

        .form-input:focus {
          outline: none;
          border-color: #a0aec0;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(200,200,200,0.2);
        }

        .btn {
          width: 100%;
          padding: 14px 20px;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-primary {
          background: #e2e8f0;
          color: #2d3748;
        }

        .btn-primary:hover:not(:disabled) {
          background: #cbd5e0;
        }

        .btn-secondary {
          background: #edf2f7;
          color: #2d3748;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .btn-outline {
          background: transparent;
          color: #718096;
          border: 2px solid #e2e8f0;
        }

        .button-group {
          display: flex;
          gap: 12px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .role-selection {
          margin-bottom: 24px;
        }

        .role-btn {
          width: 100%;
          padding: 20px;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          background: rgba(255,255,255,0.9);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .role-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05);
        }

        .role-icon {
          font-size: 2rem;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.6);
          border-radius: 12px;
        }

        .role-content h3 {
          margin: 0 0 4px 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #2d3748;
        }

        .role-content p {
          margin: 0;
          color: #718096;
          font-size: 0.9rem;
        }

        .message {
          padding: 12px 16px;
          border-radius: 12px;
          margin-top: 16px;
          font-weight: 500;
          text-align: center;
        }

        .message.error {
          background: #fed7d7;
          color: #c53030;
          border: 1px solid #feb2b2;
        }

        .message.success {
          background: #c6f6d5;
          color: #276749;
          border: 1px solid #9ae6b4;
        }

        .message.info {
          background: #f0f4f8;
          color: #2d3748;
          border: 1px solid #e2e8f0;
        }

        .login-footer {
          text-align: center;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .login-footer p {
          margin: 0;
          color: #718096;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};

export default Login;
