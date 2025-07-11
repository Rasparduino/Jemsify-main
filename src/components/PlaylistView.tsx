import React from 'react';
import { Play, MoreHorizontal, Clock } from 'lucide-react';
import { useSpotify } from '../context/SpotifyContext';

interface PlaylistViewProps {
  playlistId: string;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({ playlistId }) => {
  const { playlists, playTrack } = useSpotify();
  const playlist = playlists.find(p => p.id === playlistId);

  if (!playlist) {
    return (
      <div className="p-8 bg-gradient-to-b from-gray-900 to-black">
        <p className="text-gray-400">Playlist not found</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-900 to-black">
      {/* Playlist Header */}
      <div className="p-8 bg-gradient-to-b from-green-500/20 to-transparent">
        <div className="flex items-end gap-6">
          <div className="w-60 h-60 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-2xl"></div>
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-wide mb-2">Playlist</p>
            <h1 className="text-5xl font-bold mb-4">{playlist.name}</h1>
            <p className="text-gray-300 mb-4">{playlist.description}</p>
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <span className="font-semibold text-white">Spotify Clone</span>
              <span>•</span>
              <span>{playlist.tracks.length} songs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Playlist Controls */}
      <div className="px-8 py-6 flex items-center gap-6">
        <button className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-400 transition-colors">
          <Play size={24} fill="currentColor" />
        </button>
        <button className="text-gray-400 hover:text-white transition-colors">
          <MoreHorizontal size={24} />
        </button>
      </div>

      {/* Track List */}
      <div className="px-8 pb-8">
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm text-gray-400 border-b border-gray-800 mb-4">
          <div className="col-span-1">#</div>
          <div className="col-span-6">Title</div>
          <div className="col-span-3">Album</div>
          <div className="col-span-2 flex justify-end">
            <Clock size={16} />
          </div>
        </div>

        <div className="space-y-1">
          {playlist.tracks.map((track, index) => (
            <div
              key={track.id}
              onClick={() => playTrack(track)}
              className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-800 rounded-lg cursor-pointer group"
            >
              <div className="col-span-1 flex items-center">
                <span className="text-gray-400 text-sm group-hover:hidden">
                  {index + 1}
                </span>
                <Play size={16} className="hidden group-hover:block" />
              </div>
              <div className="col-span-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded"></div>
                <div>
                  <p className="font-semibold text-sm">{track.name}</p>
                  <p className="text-xs text-gray-400">{track.artist}</p>
                </div>
              </div>
              <div className="col-span-3 flex items-center">
                <p className="text-sm text-gray-400">{track.album}</p>
              </div>
              <div className="col-span-2 flex items-center justify-end">
                <span className="text-sm text-gray-400">
                  {Math.floor((track.duration || 180) / 60)}:{((track.duration || 180) % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};