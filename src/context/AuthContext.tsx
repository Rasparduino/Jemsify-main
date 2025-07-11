import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Define the track type here to be used by the context
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- THIS IS THE FIX ---
// Add a fallback to localhost if the environment variable is not defined.
// This prevents the 'undefined' error and provides a better developer experience.
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

  // Add a check to warn the developer if the URL is not set.
  useEffect(() => {
    if (!import.meta.env.VITE_API_BASE_URL) {
      console.warn(
        `VITE_API_BASE_URL is not set in your .env file. Falling back to ${API_URL}. ` +
        `This will not work on other devices.`
      );
    }
  }, []);

  const fetchRecentlyPlayed = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/recently-played`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecentlyPlayed(data);
      } else {
        setRecentlyPlayed([]);
      }
    } catch (err) {
      console.error("Failed to fetch recently played:", err);
      setRecentlyPlayed([]);
    }
  }, []);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString && token) {
        setUser(JSON.parse(userString));
        fetchRecentlyPlayed(token);
    }
  }, [token, fetchRecentlyPlayed]);

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
      const res = await fetch(`${API_URL}/api/auth/login`, {
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
      const res = await fetch(`${API_URL}/api/auth/register`, {
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

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setRecentlyPlayed([]);
  };
  
  const addRecentlyPlayed = async (track: Track) => {
      if (!token) return;
      setRecentlyPlayed(prev => {
          const filtered = prev.filter(t => t.spotifyId !== track.spotifyId);
          return [track, ...filtered].slice(0, 20);
      });
      try {
          await fetch(`${API_URL}/api/auth/recently-played`, {
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

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, error, recentlyPlayed, login, signup, logout, addRecentlyPlayed }}>
      {children}
    </AuthContext.Provider>
  );
};