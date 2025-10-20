import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './NetworkStatusContext';
import { fetchWithRetry } from '../utils/fetchWithRetry';

interface Track {
  spotifyId: string;
  name: string;
  artist: string;
  albumName: string;
  imageUrl: string;
  duration_ms: number;
}

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  error: string | null;
  recentlyPlayed: Track[];
  login: (email, password) => Promise<void>;
  signup: (email, password) => Promise<void>;
  logout: () => void;
  addRecentlyPlayed: (track: Track) => Promise<void>;
  // --- FIX: Expose the function from the context's type definition ---
  updateNowPlayingStatus: (track: Track | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3099';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [error, setError] = useState<string | null>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const { isOnline } = useNetworkStatus();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setRecentlyPlayed([]);
  }, []);

  const fetchRecentlyPlayed = useCallback(async (authToken: string) => {
    if (!authToken) return;
    try {
      const res = await fetchWithRetry(`${API_URL}/api/auth/recently-played`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecentlyPlayed(data);
      } else {
        if (res.status === 401) logout();
        setRecentlyPlayed([]);
      }
    } catch (err) {
      console.error("Failed to fetch recently played:", err);
      setRecentlyPlayed([]);
    }
  }, [logout]);

  useEffect(() => {
    if (isOnline && token && !user) {
        console.log('[AuthContext] Network is back. Re-validating session...');
        const userString = localStorage.getItem('user');
        if (userString) {
            setUser(JSON.parse(userString));
            fetchRecentlyPlayed(token);
        }
    }
  }, [isOnline, token, user, fetchRecentlyPlayed]);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (userString && storedToken) {
        setUser(JSON.parse(userString));
        setToken(storedToken);
        fetchRecentlyPlayed(storedToken);
    }
  }, [fetchRecentlyPlayed]);

  const handleAuthResponse = async (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setError(null);
    await fetchRecentlyPlayed(data.token);
  };

  const login = async (email, password) => {
    try {
      const res = await fetchWithRetry(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      await handleAuthResponse(data);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const signup = async (email, password) => {
    try {
      const res = await fetchWithRetry(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');
      await handleAuthResponse(data);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const addRecentlyPlayed = async (track: Track) => {
      if (!token) return;
      setRecentlyPlayed(prev => {
          const filtered = prev.filter(t => t.spotifyId !== track.spotifyId);
          return [track, ...filtered].slice(0, 20);
      });
      try {
          await fetchWithRetry(`${API_URL}/api/auth/recently-played`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}` 
              },
              body: JSON.stringify(track),
          });
      } catch (err) {
          console.error("Failed to update recently played on server:", err);
      }
  };

  // --- FIX: Define the function within the AuthProvider ---
  const updateNowPlayingStatus = useCallback(async (track: Track | null) => {
    if (!token) return;

    try {
        await fetchWithRetry(`${API_URL}/api/user/now-playing`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ track }),
        });
    } catch (error) {
        console.error("Failed to update 'now playing' status:", error);
    }
  }, [token]);


  const value = { user, token, isAuthenticated: !!token, error, recentlyPlayed, login, signup, logout, addRecentlyPlayed, updateNowPlayingStatus };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
