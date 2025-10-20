import React, { useState } from 'react';
import { Heart, Plus, Loader, DownloadCloud } from 'lucide-react';
import { usePlaylists } from '../context/PlaylistContext';
import { useSpotify } from '../context/SpotifyContext';
import { PlaylistCover } from './PlaylistCover';
import { CreatePlaylistModal } from './CreatePlaylistModal';
import { ImportPlaylistModal } from './ImportPlaylistModal';

interface MobileLibraryProps {
  onPlaylistSelect: (playlistId: string) => void;
}

export const MobileLibrary: React.FC<MobileLibraryProps> = ({ onPlaylistSelect }) => {
  const { playlists, loading, createPlaylist, importPlaylist } = usePlaylists();
  const { likedTracks } = useSpotify();
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleCreatePlaylist = () => {
    setIsCreatingPlaylist(true);
  };
  
  const libraryItems = [
    { id: 'liked-songs', name: 'Liked Songs', description: `${likedTracks.length} songs`, icon: Heart },
  ];

  return (
    <div className="pb-4">
      {isCreatingPlaylist && (
        <CreatePlaylistModal 
          onClose={() => setIsCreatingPlaylist(false)} 
          onCreate={name => createPlaylist(name)} 
        />
      )}
      {isImportModalOpen && (
        <ImportPlaylistModal
            onClose={() => setIsImportModalOpen(false)}
            onImport={importPlaylist}
        />
      )}

      <div className="px-4 mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary mb-2">Your Library</h1>
      </div>

      <div className="px-4 mb-8 space-y-3">
        {libraryItems.map((item) => (
          <div 
            key={item.id} 
            onClick={() => onPlaylistSelect(item.id)}
            className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg active:bg-secondary transition-colors cursor-pointer"
          >
            <div className={`w-12 h-12 bg-gradient-to-br from-accent to-accent-secondary rounded-lg flex items-center justify-center`}>
              <item.icon size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary">{item.name}</h3>
              <p className="text-xs text-text-secondary">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="px-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-text-primary">Your Playlists</h2>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsImportModalOpen(true)} className="p-2 rounded-full hover:bg-secondary text-text-secondary hover:text-text-primary" title="Import Playlist">
                <DownloadCloud size={20} />
            </button>
            <button onClick={handleCreatePlaylist} className="p-2 rounded-full hover:bg-secondary text-text-secondary hover:text-text-primary" title="Create Playlist">
                <Plus size={20} />
            </button>
          </div>
        </div>
        
        {loading ? (
            <div className="flex justify-center items-center h-24">
                <Loader className="animate-spin text-text-secondary" />
            </div>
        ) : playlists && playlists.length > 0 ? (
          <div className="space-y-3">
            {playlists.map((playlist) => (
              <div
                key={playlist._id}
                onClick={() => onPlaylistSelect(playlist._id)}
                className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg active:bg-secondary transition-colors cursor-pointer"
              >
                <PlaylistCover playlist={playlist} className="w-12 h-12 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-primary truncate">{playlist.name}</h3>
                  <p className="text-xs text-text-secondary truncate">{playlist.tracks.length} songs</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-secondary text-sm text-center py-4">You haven't created any playlists yet.</p>
        )}
      </div>
    </div>
  );
};
