import React, { useEffect, useState } from 'react';
import { getLogs } from '../services/storageService';
import { LogEntry } from '../types';
import { Clock, Activity } from 'lucide-react';

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    setLogs(getLogs());
    const interval = setInterval(() => {
        setLogs(getLogs());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('he-IL');
  };

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN')) return 'text-green-400 bg-green-900/20 border-green-900/30';
    if (action.includes('DELETE')) return 'text-red-400 bg-red-900/20 border-red-900/30';
    if (action.includes('CREATE')) return 'text-purple-400 bg-purple-900/20 border-purple-900/30';
    return 'text-blue-400 bg-blue-900/20 border-blue-900/30';
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <h2 className="text-3xl font-bold text-white">לוג פעילות מערכת</h2>
        <div className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-sm font-mono border border-slate-700 flex items-center gap-2">
            <Activity size={14} />
            LIVE
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-900/50 text-slate-400 uppercase tracking-wider text-xs">
              <tr>
                <th className="p-5 font-medium whitespace-nowrap w-48">זמן</th>
                <th className="p-5 font-medium whitespace-nowrap w-40">משתמש</th>
                <th className="p-5 font-medium whitespace-nowrap w-40">פעולה</th>
                <th className="p-5 font-medium">פרטים</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="p-5 text-slate-400 flex items-center gap-2 font-mono text-xs">
                    <Clock size={14} className="text-slate-600" />
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="p-5 font-bold text-white">{log.username}</td>
                  <td className="p-5">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-mono border ${getActionColor(log.action)}`}>
                        {log.action}
                    </span>
                  </td>
                  <td className="p-5 text-slate-300">{log.details}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500">
                    אין רשומות בלוג עדיין
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Logs;