import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

interface DownloadedTrack {
  downloadId: string;
  spotifyId: string;
  name: string;
  artist: string;
  imageUrl: string;
}

interface ServerContextType {
  downloadedTracks: DownloadedTrack[];
  downloadingSpotifyIds: Set<string>;
  isDownloading: (spotifyId: string) => boolean;
  downloadTrack: (track: any) => Promise<void>;
  streamTrack: (downloadId: string) => string;
  // --- NEW: Add function for direct YouTube search ---
  youtubeSearch: (query: string) => Promise<any>;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);
const API_URL = import.meta.env.VITE_API_BASE_URL; // Use the environment variable

export const useServer = () => {
  const context = useContext(ServerContext);
  if (!context) throw new Error('useServer must be used within a ServerProvider');
  return context;
};

export const ServerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [downloadedTracks, setDownloadedTracks] = useState<DownloadedTrack[]>([]);
  const [downloadingSpotifyIds, setDownloadingSpotifyIds] = useState<Set<string>>(new Set());
  
  const poller = useRef<NodeJS.Timeout | null>(null);

  const fetchInitialCompletedTracks = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch(`${API_URL}/api/download/completed`);
      if (res.ok) {
        const completed = await res.json();
        setDownloadedTracks(completed);
      }
    } catch (error) {
      console.error("Failed to fetch initial downloaded tracks:", error);
    }
  }, [isAuthenticated]);
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchInitialCompletedTracks();
    }
  }, [isAuthenticated, fetchInitialCompletedTracks]);

  useEffect(() => {
    const isPolling = poller.current !== null;

    if (downloadingSpotifyIds.size > 0 && !isPolling) {
      console.log('%c[POLLER] Starting polling for active downloads...', 'color: orange');
      
      poller.current = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/api/download/all`);
          if (!res.ok) {
              // --- FIX: Stop polling if server is unreachable or errors out ---
              console.error(`[POLLER] Failed to fetch statuses: ${res.status}. Stopping polling.`);
              if (poller.current) clearInterval(poller.current);
              poller.current = null;
              return;
          };
          
          const allStatuses = await res.json();
          
          setDownloadingSpotifyIds(currentIds => {
            const nextIds = new Set(currentIds);
            
            allStatuses.forEach(status => {
              if (nextIds.has(status.spotifyId) && (status.status === 'completed' || status.status === 'failed')) {
                console.log(`[POLLER] Download for ${status.name} finished with status: ${status.status}`);
                nextIds.delete(status.spotifyId);

                if (status.status === 'completed') {
                  setDownloadedTracks(prev => {
                    if (prev.some(t => t.spotifyId === status.spotifyId)) return prev;
                    return [...prev, status];
                  });
                }
                
                if (status.status === 'failed') {
                    console.error(`Download failed for ${status.name}: ${status.error}`);
                }
              }
            });
            
            if (nextIds.size === 0 && poller.current) {
              console.log('%c[POLLER] All downloads finished. Stopping polling.', 'color: lightgreen');
              clearInterval(poller.current);
              poller.current = null;
            }
            
            return nextIds;
          });

        } catch (error) {
          console.error('[POLLER] Polling error:', error);
        }
      }, 3000);
    }
    
    return () => {
      if (poller.current) {
        clearInterval(poller.current);
        poller.current = null;
      }
    };
  }, [downloadingSpotifyIds.size]); 

  const downloadTrack = useCallback(async (track: any) => {
    if (downloadingSpotifyIds.has(track.id) || downloadedTracks.some(d => d.spotifyId === track.id)) {
      return;
    }
    
    setDownloadingSpotifyIds(prev => new Set(prev).add(track.id));
    
    try {
      const res = await fetch(`${API_URL}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotifyTrack: track })
      });
      if (!res.ok) {
          throw new Error('Server responded with an error to the download request.');
      }
    } catch (error) {
      console.error('Download request failed:', error);
      setDownloadingSpotifyIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(track.id);
        return newSet;
      });
    }
  }, [downloadedTracks, downloadingSpotifyIds]);
  
  // --- NEW: Function to handle YouTube search ---
  const youtubeSearch = useCallback(async (query: string) => {
    try {
        const res = await fetch(`${API_URL}/api/download/youtube-search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Server responded with an error to the YouTube search request.');
        }
        const data = await res.json();
        setDownloadingSpotifyIds(prev => new Set(prev).add(data.spotifyId));
        return data;
    } catch (error) {
        console.error('YouTube search request failed:', error);
        throw error;
    }
  }, []);

  const streamTrack = (downloadId: string): string => {
    return `${API_URL}/api/stream/${downloadId}`;
  };

  const isDownloading = useCallback((spotifyId: string) => 
    downloadingSpotifyIds.has(spotifyId), 
  [downloadingSpotifyIds]);

  return (
    <ServerContext.Provider value={{ downloadedTracks, downloadingSpotifyIds, isDownloading, downloadTrack, streamTrack, youtubeSearch }}>
      {children}
    </ServerContext.Provider>
  );
};