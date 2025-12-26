import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User as UserIcon, MonitorPlay } from 'lucide-react';
import { getUsers, addLog } from '../services/storageService';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      addLog(user.username, 'LOGIN', 'המשתמש נכנס למערכת');
      onLogin(user);
      navigate('/admin/dashboard');
    } else {
      setError('שם משתמש או סיסמה שגויים');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-800">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="bg-blue-600/20 p-4 rounded-full mb-4">
            <MonitorPlay size={40} className="text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">כניסה למערכת</h1>
          <p className="text-slate-400 mt-2">Kiosk Master Pro</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">שם משתמש</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-500"
                placeholder="הכנס שם משתמש"
              />
              <UserIcon className="absolute left-3 top-3.5 text-slate-500" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">סיסמה</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-500"
                placeholder="********"
              />
              <Lock className="absolute left-3 top-3.5 text-slate-500" size={20} />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-600/40"
          >
            התחבר
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;