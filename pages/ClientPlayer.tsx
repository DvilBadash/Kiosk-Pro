import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getKioskById } from '../services/storageService';
import { Kiosk, ContentType } from '../types';
import { WifiOff, Maximize, AlertCircle, Loader2 } from 'lucide-react';

const ClientPlayer: React.FC = () => {
  const { kioskId } = useParams<{ kioskId: string }>();
  const [kiosk, setKiosk] = useState<Kiosk | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [error, setError] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Poll for config changes every 30 seconds
  useEffect(() => {
    const fetchConfig = () => {
      if (!kioskId) return;
      const data = getKioskById(kioskId);
      if (data) {
        setKiosk(data);
      } else {
        setError('עמדת קיוסק לא נמצאה');
      }
    };

    fetchConfig();
    const interval = setInterval(fetchConfig, 30000);
    return () => clearInterval(interval);
  }, [kioskId]);

  // Handle Rotation
  useEffect(() => {
    if (!kiosk || kiosk.slides.length === 0) return;

    const currentSlide = kiosk.slides[currentSlideIndex];
    // Safety check if index is out of bounds due to deletion
    if (!currentSlide) {
        setCurrentSlideIndex(0);
        return;
    }

    const duration = (currentSlide.duration || 10) * 1000;

    const timer = setTimeout(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % kiosk.slides.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [kiosk, currentSlideIndex]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  if (error) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-white flex-col">
        <div className="bg-red-900/20 p-8 rounded-full mb-6 animate-pulse">
            <AlertCircle size={64} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-bold mb-2">שגיאה בטעינת הקיוסק</h1>
        <p className="text-slate-400 text-xl font-mono bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">ID: {kioskId}</p>
        <p className="text-slate-500 mt-8 text-sm">{error}</p>
      </div>
    );
  }

  if (!kiosk) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center flex-col">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={64} />
        <p className="text-slate-400 animate-pulse">טוען הגדרות...</p>
      </div>
    );
  }

  if (kiosk.slides.length === 0) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center flex-col text-slate-400">
        <div className="bg-slate-900 p-8 rounded-full mb-6">
            <WifiOff size={48} className="text-slate-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">ממתין לתוכן...</h2>
        <p>העמדה <span className="text-blue-400 font-bold">{kiosk.name}</span> פעילה אך אין לה שקופיות מוגדרות.</p>
      </div>
    );
  }

  const slide = kiosk.slides[currentSlideIndex];
  if (!slide) return null;

  return (
    <div ref={containerRef} className="h-screen w-screen bg-black relative overflow-hidden group cursor-none">
      {/* Content */}
      <div className="absolute inset-0 w-full h-full">
        <iframe
          key={slide.id} // Re-mount iframe on change to reset state
          src={slide.url}
          className="w-full h-full border-0 animate-in fade-in duration-500"
          title="Kiosk Content"
          sandbox="allow-scripts allow-same-origin allow-forms"
          allow="autoplay"
        />
      </div>

      {/* Info Overlay (Hidden in fullscreen usually, but useful for debugging/status) */}
      {!isFullScreen && (
         <div className="absolute top-4 right-4 bg-slate-900/90 text-white p-6 rounded-2xl backdrop-blur-md z-50 opacity-0 group-hover:opacity-100 transition-all shadow-2xl border border-slate-700 cursor-auto transform translate-y-2 group-hover:translate-y-0">
            <h3 className="font-bold text-lg mb-1">{kiosk.name}</h3>
            <p className="text-xs text-slate-400 mb-4">{kiosk.location}</p>
            <div className="space-y-2 mb-4 bg-slate-800 p-3 rounded-lg text-xs font-mono text-slate-300">
              <div className="flex justify-between">
                  <span>שקופית:</span>
                  <span className="text-white">{currentSlideIndex + 1} / {kiosk.slides.length}</span>
              </div>
              <div className="flex justify-between">
                  <span>זמן:</span>
                  <span className="text-white">{slide.duration}s</span>
              </div>
            </div>
            <button 
              onClick={toggleFullScreen}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm w-full justify-center transition-colors font-medium shadow-lg shadow-blue-900/50"
            >
              <Maximize size={16} /> מסך מלא
            </button>
         </div>
      )}
    </div>
  );
};

export default ClientPlayer;