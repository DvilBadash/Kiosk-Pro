import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import KioskDashboard from './pages/KioskDashboard';
import UsersManager from './pages/UsersManager';
import Settings from './pages/Settings';
import Logs from './pages/Logs';
import ClientPlayer from './pages/ClientPlayer';
import { User, UserRole } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for persistent session simulation
    const savedSession = localStorage.getItem('kmp_session');
    if (savedSession) {
      setUser(JSON.parse(savedSession));
    }
    setLoading(false);
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('kmp_session', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('kmp_session');
  };

  if (loading) return null;

  return (
    <HashRouter>
      <Routes>
        {/* Public / Client Routes */}
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/admin/dashboard" />} />
        <Route path="/client/:kioskId" element={<ClientPlayer />} />

        {/* Protected Admin Routes */}
        <Route
          path="/admin/*"
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout}>
                <Routes>
                  <Route path="dashboard" element={<KioskDashboard currentUser={user} />} />
                  <Route 
                    path="users" 
                    element={
                      user.role === UserRole.ADMIN ? 
                      <UsersManager currentUser={user} /> : 
                      <Navigate to="/admin/dashboard" />
                    } 
                  />
                  <Route path="logs" element={<Logs />} />
                  <Route 
                    path="settings" 
                    element={
                        user.role === UserRole.ADMIN ?
                        <Settings currentUser={user} /> :
                        <Navigate to="/admin/dashboard" />
                    } 
                  />
                  <Route path="*" element={<Navigate to="dashboard" />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;