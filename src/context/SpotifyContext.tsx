import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useServer } from './ServerContext';
import { useNtpSync } from '../hooks/useNtpSync';

const API_URL_HTTP = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3099';
const API_URL_WS = API_URL_HTTP.replace(/^http/, 'ws');

export interface Track {
  spotifyId: string;
  name: string;
  artist: string;
  albumName: string;
  duration_ms: number;
  preview_url: string | null;
  imageUrl: string | null;
  downloadId?: string | null;
}

export interface Artist {
    spotifyId: string;
    name: string;
    imageUrl: string | null;
    popularity: number;
}

export interface PlayerState extends Track {
    isPlaying: boolean;
    currentTime: number;
}

interface SpotifyContextType {
  audioRef: React.RefObject<HTMLAudioElement>;
  currentTrack: Track | null;
  currentTrackIndex: number; 
  isPlaying: boolean;
  contextQueue: Track[];
  userQueue: Track[];
  searchResults: Track[];
  searchArtists: Artist[];
  likedTracks: Track[];
  isLiked: (spotifyId: string) => boolean;
  playTrack: (track: Track, context?: Track[]) => void;
  addToQueue: (track: Track) => void; 
  jumpToTrackInQueue: (index: number) => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  searchTracks: (query: string) => Promise<void>;
  toggleLike: (track: Track) => void;
  recentlyPlayed: Track[];
  volume: number;
  setVolume: (volume: number) => void;
  isShuffled: boolean;
  toggleShuffle: () => void;
  repeatMode: 'off' | 'one' | 'all';
  cycleRepeatMode: () => void;
  listeningAlongTo: string | null;
  listenAlong: (friendId: string) => void;
  seek: (time: number) => void;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (!context) throw new Error('useSpotify must be used within a SpotifyProvider');
  return context;
};

export const SpotifyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { downloadTrack, isDownloading, downloadedTracks, streamTrack } = useServer();
  const { token, recentlyPlayed, addRecentlyPlayed } = useAuth();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [contextQueue, setContextQueue] = useState<Track[]>([]);
  const [userQueue, setUserQueue] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchArtists, setSearchArtists] = useState<Artist[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');
  const [volume, setVolume] = useState(1);
  const [listeningAlongTo, setListeningAlongTo] = useState<string | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const { estimatedOffset, startSync } = useNtpSync(ws);
  const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const estimatedOffsetRef = useRef(estimatedOffset);
  useEffect(() => {
    estimatedOffsetRef.current = estimatedOffset;
  }, [estimatedOffset]);

  const executeScheduledAction = useCallback((action: any) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const { type, track, trackTimeSeconds } = action;
    
    setCurrentTrack(track);

    const sourceUrl = track.downloadId ? streamTrack(track.downloadId) : '';
    if (!sourceUrl) {
      setIsPlaying(false);
      return;
    }
    
    const applyAction = () => {
      if (type === 'PLAY') {
        audio.currentTime = trackTimeSeconds;
        audio.play().catch(e => console.error("Scheduled play failed:", e));
        setIsPlaying(true);
      } else if (type === 'PAUSE') {
        audio.pause();
        audio.currentTime = trackTimeSeconds;
        setIsPlaying(false);
      }
    };

    if (audio.src !== sourceUrl) {
      audio.src = sourceUrl;
      audio.load();
      audio.addEventListener('canplaythrough', applyAction, { once: true });
    } else {
      applyAction();
    }
  }, [streamTrack]);

  useEffect(() => {
    if (!token) return;

    ws.current = new WebSocket(API_URL_WS);
    ws.current.onopen = () => {
      console.log('[WebSocket] Connected to server.');
      ws.current?.send(JSON.stringify({ type: 'authenticate', token }));
    };

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === 'SCHEDULED_ACTION') {
        const { action, serverTimeToExecute } = data;
        const localCurrentTime = performance.timeOrigin + performance.now();
        const localExecutionTime = serverTimeToExecute - estimatedOffsetRef.current;
        const waitTime = localExecutionTime - localCurrentTime;

        if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);

        if (waitTime > 0) {
          actionTimeoutRef.current = setTimeout(() => executeScheduledAction(action), waitTime);
        } else {
          executeScheduledAction(action);
        }
      }
    };
    
    ws.current.addEventListener('message', handleMessage);
    ws.current.onclose = () => console.log('[WebSocket] Disconnected from server.');
    
    return () => {
      ws.current?.removeEventListener('message', handleMessage);
      ws.current?.close();
      if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
    };
  }, [token, executeScheduledAction]);

  const broadcastAction = useCallback((type: 'PLAY' | 'PAUSE') => {
    const audio = audioRef.current;
    if (ws.current?.readyState === WebSocket.OPEN && currentTrack && audio && !listeningAlongTo) {
        ws.current.send(JSON.stringify({
            type: 'BROADCAST_ACTION',
            payload: {
                type,
                track: currentTrack,
                trackTimeSeconds: audio.currentTime
            }
        }));
    }
  }, [currentTrack, listeningAlongTo]);
  
  const stopListeningAlong = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'STOP_LISTENING' }));
    }
    if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
    setListeningAlongTo(null);
  }, []);
  
  const playTrack = useCallback((track: Track, context: Track[] = []) => {
    stopListeningAlong();
    addRecentlyPlayed(track);

    const downloadedVersion = downloadedTracks.find(d => d.spotifyId === track.spotifyId);
    const trackToPlay = downloadedVersion ? { ...track, downloadId: downloadedVersion.downloadId } : track;

    if (currentTrack?.spotifyId === track.spotifyId) {
      setIsPlaying(p => {
        const newState = !p;
        // Broadcast is now handled by the unified playback useEffect
        return newState;
      });
      return;
    }

    setUserQueue([]); 
    const contextWithTrack = isShuffled ? [...context].sort(() => Math.random() - 0.5) : (context.length > 0 ? context : [trackToPlay]);
    const trackIndex = contextWithTrack.findIndex(t => t.spotifyId === trackToPlay.spotifyId);
    setContextQueue(contextWithTrack);
    setCurrentTrackIndex(trackIndex > -1 ? trackIndex : 0);
    setCurrentTrack(trackToPlay);
    setIsPlaying(true);
  }, [stopListeningAlong, addRecentlyPlayed, currentTrack?.spotifyId, isShuffled, downloadedTracks]);

  const togglePlayPause = useCallback(() => {
    if (listeningAlongTo) {
      stopListeningAlong();
    } else {
      setIsPlaying(prev => !prev);
    }
  }, [listeningAlongTo, stopListeningAlong]);
  
  const listenAlong = async (friendId: string) => {
    if (ws.current?.readyState !== WebSocket.OPEN) {
        console.error("Cannot listen along: WebSocket is not open.");
        return;
    }
    stopListeningAlong();
    console.log("Starting NTP sync to listen along...");
    await startSync();
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'START_LISTENING', targetUserId: friendId }));
      setListeningAlongTo(friendId);
    }
  };
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack || listeningAlongTo) return;
    
    const downloaded = downloadedTracks.find(d => d.spotifyId === currentTrack.spotifyId);
    const sourceUrl = downloaded ? streamTrack(downloaded.downloadId) : '';

    if (!sourceUrl) {
        if(isPlaying && !isDownloading(currentTrack.spotifyId)) {
            downloadTrack({
                id: currentTrack.spotifyId, name: currentTrack.name, artist: currentTrack.artist,
                imageUrl: currentTrack.imageUrl, duration_ms: currentTrack.duration_ms
            });
        }
        return; // Wait for download
    }

    const syncPlayState = () => {
      if (isPlaying) {
        audio.play().catch(e => console.error("Local play failed", e));
      } else {
        audio.pause();
      }
    };

    if (audio.src !== sourceUrl) {
      audio.src = sourceUrl;
      audio.load();
      audio.addEventListener('canplay', syncPlayState, { once: true });
    } else {
      syncPlayState();
    }
    
    broadcastAction(isPlaying ? 'PLAY' : 'PAUSE');

  }, [isPlaying, currentTrack, listeningAlongTo, downloadedTracks]);

  const seek = (time: number) => {
      stopListeningAlong();
      if(audioRef.current) {
        audioRef.current.currentTime = time;
      }
      broadcastAction('PLAY');
  };

  const nextTrack = useCallback(() => {
    if (listeningAlongTo) return;
    if (userQueue.length > 0) {
        const nextInUserQueue = userQueue[0];
        playTrack(nextInUserQueue, contextQueue);
        setUserQueue(prev => prev.slice(1));
        return;
    }
    if (contextQueue.length === 0) return;
    if (repeatMode === 'one' && currentTrack) {
      playTrack(currentTrack, contextQueue);
      return;
    }
    let nextIndex = isShuffled 
        ? Math.floor(Math.random() * contextQueue.length)
        : currentTrackIndex + 1;
    if (nextIndex >= contextQueue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        broadcastAction('PAUSE');
        return;
      }
    }
    playTrack(contextQueue[nextIndex], contextQueue);
  }, [listeningAlongTo, userQueue, contextQueue, currentTrackIndex, isShuffled, repeatMode, playTrack, currentTrack, broadcastAction]);
  
  const previousTrack = useCallback(() => {
    if (listeningAlongTo) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
        seek(0);
        return;
    }
    const prevIndex = (currentTrackIndex - 1 + contextQueue.length) % contextQueue.length;
    playTrack(contextQueue[prevIndex], contextQueue);
  }, [listeningAlongTo, contextQueue, currentTrackIndex, playTrack, seek]);

  const addToQueue = useCallback((track: Track) => {
    setUserQueue(prevQueue => {
        if (prevQueue.some(t => t.spotifyId === track.spotifyId) || currentTrack?.spotifyId === track.spotifyId) return prevQueue;
        return [...prevQueue, track];
    });
    if (!currentTrack) playTrack(track);
  }, [currentTrack, playTrack]);

  const jumpToTrackInQueue = useCallback((globalIndex: number) => {
    const upNextCombined = [...userQueue, ...contextQueue.slice(currentTrackIndex + 1)];
    if (globalIndex < 0 || globalIndex >= upNextCombined.length) return;
    const targetTrack = upNextCombined[globalIndex];
    if (globalIndex < userQueue.length) {
        setUserQueue(prev => prev.slice(globalIndex + 1));
    } else {
        const contextIndexInCombined = globalIndex - userQueue.length;
        const newContextIndex = currentTrackIndex + 1 + contextIndexInCombined;
        setCurrentTrackIndex(newContextIndex);
        setUserQueue([]);
    }
    playTrack(targetTrack, contextQueue);
  }, [userQueue, contextQueue, currentTrackIndex, playTrack]);

  const isLiked = useCallback((spotifyId: string) => likedTracks.some(t => t.spotifyId === spotifyId), [likedTracks]);

  const toggleLike = useCallback(async (track: Track) => {
    if (!token) return;
    try {
      const wasLiked = isLiked(track.spotifyId);
      setLikedTracks(prev => wasLiked ? prev.filter(t => t.spotifyId !== track.spotifyId) : [track, ...prev]);
      const method = wasLiked ? 'DELETE' : 'POST';
      const url = wasLiked ? `${API_URL_HTTP}/api/auth/liked-songs/${track.spotifyId}` : `${API_URL_HTTP}/api/auth/liked-songs`;
      const options: RequestInit = {
          method,
          headers: { Authorization: `Bearer ${token}` },
      };
      if (!wasLiked) {
          options.headers['Content-Type'] = 'application/json';
          options.body = JSON.stringify(track);
      }
      const res = await fetch(url, options);
      if (!res.ok) throw new Error('Failed to sync liked status with server');
      const updatedLikedTracks = await res.json();
      setLikedTracks(updatedLikedTracks);
    } catch (error) {
      console.error('Failed to toggle like on server:', error);
    }
  }, [token, isLiked]);

  const searchTracks = useCallback(async (query: string) => {
    if (!token || !query.trim()) {
      setSearchResults([]);
      setSearchArtists([]);
      return;
    }
    try {
      const response = await fetch(`${API_URL_HTTP}/api/spotify/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed on server');
      const data = await response.json();
      setSearchResults(data.tracks || []);
      setSearchArtists(data.artists || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
      setSearchArtists([]);
    }
  }, [token]);

  const cycleRepeatMode = useCallback(() => setRepeatMode(prev => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off')), []);
  const toggleShuffle = useCallback(() => setIsShuffled(prev => !prev), []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    localStorage.setItem('player-volume', volume.toString());
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => nextTrack();
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [nextTrack]);

  useEffect(() => {
    const fetchLikedTracks = async () => {
        if (!token) {
            setLikedTracks([]);
            return;
        }
        try {
            const res = await fetch(`${API_URL_HTTP}/api/auth/liked-songs`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setLikedTracks(data);
            }
        } catch (error) {
            console.error("Failed to fetch liked tracks:", error);
        }
    };
    fetchLikedTracks();
  }, [token]);

  return (
    <SpotifyContext.Provider
      value={{
        audioRef, currentTrack, isPlaying, contextQueue, userQueue, recentlyPlayed,
        searchResults, searchArtists, likedTracks, isLiked, playTrack,
        togglePlayPause, nextTrack, previousTrack, searchTracks, toggleLike,
        volume, setVolume, isShuffled, toggleShuffle, repeatMode, cycleRepeatMode,
        currentTrackIndex, addToQueue, jumpToTrackInQueue,
        listeningAlongTo, listenAlong, seek
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
};
