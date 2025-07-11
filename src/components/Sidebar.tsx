import React, { useState } from 'react';
import { Home, Search, Library, Plus, Heart, Download } from 'lucide-react';
import { useSpotify } from '../context/SpotifyContext';

interface SidebarProps {
  currentView: 'home' | 'search' | 'playlist' | 'library';
  onViewChange: (view: 'home' | 'search' | 'playlist' | 'library') => void;
  onPlaylistSelect: (playlistId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  onPlaylistSelect 
}) => {
  const { playlists } = useSpotify();
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(true);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
  ];

  return (
    <div className="w-64 bg-black flex flex-col h-full">
      {/* Main Navigation */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-black rounded-full"></div>
          </div>
          <h1 className="text-xl font-bold">Spotify Clone</h1>
        </div>
        
        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as any)}
              className={`w-full flex items-center gap-4 px-3 py-2 rounded-md transition-colors ${
                currentView === item.id 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Library Section */}
      <div className="px-6 flex-1">
        <button
          onClick={() => setIsLibraryExpanded(!isLibraryExpanded)}
          className="w-full flex items-center justify-between py-2 text-gray-400 hover:text-white"
        >
          <div className="flex items-center gap-3">
            <Library size={20} />
            <span className="font-medium">Your Library</span>
          </div>
          <Plus size={16} />
        </button>

        {isLibraryExpanded && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-md bg-gray-900">
              <Heart size={16} className="text-green-500" />
              <span className="text-sm">Liked Songs</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-md bg-gray-900">
              <Download size={16} className="text-blue-500" />
              <span className="text-sm">Downloaded Songs</span>
            </div>
          </div>
        )}

        {/* Playlists */}
        <div className="mt-6 space-y-1">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => {
                onPlaylistSelect(playlist.id);
                onViewChange('playlist');
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white rounded-md hover:bg-gray-800"
            >
              {playlist.name}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-6 border-t border-gray-800">
        <div className="text-xs text-gray-400">
          <p>Legal Notice: This is a demo interface.</p>
          <p>Use Spotify's official app for music.</p>
        </div>
      </div>
    </div>
  );
};