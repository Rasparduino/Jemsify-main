import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Track {
  spotifyId: string;
  name: string;
  artist: string;
  albumName: string;
  imageUrl: string | null;
  duration_ms: number;
}

export interface Playlist {
  _id: string;
  name: string;
  description: string;
  tracks: Track[];
  customImageUrl?: string;
}

interface PlaylistContextType {
  playlists: Playlist[];
  loading: boolean;
  createPlaylist: (name: string, trackToAdd?: Track) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, track: Track) => Promise<Playlist | undefined>;
  getPlaylistById: (playlistId: string) => Playlist | undefined;
  updatePlaylistImage: (playlistId: string, imageFile: File) => Promise<void>;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);
const API_URL = import.meta.env.VITE_API_BASE_URL;

export const usePlaylists = () => {
  const context = useContext(PlaylistContext);
  if (!context) throw new Error('usePlaylists must be used within a PlaylistProvider');
  return context;
};

interface PlaylistProviderProps {
  children: React.ReactNode;
  token: string | null;
}

export const PlaylistProvider: React.FC<PlaylistProviderProps> = ({ children, token }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaylists = useCallback(async () => {
    if (!token) {
        setPlaylists([]);
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/playlists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data || []);
      }
    } catch (error) {
      console.error('[PLAYLISTS] Error fetching playlists:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const addTrackToPlaylist = async (playlistId: string, track: Track) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(track),
      });
      if (res.ok) {
        const updatedPlaylist = await res.json();
        setPlaylists(prev => prev.map(p => p._id === playlistId ? updatedPlaylist : p));
        return updatedPlaylist;
      } else {
        const err = await res.json();
        throw new Error(err.message || "Failed to add track");
      }
    } catch (error) {
      alert(`Error adding track: ${error.message}`);
    }
  };

  const createPlaylist = async (name: string, trackToAdd?: Track) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, description: '' }),
      });
      if (res.ok) {
        const newPlaylist = await res.json();
        if (trackToAdd) {
          // Immediately add the track to the new playlist
          const updatedPlaylist = await addTrackToPlaylist(newPlaylist._id, trackToAdd);
          if (updatedPlaylist) {
            setPlaylists(prev => [...prev, updatedPlaylist]);
          }
        } else {
          setPlaylists(prev => [...prev, newPlaylist]);
        }
      } else {
        throw new Error("Failed to create playlist");
      }
    } catch (error) {
      console.error(`Error creating playlist: ${error.message}`);
    }
  };

  const getPlaylistById = (playlistId: string): Playlist | undefined => {
    return playlists.find(p => p._id === playlistId);
  };

  const updatePlaylistImage = async (playlistId: string, imageFile: File) => {
    if (!token) return;
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
        const res = await fetch(`${API_URL}/api/playlists/${playlistId}/image`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });

        if (res.ok) {
            const updatedPlaylist = await res.json();
            setPlaylists(prev => prev.map(p => p._id === playlistId ? updatedPlaylist : p));
        } else {
            throw new Error((await res.json()).message || "Failed to upload image");
        }
    } catch (error) {
        console.error(`Error uploading image: ${error.message}`);
        alert(`Error uploading image: ${error.message}`);
    }
  };

  const value = { playlists, loading, createPlaylist, addTrackToPlaylist, getPlaylistById, updatePlaylistImage };

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
};