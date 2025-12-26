import React, { useEffect, useState } from 'react';
import { getKiosks, saveKiosk, addLog, getSettings } from '../services/storageService';
import { Kiosk, Slide, ContentType, User, UserRole } from '../types';
import { Edit, Monitor, Play, Plus, Trash2, Clock, Server, Database, FileCode, Loader2, Wifi, WifiOff, Power } from 'lucide-react';

interface Props {
  currentUser: User;
}

const KioskDashboard: React.FC<Props> = ({ currentUser }) => {
  const [kiosks, setKiosks] = useState<Kiosk[]>([]);
  const [selectedKiosk, setSelectedKiosk] = useState<Kiosk | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sqlJsLoaded, setSqlJsLoaded] = useState(false);
  
  // Read theme for display
  const themeColor = getSettings().themeColor || 'blue';

  useEffect(() => {
    setKiosks(getKiosks());
    
    // Dynamically load sql.js from CDN if not already loaded
    if (!(window as any).initSqlJs) {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js";
        script.onload = () => {
            setSqlJsLoaded(true);
            console.log("SQL.js loaded");
        };
        document.head.appendChild(script);
    } else {
        setSqlJsLoaded(true);
    }
  }, []);

  const openClient = (id: string) => {
    // Construct absolute URL to avoid hash issues
    const baseUrl = window.location.href.split('#')[0];
    const fullUrl = `${baseUrl}#/client/${id}`;
    window.open(fullUrl, '_blank');
  };

  const handleAddNewKiosk = () => {
    const newId = `kiosk-${Date.now()}`;
    const newKiosk: Kiosk = {
      id: newId,
      name: `עמדה חדשה ${kiosks.length + 1}`,
      location: 'מיקום לא מוגדר',
      isActive: true,
      slides: []
    };
    
    // Save to local storage
    saveKiosk(newKiosk);
    setKiosks(getKiosks());
    
    addLog(currentUser.username, 'CREATE_KIOSK', `נוצרה עמדה חדשה: ${newKiosk.name}`);
  };

  const handleEdit = (kiosk: Kiosk) => {
    setSelectedKiosk({ ...kiosk }); // Clone to avoid direct mutation
    setIsEditing(true);
  };

  // --- Helper to generate the SQLite Database (Binary) ---
  const generateSQLiteDB = async (kiosksList: Kiosk[]): Promise<Uint8Array> => {
    if (!sqlJsLoaded || !(window as any).initSqlJs) {
        throw new Error("SQL.js library not loaded yet");
    }

    const SQL = await (window as any).initSqlJs({
        locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });

    const db = new SQL.Database();

    // Create Tables
    db.run("CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT);");
    db.run("CREATE TABLE kiosks (id TEXT PRIMARY KEY, name TEXT, location TEXT, is_active INTEGER);");
    db.run("CREATE TABLE slides (id TEXT PRIMARY KEY, kiosk_id TEXT, type TEXT, url TEXT, duration INTEGER, sort_order INTEGER, title TEXT);");

    // Insert Metadata
    db.run("INSERT INTO metadata VALUES (?, ?)", ["generatedAt", Date.now().toString()]);

    // Insert Data
    for (const kiosk of kiosksList) {
        db.run("INSERT INTO kiosks VALUES (?, ?, ?, ?)", [kiosk.id, kiosk.name, kiosk.location, kiosk.isActive ? 1 : 0]);
        
        // Only insert slides if kiosk is active? Or allow data but client filters?
        // Let's insert all, and client can decide or we query.
        kiosk.slides.forEach((slide, index) => {
            db.run("INSERT INTO slides VALUES (?, ?, ?, ?, ?, ?, ?)", [
                slide.id,
                kiosk.id,
                slide.type,
                slide.url,
                slide.duration,
                index, // for sorting
                slide.title || ''
            ]);
        });
    }

    // Export to Uint8Array
    const binaryArray = db.export();
    return binaryArray;
  };

  const handleSave = async () => {
    if (!selectedKiosk) return;
    const currentSettings = getSettings(); // Read fresh settings

    setIsSaving(true);

    try {
      // 1. Update Local Storage first (Safety)
      saveKiosk(selectedKiosk);
      
      const updatedKiosks = kiosks.map(k => k.id === selectedKiosk.id ? selectedKiosk : k);
      setKiosks(updatedKiosks);

      // 2. Generate SQLite Binary
      let dbBlob: Blob;
      try {
        const binaryData = await generateSQLiteDB(updatedKiosks);
        dbBlob = new Blob([binaryData], { type: 'application/x-sqlite3' });
      } catch (e: any) {
        throw new Error("Failed to generate DB: " + e.message);
      }

      // 3. Attempt to push to Server
      try {
        if (!currentSettings.dbServerUrl || (currentSettings.dbServerUrl.includes('localhost') && window.location.protocol === 'https:')) {
           // check mixed content
        }

        const response = await fetch(currentSettings.dbServerUrl, {
            method: 'POST', 
            headers: {
            'Content-Type': 'application/x-sqlite3',
            },
            body: dbBlob
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        addLog(currentUser.username, 'UPDATE_KIOSK', `עודכן בהצלחה (מקומי + DB): ${selectedKiosk.name}`);

      } catch (networkError: any) {
        console.warn('Remote sync failed:', networkError);
        addLog(currentUser.username, 'UPDATE_LOCAL_ONLY', `נשמר מקומית בלבד (שרת לא זמין): ${selectedKiosk.name}`);
      }

    } catch (error: any) {
      console.error('Critical Save failed:', error);
      alert(`שגיאה קריטית בשמירה: ${error.message}`);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
      setSelectedKiosk(null);
    }
  };

  const updateSlide = (index: number, field: keyof Slide, value: any) => {
    if (!selectedKiosk) return;
    const newSlides = [...selectedKiosk.slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setSelectedKiosk({ ...selectedKiosk, slides: newSlides });
  };

  const addSlide = () => {
    if (!selectedKiosk) return;
    const newSlide: Slide = {
      id: Date.now().toString(),
      type: ContentType.URL, // Default to URL
      url: 'https://www.google.com/webhp?igu=1',
      duration: 10,
      title: 'קישור חדש'
    };
    setSelectedKiosk({ ...selectedKiosk, slides: [...selectedKiosk.slides, newSlide] });
  };

  const removeSlide = (index: number) => {
    if (!selectedKiosk) return;
    const newSlides = selectedKiosk.slides.filter((_, i) => i !== index);
    setSelectedKiosk({ ...selectedKiosk, slides: newSlides });
  };

  // --- Master DB Generation (Download) ---
  const downloadMasterDb = async () => {
    try {
        const binaryData = await generateSQLiteDB(kiosks);
        const blob = new Blob([binaryData], { type: 'application/x-sqlite3' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `master.sqlite`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        addLog(currentUser.username, 'DOWNLOAD_DB', 'הורדת קובץ Master DB');
    } catch (e: any) {
        alert("שגיאה ביצירת מסד הנתונים: " + e.message);
    }
  };

  // --- HTML Generator Logic (Smart Player with SQL) ---
  const downloadSmartPlayer = () => {
    const currentSettings = getSettings();
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enterprise Kiosk Player (SQL)</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js"></script>
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #000; }
        #contentContainer { width: 100%; height: 100%; position: absolute; top: 0; left: 0; }
        iframe { width: 100%; height: 100%; border: none; display: block; }
        
        #loader { 
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
            color: #888; font-family: sans-serif; text-align: center;
            z-index: 10; background: rgba(0,0,0,0.8); padding: 2rem; border-radius: 1rem;
        }
        .error { color: #ff6b6b; margin-bottom: 10px; }
        .info-bar { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.5); color: white; padding: 5px; font-size: 10px; font-family: monospace; display: flex; justify-content: space-between; pointer-events: none; z-index: 20; }
    </style>
</head>
<body>
    <div id="loader">
        <div style="margin-bottom: 10px; font-size: 24px; color: white;">Enterprise Kiosk</div>
        <div id="statusText" style="font-size: 14px; color: #ccc;">Loading Database...</div>
    </div>
    
    <div id="contentContainer"></div>
    <div class="info-bar">
        <span id="kioskIdDisplay">ID: --</span>
        <span id="sourceDisplay">DB: --</span>
    </div>

    <script>
        const DB_URL = '${currentSettings.dbServerUrl}'; 
        const urlParams = new URLSearchParams(window.location.search);
        const kioskId = urlParams.get('id');

        document.getElementById('sourceDisplay').innerText = DB_URL;
        document.getElementById('kioskIdDisplay').innerText = 'ID: ' + (kioskId || 'MISSING');

        let db = null;
        let slides = [];
        let currentSlideIndex = 0;
        let slideTimeout = null;

        if (!kioskId) {
            showError('Missing "id" parameter in URL.');
        } else {
            initSystem();
        }

        function showError(msg) {
            const el = document.getElementById('statusText');
            el.innerHTML = msg;
            el.className = 'error';
            document.getElementById('loader').style.display = 'block';
        }

        async function initSystem() {
            try {
                // 1. Load SQL.js
                const SQL = await window.initSqlJs({
                    locateFile: file => \`https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/\${file}\`
                });

                // 2. Fetch Database File
                console.log('Fetching DB from ' + DB_URL);
                const response = await fetch(DB_URL + '?t=' + Date.now());
                if (!response.ok) throw new Error('HTTP ' + response.status);
                const buf = await response.arrayBuffer();

                // 3. Open Database
                db = new SQL.Database(new Uint8Array(buf));
                document.getElementById('statusText').innerText = "DB Loaded. Querying...";

                // 4. Check Status (isActive)
                const statusStmt = db.prepare("SELECT is_active, name FROM kiosks WHERE id = :id");
                statusStmt.bind({':id': kioskId});
                if (!statusStmt.step()) {
                    throw new Error('Kiosk ID not found in database.');
                }
                const statusRow = statusStmt.getAsObject();
                statusStmt.free();

                if (!statusRow.is_active) {
                    // Nice UI for inactive state
                    document.body.innerHTML = \`
                        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#0f172a; color:#94a3b8; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction:rtl;">
                            <div style="background:rgba(127,29,29,0.2); padding:2rem; border-radius:50%; margin-bottom:1.5rem;">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                                    <line x1="12" y1="2" x2="12" y2="12"></line>
                                </svg>
                            </div>
                            <h1 style="color:white; margin:0 0 0.5rem 0; font-size:2.5rem; font-weight:700;">העמדה אינה פעילה</h1>
                            <p style="font-size:1.2rem;">העמדה <span style="color:#f87171; font-weight:bold;">\${statusRow.name}</span> הוגדרה ככבויה במערכת הניהול.</p>
                        </div>
                    \`;
                    return; 
                }

                // 5. Query Slides
                const stmt = db.prepare("SELECT url, duration, type FROM slides WHERE kiosk_id = :id ORDER BY sort_order ASC");
                stmt.bind({':id': kioskId});
                
                slides = [];
                while(stmt.step()) {
                    const row = stmt.getAsObject();
                    slides.push(row);
                }
                stmt.free();

                if (slides.length === 0) {
                     showError('Kiosk is active but has no content assigned.');
                     return;
                }

                document.getElementById('loader').style.display = 'none';
                startSlideshow();

            } catch (error) {
                console.error(error);
                showError('System Error: ' + error.message + '<br>Retrying in 30s...');
                setTimeout(initSystem, 30000);
            }
        }

        function startSlideshow() {
            if (slides.length === 0) return;
            showSlide(currentSlideIndex);
        }

        function showSlide(index) {
            clearTimeout(slideTimeout);
            const slide = slides[index];
            const container = document.getElementById('contentContainer');
            
            container.innerHTML = ''; 
            const iframe = document.createElement('iframe');
            iframe.src = slide.url;
            iframe.sandbox = "allow-scripts allow-same-origin allow-forms";
            container.appendChild(iframe);

            const duration = (slide.duration || 10) * 1000;
            slideTimeout = setTimeout(() => {
                currentSlideIndex = (currentSlideIndex + 1) % slides.length;
                showSlide(currentSlideIndex);
            }, duration);
        }
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-player-sql.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">ניהול עמדות קיוסק</h2>
          <div className="text-slate-400 flex items-center gap-2">
            <Server size={16} />
            סה"כ עמדות: <span className={`text-${themeColor}-400 font-bold`}>{kiosks.length}</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          {currentUser.role === UserRole.ADMIN && (
             <>
               <button 
                type="button"
                onClick={downloadMasterDb}
                className={`flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl transition-all shadow-lg active:scale-95`}
                title="הורד מסד נתונים (SQLite)"
               >
                 <Database size={20} />
                 <span>Master DB</span>
               </button>
             </>
          )}

          <button 
            type="button"
            onClick={downloadSmartPlayer}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 px-5 py-3 rounded-xl transition-all shadow-lg active:scale-95"
            title="הורד נגן Smart HTML שקורא ממסד נתונים"
          >
            <FileCode size={20} />
            <span>הורד Viewer</span>
          </button>

          <button 
            type="button"
            onClick={handleAddNewKiosk}
            className={`flex items-center gap-2 bg-${themeColor}-600 hover:bg-${themeColor}-500 text-white px-5 py-3 rounded-xl transition-all shadow-lg shadow-${themeColor}-900/20 active:scale-95`}
          >
            <Plus size={20} />
            <span>הוסף עמדה</span>
          </button>
        </div>
      </div>

      {/* Kiosk Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {kiosks.map((kiosk) => {
          // Status Logic: Active AND has slides
          const isOperational = kiosk.isActive && kiosk.slides.length > 0;

          return (
          <div key={kiosk.id} className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 hover:border-slate-600 transition-all p-5 flex flex-col group relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="bg-slate-700 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded uppercase">{kiosk.id.split('-')[1]}</span>
              </div>
              
              {/* Status Icon */}
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-colors ${isOperational ? 'bg-green-500/20 text-green-500' : 'bg-slate-700 text-slate-500'}`}
                title={isOperational ? 'פעיל ומציג' : 'לא פעיל'}
              >
                  {isOperational ? <Wifi size={16} /> : <WifiOff size={16} />}
              </div>
            </div>
            
            <div className="flex-1 mb-6">
              <h3 className={`font-bold text-lg text-slate-100 truncate group-hover:text-${themeColor}-400 transition-colors`} title={kiosk.name}>{kiosk.name}</h3>
              <p className="text-sm text-slate-400 mt-1">{kiosk.location}</p>
              <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5 bg-slate-900/50 p-2 rounded-lg w-fit">
                <Play size={12} className={`text-${themeColor}-400`}/>
                <span>{kiosk.slides.length} קישורים</span>
              </div>
            </div>

            <div className="flex gap-3 mt-auto pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={() => handleEdit(kiosk)}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2.5 rounded-lg text-sm transition-colors font-medium"
              >
                <Edit size={14} /> עריכה
              </button>
              <button
                type="button"
                onClick={() => openClient(kiosk.id)}
                className={`flex-1 flex items-center justify-center gap-2 bg-${themeColor}-600/10 hover:bg-${themeColor}-600/20 text-${themeColor}-400 border border-${themeColor}-600/20 py-2.5 rounded-lg text-sm transition-colors font-medium`}
              >
                <Monitor size={14} /> צפייה
              </button>
            </div>
          </div>
        )})}
      </div>

      {/* Edit Modal */}
      {isEditing && selectedKiosk && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white">עריכת {selectedKiosk.name}</h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors">✕</button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
              
              {/* Top Controls: Name, Location, Status */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
                 <div className="md:col-span-4">
                   <label className="block text-sm font-medium text-slate-400 mb-2">שם העמדה</label>
                   <input 
                     type="text" 
                     value={selectedKiosk.name}
                     onChange={(e) => setSelectedKiosk({...selectedKiosk, name: e.target.value})}
                     className={`w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-${themeColor}-500 outline-none`}
                   />
                 </div>
                 <div className="md:col-span-4">
                   <label className="block text-sm font-medium text-slate-400 mb-2">מיקום</label>
                   <input 
                     type="text" 
                     value={selectedKiosk.location}
                     onChange={(e) => setSelectedKiosk({...selectedKiosk, location: e.target.value})}
                     className={`w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-${themeColor}-500 outline-none`}
                   />
                 </div>
                 <div className="md:col-span-4">
                   <label className="block text-sm font-medium text-slate-400 mb-2">סטטוס פעילות</label>
                   <button 
                     type="button"
                     onClick={() => setSelectedKiosk({...selectedKiosk, isActive: !selectedKiosk.isActive})}
                     className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                        selectedKiosk.isActive 
                        ? `bg-green-900/20 border-green-500/50 text-green-400` 
                        : `bg-slate-800 border-slate-600 text-slate-400`
                     }`}
                   >
                       <span className="flex items-center gap-2 font-medium">
                           <Power size={18} />
                           {selectedKiosk.isActive ? 'פעיל (ON)' : 'כבוי (OFF)'}
                       </span>
                       <div className={`w-10 h-5 rounded-full relative transition-colors ${selectedKiosk.isActive ? 'bg-green-500' : 'bg-slate-600'}`}>
                           <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${selectedKiosk.isActive ? 'right-1' : 'right-6'}`} />
                       </div>
                   </button>
                 </div>
              </div>

              <div className="mb-6 flex justify-between items-end border-b border-slate-800 pb-4">
                <h4 className="font-bold text-lg text-white flex items-center gap-2">
                  <Play className={`text-${themeColor}-500`} size={20} />
                  רשימת קישורים
                </h4>
                <button type="button" onClick={addSlide} className={`flex items-center gap-2 text-sm bg-${themeColor}-600 text-white px-4 py-2 rounded-lg hover:bg-${themeColor}-500 transition-colors shadow-lg shadow-${themeColor}-900/20`}>
                  <Plus size={16} /> הוסף קישור
                </button>
              </div>

              <div className="space-y-4">
                {selectedKiosk.slides.map((slide, idx) => (
                  <div key={slide.id} className="flex gap-4 p-5 bg-slate-800 border border-slate-700 rounded-xl items-start animate-in fade-in slide-in-from-top-2 hover:border-slate-600 transition-colors">
                    <div className="mt-2 bg-slate-700 text-slate-300 w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-sm shadow-inner">
                      {idx + 1}
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-9">
                        <label className="block text-xs font-medium text-slate-500 mb-2">כתובת URL</label>
                        <input 
                           type="text" 
                           value={slide.url}
                           onChange={(e) => updateSlide(idx, 'url', e.target.value)}
                           className={`w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5 text-sm ltr-text focus:border-${themeColor}-500 outline-none font-mono`}
                           dir="ltr"
                         />
                      </div>

                      <div className="md:col-span-3">
                         <label className="block text-xs font-medium text-slate-500 mb-2">משך (שניות)</label>
                         <div className="relative">
                           <input 
                             type="number" 
                             min="5"
                             value={slide.duration}
                             onChange={(e) => updateSlide(idx, 'duration', parseInt(e.target.value))}
                             className={`w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5 text-sm pl-10 focus:border-${themeColor}-500 outline-none`}
                           />
                           <Clock size={16} className="absolute left-3 top-2.5 text-slate-500" />
                         </div>
                      </div>
                    </div>

                    <button type="button" onClick={() => removeSlide(idx)} className="mt-8 text-slate-600 hover:text-red-400 hover:bg-red-900/10 p-2 rounded-lg transition-colors">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}

                {selectedKiosk.slides.length === 0 && (
                  <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/50">
                    <div className="flex justify-center mb-2"><Plus className="opacity-50" size={32}/></div>
                    אין קישורים להצגה. הוסף קישור חדש.
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end gap-4 rounded-b-2xl">
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="px-6 py-2.5 text-slate-300 hover:bg-slate-800 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                ביטול
              </button>
              <button 
                type="button"
                onClick={handleSave}
                disabled={isSaving || !sqlJsLoaded}
                className={`flex items-center gap-2 px-6 py-2.5 bg-${themeColor}-600 text-white hover:bg-${themeColor}-500 rounded-lg font-medium shadow-lg shadow-${themeColor}-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                title={!sqlJsLoaded ? 'טוען רכיבי SQL...' : ''}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    שומר לשרת...
                  </>
                ) : (
                  'שמור שינויים'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KioskDashboard;