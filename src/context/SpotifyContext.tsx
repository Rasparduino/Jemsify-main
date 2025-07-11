import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useServer } from './ServerContext';

export interface Track {
  spotifyId: string;
  name: string;
  artist: string;
  albumName: string;
  duration_ms: number;
  preview_url: string | null;
  imageUrl: string | null;
}

export interface Artist {
    spotifyId: string;
    name: string;
    imageUrl: string | null;
    popularity: number;
}

interface SpotifyContextType {
  audioRef: React.RefObject<HTMLAudioElement>;
  currentTrack: Track | null;
  isPlaying: boolean;
  playQueue: Track[];
  searchResults: Track[];
  searchArtists: Artist[];
  likedTracks: Track[];
  isLiked: (spotifyId: string) => boolean;
  playTrack: (track: Track, context?: Track[]) => void;
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
  const [playQueue, setPlayQueue] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchArtists, setSearchArtists] = useState<Artist[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');
  const [volume, setVolume] = useState(() => {
      const savedVolume = localStorage.getItem('player-volume');
      return savedVolume ? parseFloat(savedVolume) : 1;
  });
  
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3099';
  const preDownloadTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateNowPlayingStatus = useCallback(async (track: Track | null) => {
    if (!token) return;
    try {
        await fetch(`${API_URL}/api/user/now-playing`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ track }),
        });
    } catch (error) {
        console.error("Failed to update now playing status:", error);
    }
  }, [token, API_URL]);

  useEffect(() => {
    const fetchLikedTracks = async () => {
        if (!token) {
            setLikedTracks([]);
            return;
        }
        try {
            const res = await fetch(`${API_URL}/api/auth/liked-songs`, {
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
  }, [token, API_URL]);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = volume;
    }
    localStorage.setItem('player-volume', volume.toString());
  }, [volume, audioRef]);

  const nextTrack = useCallback(() => {
    if (playQueue.length === 0) return;

    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      setIsPlaying(true);
      return;
    }

    let nextIndex = isShuffled 
        ? Math.floor(Math.random() * playQueue.length)
        : currentTrackIndex + 1;

    if (nextIndex >= playQueue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    setCurrentTrackIndex(nextIndex);
    setCurrentTrack(playQueue[nextIndex]);
    setIsPlaying(true);
  }, [playQueue, currentTrackIndex, isShuffled, repeatMode, audioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
        setIsPlaying(true);
        if (currentTrack) updateNowPlayingStatus(currentTrack);
    };
    const handlePause = () => {
        // This check is important. We don't want to set isPlaying to false
        // if the song just ended, because nextTrack() will handle the state.
        if (audio.ended) return;
        setIsPlaying(false);
        updateNowPlayingStatus(null);
    };

    const handleEnded = () => {
        nextTrack();
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioRef, currentTrack, updateNowPlayingStatus, nextTrack]);

  const isLiked = useCallback((spotifyId: string) => likedTracks.some(t => t.spotifyId === spotifyId), [likedTracks]);

  const toggleLike = useCallback(async (track: Track) => {
    if (!token) return;

    try {
      const wasLiked = isLiked(track.spotifyId);
      setLikedTracks(prev => wasLiked ? prev.filter(t => t.spotifyId !== track.spotifyId) : [track, ...prev]);

      const method = wasLiked ? 'DELETE' : 'POST';
      const url = wasLiked
          ? `${API_URL}/api/auth/liked-songs/${track.spotifyId}`
          : `${API_URL}/api/auth/liked-songs`;
      
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
  }, [token, isLiked, API_URL]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src || audio.src === window.location.href) {
        setIsPlaying(false);
        return;
    }
    if (audio.paused) {
        audio.play().catch(e => console.error("Play error:", e));
    } else {
        audio.pause();
    }
  }, [audioRef]);
  
  const playTrack = useCallback((track: Track, context: Track[] = []) => {
    addRecentlyPlayed(track);

    if (currentTrack?.spotifyId === track.spotifyId) {
        togglePlayPause();
        return;
    }
    
    setIsPlaying(true);
    setCurrentTrack(track);

    const contextWithTrack = isShuffled ? [...context].sort(() => Math.random() - 0.5) : (context.length > 0 ? context : [track]);
    const trackIndex = contextWithTrack.findIndex(t => t.spotifyId === track.spotifyId);
    setPlayQueue(contextWithTrack);
    setCurrentTrackIndex(trackIndex > -1 ? trackIndex : 0);
  }, [currentTrack?.spotifyId, addRecentlyPlayed, togglePlayPause, isShuffled]);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!currentTrack || !audio) return;

    if (!isPlaying) {
      audio.pause();
      return;
    }

    const downloaded = downloadedTracks.find(d => d.spotifyId === currentTrack.spotifyId);

    if (downloaded) {
      const sourceUrl = streamTrack(downloaded.downloadId);
      if (audio.src !== sourceUrl) {
        audio.src = sourceUrl;
      }
      audio.play().catch(e => console.error("Play error:", e));
    } else {
      audio.pause();
      audio.src = '';
      if (!isDownloading(currentTrack.spotifyId) && currentTrack.artist !== 'YouTube Search') {
        const trackForDownload = { id: currentTrack.spotifyId, name: currentTrack.name, artist: currentTrack.artist, imageUrl: currentTrack.imageUrl };
        downloadTrack(trackForDownload);
      }
    }
  }, [currentTrack, downloadedTracks, isPlaying, isDownloading, streamTrack, downloadTrack]);
  
  useEffect(() => {
    if (preDownloadTimerRef.current) {
        clearTimeout(preDownloadTimerRef.current);
    }

    if (!isPlaying || playQueue.length < 2) {
        return;
    }

    preDownloadTimerRef.current = setTimeout(() => {
        const nextIndex = (currentTrackIndex + 1) % playQueue.length;
        if (nextIndex === 0 && repeatMode !== 'all') return;
        
        const nextTrackToPreload = playQueue[nextIndex];
        if (!nextTrackToPreload) return;

        const isAlreadyDownloaded = downloadedTracks.some(t => t.spotifyId === nextTrackToPreload.spotifyId);
        const isCurrentlyDownloading = isDownloading(nextTrackToPreload.spotifyId);
        const isYouTubeSearch = nextTrackToPreload.artist === 'YouTube Search';

        if (!isAlreadyDownloaded && !isCurrentlyDownloading && !isYouTubeSearch) {
            downloadTrack({
                id: nextTrackToPreload.spotifyId,
                name: nextTrackToPreload.name,
                artist: nextTrackToPreload.artist,
                imageUrl: nextTrackToPreload.imageUrl,
            });
        }
    }, 20000);

    return () => {
        if (preDownloadTimerRef.current) {
            clearTimeout(preDownloadTimerRef.current);
        }
    };
  }, [currentTrackIndex, playQueue, isPlaying, downloadedTracks, isDownloading, downloadTrack, repeatMode]);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const toggleShuffle = useCallback(() => setIsShuffled(prev => !prev), []);

  const previousTrack = useCallback(() => {
    if (playQueue.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
        audioRef.current.currentTime = 0;
        return;
    }
    const prevIndex = isShuffled ? Math.floor(Math.random() * playQueue.length) : (currentTrackIndex - 1 + playQueue.length) % playQueue.length;
    setCurrentTrackIndex(prevIndex);
    setCurrentTrack(playQueue[prevIndex]);
  }, [playQueue, currentTrackIndex, isShuffled, audioRef]);

  const searchTracks = useCallback(async (query: string) => {
    if (!token || !query.trim()) {
      setSearchResults([]);
      setSearchArtists([]);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/spotify/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed on server');
      const data = await response.json();

      if (data) {
        setSearchResults(data.tracks || []);
        setSearchArtists(data.artists || []);
      } else {
        setSearchResults([]);
        setSearchArtists([]);
      }

    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
      setSearchArtists([]);
    }
  }, [token, API_URL]);

  return (
    <SpotifyContext.Provider
      value={{
        audioRef,
        currentTrack,
        isPlaying,
        playQueue,
        recentlyPlayed,
        searchResults,
        searchArtists,
        likedTracks,
        isLiked,
        playTrack,
        togglePlayPause,
        nextTrack,
        previousTrack,
        searchTracks,
        toggleLike,
        volume,
        setVolume,
        isShuffled,
        toggleShuffle,
        repeatMode,
        cycleRepeatMode
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
};