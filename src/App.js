import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import InstallPrompt from './components/InstallPrompt';

function App() {
  return (
    <Router>
      <div className="App">
        <InstallPrompt />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/usermanagement" element={<UserManagement />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;