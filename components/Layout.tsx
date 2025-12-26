import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MonitorPlay, LogOut, FileText } from 'lucide-react';
import { User, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-l border-slate-800 flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <MonitorPlay className="text-blue-500" />
            <span>Kiosk Pro</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2">שלום, {user.fullName}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`
            }
          >
            <LayoutDashboard size={20} />
            <span>לוח בקרה</span>
          </NavLink>

          {user.role === UserRole.ADMIN && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              <Users size={20} />
              <span>ניהול משתמשים</span>
            </NavLink>
          )}

          <NavLink
            to="/admin/logs"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`
            }
          >
            <FileText size={20} />
            <span>לוג מערכת</span>
          </NavLink>
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 opacity-50 pointer-events-none"></div>
        <div className="p-8 relative z-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;