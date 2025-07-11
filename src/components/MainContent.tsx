import React from 'react';
import { PlaylistCard } from './PlaylistCard';
import { useSpotify } from '../context/SpotifyContext';

export const MainContent: React.FC = () => {
  const { playlists, recentlyPlayed } = useSpotify();

  return (
    <div className="p-8 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Good evening</h1>
        
        {/* Quick Access */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-4 hover:bg-gray-700 transition-colors cursor-pointer">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-2xl">♥</span>
            </div>
            <span className="font-semibold">Liked Songs</span>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-4 hover:bg-gray-700 transition-colors cursor-pointer">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📥</span>
            </div>
            <span className="font-semibold">Downloaded</span>
          </div>
        </div>

        {/* Recently Played */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Recently played</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {recentlyPlayed.map((track) => (
              <div key={track.id} className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <div className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-4"></div>
                <h3 className="font-semibold text-sm mb-1 truncate">{track.name}</h3>
                <p className="text-xs text-gray-400 truncate">{track.artist}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Made For You */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Made for you</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {playlists.slice(0, 5).map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};