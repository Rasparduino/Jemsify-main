import React from 'react';
import { usePlaylists, Track } from '../context/PlaylistContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Music } from 'lucide-react';
import { PlaylistCover } from './PlaylistCover'; // Import the cover component

interface PlaylistSelectionModalProps {
  track: Track;
  onClose: () => void;
}

export const PlaylistSelectionModal: React.FC<PlaylistSelectionModalProps> = ({ track, onClose }) => {
  const { playlists, addTrackToPlaylist, createPlaylist } = usePlaylists();

  const handleCreateAndAdd = async () => {
    const playlistName = prompt('Enter a name for your new playlist:');
    if (playlistName && playlistName.trim()) {
      // The new createPlaylist function handles adding the track automatically
      await createPlaylist(playlistName, track);
    }
    onClose();
  };
  
  const handleSelectPlaylist = (playlistId: string) => {
      addTrackToPlaylist(playlistId, track);
      onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="bg-secondary rounded-xl w-full max-w-sm p-5 shadow-lg flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-xl font-bold text-text-primary">Add to Playlist</h2>
            <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-white/10"><X size={20} /></button>
          </div>
          
          <div className="space-y-2 overflow-y-auto pr-2 -mr-2">
            <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateAndAdd}
                className="w-full flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Plus size={24} className="text-accent" />
                </div>
                <span className="font-semibold text-text-primary">New Playlist</span>
            </motion.button>
            {playlists.map((playlist) => (
              <motion.button
                key={playlist._id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectPlaylist(playlist._id)}
                className="w-full flex items-center gap-4 p-3 hover:bg-white/10 rounded-lg transition-colors text-left"
              >
                <PlaylistCover playlist={playlist} className="w-12 h-12 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-primary truncate">{playlist.name}</h3>
                  <p className="text-xs text-text-secondary truncate">{playlist.tracks.length} songs</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};