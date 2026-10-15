import { useState, useEffect } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import { API_URL } from '../config';
import { apiGet } from '../services/api';
import toast from 'react-hot-toast';

interface Screenshot {
  Filename: string;
  Date: string;
  Timestamp: string;
  Size: number;
  IsAlert: boolean;
  Url: string;
  ThumbnailUrl?: string;
}

export default function ScreenCaptureTimeline({ agentId }: { agentId: string }) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const fetchScreenshots = async () => {
    try {
      const res = await apiGet<Screenshot[]>(`${API_URL}/screenshots/list/${agentId}?limit=100`);
      // Sort oldest to newest for chronological playback
      const sorted = res.sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime());
      setScreenshots(sorted);
      setCurrentIndex(sorted.length > 0 ? sorted.length - 1 : 0);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load screen capture timeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreenshots();
  }, [agentId]);

  useEffect(() => {
    let interval: number;
    if (isPlaying && screenshots.length > 0) {
      interval = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= screenshots.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500); // 1.5 seconds per frame
    }
    return () => clearInterval(interval);
  }, [isPlaying, screenshots.length]);

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading DVR Timeline...</div>;
  }

  if (screenshots.length === 0) {
    return <div className="p-8 text-center text-gray-400">No screen captures found for this agent.</div>;
  }

  const currentScreenshot = screenshots[currentIndex];

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
      <div className="bg-black flex-1 relative flex items-center justify-center min-h-0">
        <img 
          src={API_URL.replace('/api', '') + currentScreenshot.Url} 
          alt="Screen Capture" 
          className="max-w-full max-h-full object-contain"
        />
        {currentScreenshot.IsAlert && (
          <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full font-bold animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.7)]">
            OCR ALERT TRIGGERED
          </div>
        )}
        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-md font-mono text-sm border border-gray-700">
          <Clock size={14} className="inline mr-2 text-blue-400" />
          {new Date(currentScreenshot.Timestamp).toLocaleString()}
        </div>
      </div>

      <div className="bg-gray-950 border-t border-gray-800 p-4">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-3 rounded-full flex items-center justify-center transition-colors ${isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}
          >
            {isPlaying ? <Square size={16} className="text-white fill-current" /> : <Play size={16} className="text-white fill-current ml-1" />}
          </button>

          <div className="flex-1">
            <input 
              type="range" 
              min={0} 
              max={screenshots.length - 1} 
              value={currentIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentIndex(Number(e.target.value));
              }}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
          <div className="text-sm font-mono text-gray-400 min-w-[80px] text-right">
            {currentIndex + 1} / {screenshots.length}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {screenshots.map((s, idx) => (
            <div 
              key={idx}
              onClick={() => {
                setIsPlaying(false);
                setCurrentIndex(idx);
              }}
              className={`flex-shrink-0 cursor-pointer border-2 transition-all rounded overflow-hidden h-16 w-24 relative ${idx === currentIndex ? 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
            >
              <img 
                src={s.ThumbnailUrl ? API_URL.replace('/api', '') + s.ThumbnailUrl : API_URL.replace('/api', '') + s.Url} 
                className="w-full h-full object-cover" 
                alt="thumbnail" 
              />
              {s.IsAlert && <div className="absolute top-0 right-0 w-3 h-3 bg-red-600 rounded-bl-full" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
