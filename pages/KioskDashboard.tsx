import React, { useEffect, useState } from 'react';
import { getKiosks, saveKiosk, addLog } from '../services/storageService';
import { Kiosk, Slide, ContentType, User } from '../types';
import { Edit, Monitor, Play, ExternalLink, Plus, Trash2, Clock, Image as ImageIcon, Globe, Server, Download, FileJson, Code, Wifi, WifiOff, AlertTriangle, FileCode } from 'lucide-react';

interface Props {
  currentUser: User;
}

const KioskDashboard: React.FC<Props> = ({ currentUser }) => {
  const [kiosks, setKiosks] = useState<Kiosk[]>([]);
  const [selectedKiosk, setSelectedKiosk] = useState<Kiosk | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setKiosks(getKiosks());
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
      status: 'offline',
      slides: []
    };
    
    // Save to local storage
    saveKiosk(newKiosk);
    
    // Update state immediately to reflect change in UI
    setKiosks(prevKiosks => [...prevKiosks, newKiosk]);
    
    addLog(currentUser.username, 'CREATE_KIOSK', `נוצרה עמדה חדשה: ${newKiosk.name}`);
  };

  const handleEdit = (kiosk: Kiosk) => {
    setSelectedKiosk({ ...kiosk }); // Clone to avoid direct mutation
    setIsEditing(true);
  };

  const handleSave = () => {
    if (selectedKiosk) {
      saveKiosk(selectedKiosk);
      
      // Update the specific kiosk in the local state list
      setKiosks(prevKiosks => 
        prevKiosks.map(k => k.id === selectedKiosk.id ? selectedKiosk : k)
      );
      
      addLog(currentUser.username, 'UPDATE_KIOSK', `עדכון הגדרות עבור ${selectedKiosk.name}`);
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
      type: ContentType.IMAGE,
      url: 'https://picsum.photos/1920/1080',
      duration: 10,
      title: 'שקופית חדשה'
    };
    setSelectedKiosk({ ...selectedKiosk, slides: [...selectedKiosk.slides, newSlide] });
  };

  const removeSlide = (index: number) => {
    if (!selectedKiosk) return;
    const newSlides = selectedKiosk.slides.filter((_, i) => i !== index);
    setSelectedKiosk({ ...selectedKiosk, slides: newSlides });
  };

  // --- HTML Generator Logic ---
  const downloadGenericPlayer = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kiosk Generic Player</title>
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #000; }
        iframe { width: 100%; height: 100%; border: none; display: block; }
        #loader { 
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
            color: #888; font-family: sans-serif; text-align: center;
            z-index: 10;
            background: rgba(0,0,0,0.8);
            padding: 2rem;
            border-radius: 1rem;
        }
        .error { color: #ff6b6b; margin-bottom: 10px; }
        .config-info { position: absolute; bottom: 10px; right: 10px; color: rgba(255,255,255,0.3); font-family: monospace; font-size: 10px; pointer-events: none; z-index: 20; }
        input { background: #333; border: 1px solid #555; color: white; padding: 5px; border-radius: 4px; width: 300px; margin-top: 10px; }
        button { background: #3b82f6; border: none; color: white; padding: 5px 15px; border-radius: 4px; cursor: pointer; margin-left: 5px; }
        button:hover { background: #2563eb; }
    </style>
</head>
<body>
    <div id="loader">
        <div style="margin-bottom: 10px; font-size: 24px; color: white;">Kiosk Player</div>
        <div id="statusText" style="font-size: 14px; color: #ccc;">Loading configuration...</div>
        <div id="errorControls" style="display:none; margin-top: 20px;">
            <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">Update Config URL:</div>
            <input type="text" id="configUrlInput" placeholder="http://..." />
            <button onclick="retryWithNewUrl()">Retry</button>
        </div>
    </div>
    
    <iframe id="contentFrame" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
    <div id="sourceDisplay" class="config-info"></div>

    <script>
        /**
         * =================================================================================
         * CONFIGURATION SECTION
         * =================================================================================
         * You can set the JSON source URL here.
         * 
         * OPTIONS:
         * 1. Relative path: 'config.json' (if the file is on the same machine/folder)
         * 2. Absolute URL: 'https://myserver.com/api/kiosk-data.json'
         * 
         * You can also override this by adding ?source=YOUR_URL to the browser URL.
         * =================================================================================
         */
         
        let currentApiUrl = 'config.json'; 

        /** ================================================================================= */

        // Initialize
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('source')) {
            currentApiUrl = urlParams.get('source');
        }
        
        // Setup UI
        document.getElementById('configUrlInput').value = currentApiUrl;
        updateSourceDisplay();

        let config = null;

        function updateSourceDisplay() {
            document.getElementById('sourceDisplay').innerText = 'Source: ' + currentApiUrl;
        }

        window.retryWithNewUrl = function() {
            const newUrl = document.getElementById('configUrlInput').value;
            if (newUrl) {
                currentApiUrl = newUrl;
                updateSourceDisplay();
                document.getElementById('statusText').innerHTML = 'Retrying...';
                document.getElementById('statusText').className = '';
                document.getElementById('errorControls').style.display = 'none';
                fetchConfig();
            }
        };

        async function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        async function fetchConfig() {
            try {
                console.log('Fetching configuration from ' + currentApiUrl);
                
                // Warn about file protocol if using http source
                if (window.location.protocol === 'file:' && currentApiUrl.startsWith('http')) {
                    console.warn('CORS Warning: Fetching http resource from file protocol may fail.');
                }

                // Add timestamp to prevent caching
                const separator = currentApiUrl.includes('?') ? '&' : '?';
                const cacheBusterUrl = currentApiUrl + separator + 't=' + Date.now();
                
                const response = await fetch(cacheBusterUrl, { cache: 'no-store' });
                
                if (!response.ok) throw new Error('HTTP Status: ' + response.status);
                
                const text = await response.text();
                try {
                    config = JSON.parse(text);
                } catch (e) {
                    throw new Error('Invalid JSON format');
                }

                document.getElementById('loader').style.display = 'none';
                
                // Start rotation logic
                runLoop();

            } catch (error) {
                console.error('Fetch failed', error);
                const loader = document.getElementById('loader');
                const statusText = document.getElementById('statusText');
                const errorControls = document.getElementById('errorControls');
                
                loader.style.display = 'block';
                statusText.className = 'error';
                statusText.innerHTML = '<strong>Connection Failed</strong><br>' + error.message;
                
                if (window.location.protocol === 'file:' && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
                    statusText.innerHTML += '<br><br><span style="color:#aaa; font-size:12px">Tip: If opening locally, Chrome blocks AJAX. Try using a local server or Firefox.</span>';
                }

                errorControls.style.display = 'block';
                
                // Auto retry after 30 seconds
                setTimeout(() => {
                    if (loader.style.display !== 'none') {
                        fetchConfig();
                    }
                }, 30000);
            }
        }

        async function runLoop() {
            if (!config || !config.sites || !Array.isArray(config.sites) || config.sites.length === 0) {
                console.warn('No sites in config');
                document.getElementById('loader').style.display = 'block';
                document.getElementById('statusText').innerText = 'Configuration loaded but contains no sites.';
                await sleep(5000);
                fetchConfig(); 
                return;
            }

            const intervalMs = (config.interval || 10) * 1000;

            for (const siteUrl of config.sites) {
                console.log('Displaying: ' + siteUrl);
                const frame = document.getElementById('contentFrame');
                
                // Simply setting src is usually enough. 
                // Browsers might not reload if src is identical.
                // We rely on the rotation to keep things fresh.
                frame.src = siteUrl;
                
                // Wait for interval
                await sleep(intervalMs);
            }

            // End of loop - Reload JSON to check for updates
            console.log('Loop finished. Checking for updates...');
            fetchConfig();
        }

        // Start the player
        fetchConfig();
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generic-player.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadHtmlPlayer = (kiosk: Kiosk) => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kiosk Player - ${kiosk.name}</title>
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #000; }
        iframe { width: 100%; height: 100%; border: none; display: block; }
        #loader { 
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
            color: #888; font-family: sans-serif; text-align: center;
        }
        .error { color: #ff4444; }
    </style>
</head>
<body>
    <div id="loader">
        <div style="margin-bottom: 10px; font-size: 24px;">Connecting to server...</div>
        <div style="font-size: 14px;">ID: <span id="kioskIdDisplay"></span></div>
    </div>
    <iframe id="contentFrame" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>

    <script>
        // 1. Read 'id' from URL parameter
        const params = new URLSearchParams(window.location.search);
        // Default to the downloaded ID if param is missing
        const kioskId = params.get('id') || '${kiosk.id}'; 
        document.getElementById('kioskIdDisplay').innerText = kioskId;

        // Configuration
        // In a real scenario, change this to your actual API endpoint
        // e.g. 'https://my-server.com/api/' + kioskId + '.json'
        // Here we assume the JSON file is in the same directory as this HTML file
        const API_URL = kioskId + '.json'; 
        
        let config = null;

        async function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        async function fetchConfig() {
            try {
                console.log('Fetching configuration from ' + API_URL);
                // 3. Prevent Caching (Timestamp)
                const response = await fetch(API_URL + '?t=' + Date.now());
                
                if (!response.ok) throw new Error('Status: ' + response.status);
                
                config = await response.json();
                document.getElementById('loader').style.display = 'none';
                
                // Start rotation logic
                runLoop();

            } catch (error) {
                console.error('Fetch failed', error);
                const loader = document.getElementById('loader');
                loader.style.display = 'block';
                loader.innerHTML = '<div class="error" style="font-size:24px">Connection Failed</div><br>Retrying in 30s...';
                
                // 5. Robustness: Retry after 30 seconds
                setTimeout(fetchConfig, 30000);
            }
        }

        async function runLoop() {
            if (!config || !config.sites || config.sites.length === 0) {
                console.warn('No sites in config');
                await sleep(5000);
                fetchConfig(); // Retry fetch
                return;
            }

            // 4. Rotation Logic
            const intervalMs = (config.interval || 10) * 1000;

            for (const siteUrl of config.sites) {
                console.log('Displaying: ' + siteUrl);
                const frame = document.getElementById('contentFrame');
                frame.src = siteUrl;
                
                // Wait for interval
                await sleep(intervalMs);
            }

            // 2. End of loop - Reload JSON
            console.log('Loop finished. Reloading config...');
            fetchConfig();
        }

        // Start
        fetchConfig();
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${kiosk.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadJsonConfig = (kiosk: Kiosk) => {
    // Map existing slides to the simple structure requested: { interval: number, sites: [] }
    // We use the first slide's duration as the global interval for this simplified format
    const simplifiedConfig = {
      interval: kiosk.slides[0]?.duration || 10,
      sites: kiosk.slides.map(s => s.url)
    };

    const blob = new Blob([JSON.stringify(simplifiedConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${kiosk.id}.json`;
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
            סה"כ עמדות פעילות: <span className="text-blue-400 font-bold">{kiosks.length}</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={downloadGenericPlayer}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 px-5 py-3 rounded-xl transition-all shadow-lg active:scale-95"
            title="הורד נגן HTML עצמאי שקורא קובץ config.json"
          >
            <FileCode size={20} />
            <span>הורד נגן עצמאי</span>
          </button>

          <button 
            type="button"
            onClick={handleAddNewKiosk}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95"
          >
            <Plus size={20} />
            <span>הוסף עמדה חדשה</span>
          </button>
        </div>
      </div>

      {/* Kiosk Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {kiosks.map((kiosk) => (
          <div key={kiosk.id} className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 hover:border-slate-600 hover:shadow-2xl transition-all p-5 flex flex-col group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2" title={`Status: ${kiosk.status}`}>
                {kiosk.status === 'online' && (
                  <Wifi size={16} className="text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                )}
                {kiosk.status === 'offline' && (
                  <WifiOff size={16} className="text-slate-500" />
                )}
                {kiosk.status === 'maintenance' && (
                  <AlertTriangle size={16} className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                )}
                <span className="text-[10px] font-mono text-slate-500 uppercase">{kiosk.id.split('-')[0]}..</span>
              </div>
              <div className="flex gap-1">
                 <button 
                   onClick={() => downloadHtmlPlayer(kiosk)}
                   className="text-slate-500 hover:text-blue-400 p-1 rounded transition-colors"
                   title="הורד קובץ HTML (Player)"
                 >
                   <Code size={16} />
                 </button>
                 <button 
                   onClick={() => downloadJsonConfig(kiosk)}
                   className="text-slate-500 hover:text-yellow-400 p-1 rounded transition-colors"
                   title="הורד קובץ JSON (Config)"
                 >
                   <FileJson size={16} />
                 </button>
              </div>
            </div>
            
            <div className="flex-1 mb-6">
              <h3 className="font-bold text-lg text-slate-100 truncate group-hover:text-blue-400 transition-colors" title={kiosk.name}>{kiosk.name}</h3>
              <p className="text-sm text-slate-400 mt-1">{kiosk.location}</p>
              <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5 bg-slate-900/50 p-2 rounded-lg w-fit">
                <Play size={12} className="text-blue-400"/>
                <span>{kiosk.slides.length} שקופיות</span>
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
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20 py-2.5 rounded-lg text-sm transition-colors font-medium"
              >
                <Monitor size={14} /> צפייה
              </button>
            </div>
          </div>
        ))}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                 <div>
                   <label className="block text-sm font-medium text-slate-400 mb-2">שם העמדה</label>
                   <input 
                     type="text" 
                     value={selectedKiosk.name}
                     onChange={(e) => setSelectedKiosk({...selectedKiosk, name: e.target.value})}
                     className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-400 mb-2">מיקום</label>
                   <input 
                     type="text" 
                     value={selectedKiosk.location}
                     onChange={(e) => setSelectedKiosk({...selectedKiosk, location: e.target.value})}
                     className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-400 mb-2">סטטוס</label>
                   <select 
                     value={selectedKiosk.status}
                     onChange={(e) => setSelectedKiosk({...selectedKiosk, status: e.target.value as 'online' | 'offline' | 'maintenance'})}
                     className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                   >
                     <option value="online">Online</option>
                     <option value="offline">Offline</option>
                     <option value="maintenance">Maintenance</option>
                   </select>
                 </div>
              </div>

              <div className="mb-6 flex justify-between items-end border-b border-slate-800 pb-4">
                <h4 className="font-bold text-lg text-white flex items-center gap-2">
                  <Play className="text-blue-500" size={20} />
                  רשימת השמעה (Playlist)
                </h4>
                <button type="button" onClick={addSlide} className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
                  <Plus size={16} /> הוסף שקופית
                </button>
              </div>

              <div className="space-y-4">
                {selectedKiosk.slides.map((slide, idx) => (
                  <div key={slide.id} className="flex gap-4 p-5 bg-slate-800 border border-slate-700 rounded-xl items-start animate-in fade-in slide-in-from-top-2 hover:border-slate-600 transition-colors">
                    <div className="mt-2 bg-slate-700 text-slate-300 w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-sm shadow-inner">
                      {idx + 1}
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-slate-500 mb-2">סוג תוכן</label>
                        <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-1">
                           <button 
                             type="button"
                             onClick={() => updateSlide(idx, 'type', ContentType.IMAGE)}
                             className={`flex-1 py-2 rounded-md flex justify-center transition-all ${slide.type === ContentType.IMAGE ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                             title="תמונה"
                           >
                             <ImageIcon size={18} />
                           </button>
                           <button 
                             type="button"
                             onClick={() => updateSlide(idx, 'type', ContentType.URL)}
                             className={`flex-1 py-2 rounded-md flex justify-center transition-all ${slide.type === ContentType.URL ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                             title="אתר אינטרנט"
                           >
                             <Globe size={18} />
                           </button>
                        </div>
                      </div>

                      <div className="md:col-span-6">
                        <label className="block text-xs font-medium text-slate-500 mb-2">כתובת URL / תמונה</label>
                        <input 
                           type="text" 
                           value={slide.url}
                           onChange={(e) => updateSlide(idx, 'url', e.target.value)}
                           className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5 text-sm ltr-text focus:border-blue-500 outline-none font-mono"
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
                             className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5 text-sm pl-10 focus:border-blue-500 outline-none"
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
                    אין שקופיות להצגה. הוסף שקופית חדשה.
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end gap-4 rounded-b-2xl">
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-2.5 text-slate-300 hover:bg-slate-800 rounded-lg font-medium transition-colors"
              >
                ביטול
              </button>
              <button 
                type="button"
                onClick={handleSave}
                className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-500 rounded-lg font-medium shadow-lg shadow-blue-900/40 transition-colors"
              >
                שמור שינויים
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KioskDashboard;