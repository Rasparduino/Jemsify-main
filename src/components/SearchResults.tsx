import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useSpotify } from '../context/SpotifyContext';

export const SearchResults: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { searchResults, searchTracks } = useSpotify();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchTracks(searchQuery);
    }
  };

  return (
    <div className="p-8 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto">
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What do you want to listen to?"
              className="w-full pl-10 pr-4 py-3 bg-gray-800 text-white rounded-full border-none outline-none focus:ring-2 focus:ring-white"
            />
          </div>
        </form>

        {searchResults.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Search Results</h2>
            <div className="space-y-2">
              {searchResults.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center gap-4 p-3 hover:bg-gray-800 rounded-lg cursor-pointer group"
                >
                  <div className="w-8 text-gray-400 text-sm">
                    {index + 1}
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{track.name}</h3>
                    <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {Math.floor((track.duration || 180) / 60)}:{((track.duration || 180) % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchQuery && searchResults.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No results found for "{searchQuery}"</p>
          </div>
        )}

        {!searchQuery && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Search for music</h2>
            <p className="text-gray-400">Find your favorite songs, artists, and playlists</p>
          </div>
        )}
      </div>
    </div>
  );
};