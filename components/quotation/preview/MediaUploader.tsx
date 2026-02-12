'use client';

import { useState } from 'react';

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'chart';
  url: string;
  title?: string;
  caption?: string;
}

interface MediaUploaderProps {
  media?: MediaItem[];
  onMediaChange: (newMedia: MediaItem[]) => void;
  className?: string;
}

/**
 * MediaUploader - Component to manage images and videos in the quotation
 */
export default function MediaUploader({
  media = [],
  onMediaChange,
  className = '',
}: MediaUploaderProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [isAddingVideo, setIsAddingVideo] = useState(false);

  const handleAddVideo = () => {
    if (!videoUrl) return;
    
    // Simple YouTube ID extraction
    const match = videoUrl.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=))([\w\-]{11})/);
    const videoId = match ? match[1] : null;

    if (videoId) {
      const newItem: MediaItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'video',
        url: `https://www.youtube.com/embed/${videoId}`,
        title: 'Project Video',
      };
      onMediaChange([...media, newItem]);
      setVideoUrl('');
      setIsAddingVideo(false);
    } else {
      alert('Link YouTube không hợp lệ.');
    }
  };

  const handleRemove = (id: string) => {
    onMediaChange(media.filter(m => m.id !== id));
  };

  return (
    <div className={`space-y-4 no-print ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-700">Media Gallery</h4>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAddingVideo(true)}
            className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100"
          >
            + Video
          </button>
          <label className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded border border-green-200 hover:bg-green-100 cursor-pointer">
            + Image
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => {
                // Mock upload for now
                const file = e.target.files?.[0];
                if (file) {
                  const newItem: MediaItem = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'image',
                    url: URL.createObjectURL(file), // Using local URL for preview
                    title: file.name,
                  };
                  onMediaChange([...media, newItem]);
                }
              }}
            />
          </label>
        </div>
      </div>

      {isAddingVideo && (
        <div className="flex gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
          <input 
            type="text" 
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Paste YouTube link..."
            className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded"
          />
          <button onClick={handleAddVideo} className="text-xs px-3 py-1 bg-blue-600 text-white rounded">Add</button>
          <button onClick={() => setIsAddingVideo(false)} className="text-xs px-3 py-1 bg-gray-200 rounded">Cancel</button>
        </div>
      )}

      {media.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {media.map((item) => (
            <div key={item.id} className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
              {item.type === 'image' ? (
                <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-xs">
                  YouTube Video
                </div>
              )}
              <button 
                onClick={() => handleRemove(item.id)}
                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-xs">
          No media added. Use buttons above to add images or videos.
        </div>
      )}
    </div>
  );
}
