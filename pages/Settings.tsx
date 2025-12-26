import React, { useState } from 'react';
import { getSettings, saveSettings, addLog } from '../services/storageService';
import { User, SystemSettings } from '../types';
import { Settings as SettingsIcon, Save, Palette, Database } from 'lucide-react';

interface Props {
  currentUser: User;
}

const Settings: React.FC<Props> = ({ currentUser }) => {
  const [settings, setSettings] = useState<SystemSettings>(getSettings());
  const [isSaved, setIsSaved] = useState(false);

  const colors = [
    { name: 'כחול', value: 'blue', class: 'bg-blue-500' },
    { name: 'ירוק', value: 'emerald', class: 'bg-emerald-500' },
    { name: 'סגול', value: 'purple', class: 'bg-purple-500' },
    { name: 'אדום', value: 'rose', class: 'bg-rose-500' },
    { name: 'כתום', value: 'orange', class: 'bg-orange-500' },
  ];

  const handleSave = () => {
    saveSettings(settings);
    addLog(currentUser.username, 'UPDATE_SETTINGS', 'עודכנו הגדרות מערכת (ערכת נושא/שרת)');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    // Force reload to apply theme changes globally if needed, though React state usually handles it if propagated.
    // Since we don't use a global context provider in this simple app, navigation triggers re-renders.
    // However, a hard reload ensures clean state.
    setTimeout(() => window.location.reload(), 500);
  };

  const themeColor = settings.themeColor || 'blue';

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
        <SettingsIcon className={`text-${themeColor}-500`} />
        הגדרות מערכת
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Style Settings */}
        <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Palette size={20} className="text-slate-400" />
                נראות ועיצוב
            </h3>
            
            <label className="block text-sm font-medium text-slate-400 mb-4">צבע נושא ראשי (Accent Color)</label>
            <div className="flex gap-4">
                {colors.map((color) => (
                    <button
                        key={color.value}
                        onClick={() => setSettings({...settings, themeColor: color.value})}
                        className={`w-12 h-12 rounded-full ${color.class} transition-all border-4 ${settings.themeColor === color.value ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105 opacity-70 hover:opacity-100'}`}
                        title={color.name}
                    />
                ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">בחירה זו תשפיע על הכפתורים, התפריטים וההדגשות במערכת.</p>
        </div>

        {/* Server Settings */}
        <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Database size={20} className="text-slate-400" />
                הגדרות שרת (IIS/SQLite)
            </h3>
            
            <p className="text-slate-400 text-sm mb-4">
                כדי שהנגנים יעבדו, עליך לייצא את קובץ ה-Master DB ולמקם אותו בשרת ה-IIS שלך.
                <br/>
                הזן כאן את כתובת ה-URL המלאה שבה הקובץ (.sqlite) יהיה זמין.
            </p>
            
            <label className="block text-sm font-medium text-slate-300 mb-2">Master DB URL</label>
            <input 
                type="text" 
                value={settings.dbServerUrl}
                onChange={(e) => setSettings({...settings, dbServerUrl: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none dir-ltr font-mono text-sm"
                placeholder="http://your-server/master.sqlite"
                dir="ltr"
            />
        </div>

      </div>

      <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSave}
            className={`flex items-center gap-2 px-8 py-3 bg-${themeColor}-600 text-white hover:bg-${themeColor}-500 rounded-xl font-bold shadow-lg shadow-${themeColor}-900/40 transition-all active:scale-95`}
          >
              <Save size={20} />
              {isSaved ? 'הגדרות נשמרו!' : 'שמור הגדרות'}
          </button>
      </div>
    </div>
  );
};

export default Settings;