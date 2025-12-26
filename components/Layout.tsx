import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MonitorPlay, LogOut, FileText, Settings } from 'lucide-react';
import { User, UserRole } from '../types';
import { getSettings } from '../services/storageService';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const navigate = useNavigate();
  const settings = getSettings();
  const themeColor = settings.themeColor || 'blue';

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const getActiveStyle = (isActive: boolean) => {
    return isActive 
      ? `bg-${themeColor}-600/20 text-${themeColor}-400 border border-${themeColor}-600/30` 
      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200';
  };

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-l border-slate-800 flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <MonitorPlay className={`text-${themeColor}-500`} />
            <span>Kiosk Pro</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2">שלום, {user.fullName}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${getActiveStyle(isActive)}`
            }
          >
            <LayoutDashboard size={20} />
            <span>לוח בקרה</span>
          </NavLink>

          {user.role === UserRole.ADMIN && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${getActiveStyle(isActive)}`
              }
            >
              <Users size={20} />
              <span>ניהול משתמשים</span>
            </NavLink>
          )}

          <NavLink
            to="/admin/logs"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${getActiveStyle(isActive)}`
            }
          >
            <FileText size={20} />
            <span>לוג מערכת</span>
          </NavLink>

          {user.role === UserRole.ADMIN && (
            <NavLink
              to="/admin/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${getActiveStyle(isActive)}`
              }
            >
              <Settings size={20} />
              <span>הגדרות מערכת</span>
            </NavLink>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-red-400 hover:bg-red-950/30 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>יציאה</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-900 relative">
        {/* Background gradient effect */}
        <div className={`absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 opacity-50 pointer-events-none`}></div>
        <div className="p-8 relative z-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;