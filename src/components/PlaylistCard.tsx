import React from 'react';
import { Play } from 'lucide-react';
import { useSpotify } from '../context/SpotifyContext';

interface PlaylistCardProps {
  playlist: {
    id: string;
    name: string;
    description: string;
    image?: string;
    tracks: any[];
  };
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist }) => {
  const { playPlaylist } = useSpotify();

  return (
    <div className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer group">
      <div className="relative mb-4">
        <div className="aspect-square bg-gradient-to-br from-green-500 to-blue-500 rounded-lg"></div>
        <button
          onClick={() => playPlaylist(playlist.id)}
          className="absolute bottom-2 right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-400"
        >
          <Play size={20} fill="currentColor" />
        </button>
      </div>
      <h3 className="font-semibold text-sm mb-1 truncate">{playlist.name}</h3>
      <p className="text-xs text-gray-400 line-clamp-2">{playlist.description}</p>
    </div>
  );
};