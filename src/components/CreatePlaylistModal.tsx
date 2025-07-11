import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface CreatePlaylistModalProps {
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({ onClose, onCreate }) => {
  const [playlistName, setPlaylistName] = useState('');

  const handleCreate = () => {
    if (playlistName.trim()) {
      onCreate(playlistName.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
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
          className="bg-secondary rounded-xl w-full max-w-sm p-5 shadow-lg flex flex-col gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-text-primary">Create a Playlist</h2>
            <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-white/10"><X size={20} /></button>
          </div>
          
          <div>
            <label htmlFor="playlistName" className="text-sm font-medium text-text-secondary mb-2 block">
              Playlist Name
            </label>
            <input
              id="playlistName"
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="My Awesome Playlist"
              className="w-full px-4 py-3 bg-primary text-text-primary rounded-lg border-2 border-transparent outline-none focus:ring-2 focus:ring-accent transition-all"
              autoFocus
            />
          </div>

          <div className="flex justify-end items-center gap-3 mt-2">
             <button
                onClick={onClose}
                className="px-4 py-2 rounded-full text-text-secondary hover:bg-white/10 transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={handleCreate}
                disabled={!playlistName.trim()}
                className="px-6 py-2 rounded-full bg-accent text-primary font-bold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-secondary"
            >
                Create
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};