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

  // Hardcoded credentials
  const validCredentials = {
    username: 'soofiahigh',
    password: 'soofi@123',
    adminPassword: 'admin@123'
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Check against hardcoded credentials
      if (username === validCredentials.username && password === validCredentials.password) {
        setMessage('Login successful! Please select your role.');
        setIsAuthenticated(true);
      } else {
        throw new Error('Invalid username or password');
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
    
    if (role === 'security') {
      setMessage('Redirecting to Security Dashboard...');
      setTimeout(() => {
        navigate('/dashboard'); // Use React Router navigation
      }, 1000);
    } else if (role === 'admin') {
      setShowAdminPassword(true);
    }
  };

  const handleAdminPasswordSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (adminPassword === validCredentials.adminPassword) {
        setMessage('Admin access granted! Redirecting to User Management...');
        setTimeout(() => {
          navigate('/UserManagement'); // Use React Router navigation
        }, 1000);
      } else {
        throw new Error('Invalid admin password');
      }
    } catch (error) {
      setMessage(error.message);
      setAdminPassword('');
    } finally {
      setLoading(false);
    }
  };

  const autoFillCredentials = () => {
    setUsername(validCredentials.username);
    setPassword(validCredentials.password);
    setMessage('Demo credentials auto-filled! Click Login to continue.');
  };

  // If authenticated and admin password required
  if (isAuthenticated && showAdminPassword) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="logo">
            <span className="logo-icon">⏰</span>
            <h1>Soofia High School Clock Book</h1>
          </div>
          
          <div className="admin-auth">
            <h2>Admin Access Required</h2>
            <p className="auth-message">Please enter the admin password to continue:</p>
            
            <form onSubmit={handleAdminPasswordSubmit} className="password-form">
              <div className="form-group">
                <label htmlFor="adminPassword">Admin Password</label>
                <input
                  type="password"
                  id="adminPassword"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  placeholder="Enter admin password"
                />
              </div>

              {message && (
                <div className={`message ${message.includes('granted') ? 'success' : 'error'}`}>
                  {message}
                </div>
              )}

              <div className="button-group">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="login-btn"
                >
                  {loading ? 'Verifying...' : 'Access User Management'}
                </button>
                
                <button 
                  type="button"
                  className="back-btn"
                  onClick={() => {
                    setShowAdminPassword(false);
                    setAdminPassword('');
                    setMessage('');
                  }}
                >
                  ← Back to Role Selection
                </button>
              </div>
            </form>
          </div>
        </div>

        <style jsx>{`
          .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
          }

          .login-card {
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            padding: 40px;
            width: 100%;
            max-width: 400px;
          }

          .logo {
            text-align: center;
            margin-bottom: 30px;
          }

          .logo-icon {
            font-size: 3rem;
            display: block;
            margin-bottom: 10px;
          }

          .logo h1 {
            color: #333;
            font-size: 1.5rem;
            margin: 0;
          }

          .admin-auth h2 {
            text-align: center;
            margin-bottom: 10px;
            color: #333;
          }

          .auth-message {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #555;
          }

          .form-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            transition: border-color 0.3s;
          }

          .form-group input:focus {
            outline: none;
            border-color: #667eea;
          }

          .button-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .login-btn {
            padding: 12px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s;
          }

          .login-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
          }

          .login-btn:hover:not(:disabled) {
            background: #c0392b;
          }

          .back-btn {
            padding: 12px;
            background: #95a5a6;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s;
          }

          .back-btn:hover {
            background: #7f8c8d;
          }

          .message {
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            text-align: center;
          }

          .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }

          .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
          }
        `}</style>
      </div>
    );
  }

  // If authenticated, show role selection
  if (isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="logo">
            <span className="logo-icon">⏰</span>
            <h1>Soofia High School Clock Book</h1>
          </div>
          
          <div className="role-selection">
            <h2>Select Your Role</h2>
            <p className="welcome-message">Welcome, {username}! Please choose your role:</p>
            
            <div className="role-buttons">
              <button 
                className="role-btn admin-btn"
                onClick={() => handleRoleSelection('admin')}
                disabled={loading}
              >
                <div className="role-icon">👨‍💼</div>
                <div className="role-info">
                  <h3>Admin</h3>
                  <p>Manage users, view reports, system settings</p>
                  <small>Requires admin password</small>
                </div>
              </button>

              <button 
                className="role-btn security-btn"
                onClick={() => handleRoleSelection('security')}
                disabled={loading}
              >
                <div className="role-icon">👮‍♂️</div>
                <div className="role-info">
                  <h3>Security</h3>
                  <p>Monitor entries, check logs, manage access</p>
                </div>
              </button>
            </div>

            <button 
              className="logout-btn"
              onClick={() => {
                setIsAuthenticated(false);
                setUsername('');
                setPassword('');
                setMessage('');
              }}
            >
              ← Back to Login
            </button>

            {message && (
              <div className={`message ${message.includes('Redirecting') ? 'success' : 'info'}`}>
                {message}
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
          }

          .login-card {
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            padding: 40px;
            width: 100%;
            max-width: 450px;
          }

          .logo {
            text-align: center;
            margin-bottom: 30px;
          }

          .logo-icon {
            font-size: 3rem;
            display: block;
            margin-bottom: 10px;
          }

          .logo h1 {
            color: #333;
            font-size: 1.5rem;
            margin: 0;
          }

          .role-selection h2 {
            text-align: center;
            margin-bottom: 10px;
            color: #333;
          }

          .welcome-message {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
          }

          .role-buttons {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-bottom: 30px;
          }

          .role-btn {
            display: flex;
            align-items: center;
            padding: 20px;
            border: 2px solid #ddd;
            border-radius: 10px;
            background: white;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: left;
            width: 100%;
          }

          .role-btn:hover:not(:disabled) {
            border-color: #667eea;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          }

          .role-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .role-icon {
            font-size: 2rem;
            margin-right: 15px;
          }

          .role-info h3 {
            margin: 0 0 5px 0;
            color: #333;
          }

          .role-info p {
            margin: 0 0 5px 0;
            color: #666;
            font-size: 0.9rem;
          }

          .role-info small {
            color: #e74c3c;
            font-weight: bold;
          }

          .admin-btn:hover { border-color: #e74c3c; }
          .security-btn:hover { border-color: #3498db; }

          .logout-btn {
            width: 100%;
            padding: 12px;
            background: #95a5a6;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s;
          }

          .logout-btn:hover {
            background: #7f8c8d;
          }

          .message {
            padding: 10px;
            border-radius: 5px;
            margin-top: 20px;
            text-align: center;
          }

          .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }

          .message.info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
          }
        `}</style>
      </div>
    );
  }

  // Login form
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo">
          <span className="logo-icon">⏰</span>
          <h1>Soofia High School Clock Book</h1>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <h2>Login</h2>
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          <div className="demo-credentials">
            <button
              type="button"
              className="demo-btn"
              onClick={autoFillCredentials}
            >
              Use Demo Credentials
            </button>
            <p className="demo-text">
              <strong>Demo Credentials:</strong><br />
              Username: <code>soofiahigh</code><br />
              Password: <code>soofi@123</code>
            </p>
          </div>

          {message && (
            <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .login-card {
          background: white;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          padding: 40px;
          width: 100%;
          max-width: 400px;
        }

        .logo {
            text-align: center;
            margin-bottom: 30px;
          }

          .logo-icon {
            font-size: 3rem;
            display: block;
            margin-bottom: 10px;
          }

          .logo h1 {
            color: #333;
            font-size: 1.5rem;
            margin: 0;
          }

          .login-form h2 {
            text-align: center;
            margin-bottom: 30px;
            color: #333;
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #555;
          }

          .form-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            transition: border-color 0.3s;
          }

          .form-group input:focus {
            outline: none;
            border-color: #667eea;
          }

          .demo-credentials {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            text-align: center;
          }

          .demo-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            margin-bottom: 10px;
          }

          .demo-btn:hover {
            background: #218838;
          }

          .demo-text {
            font-size: 12px;
            color: #666;
            margin: 0;
            line-height: 1.4;
          }

          .demo-text code {
            background: #e9ecef;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: monospace;
          }

          .message {
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            text-align: center;
          }

          .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }

          .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
          }

          .login-btn {
            width: 100%;
            padding: 12px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s;
          }

          .login-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
          }

          .login-btn:hover:not(:disabled) {
            background: #5a6fd8;
          }
      `}</style>
    </div>
  );
};

export default Login;