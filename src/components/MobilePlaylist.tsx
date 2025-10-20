import React, { useRef, useState } from 'react';
import { ChevronLeft, Play, Download, Edit, ListPlus, PlusCircle, Music, Heart } from 'lucide-react';
import { usePlaylists, Playlist } from '../context/PlaylistContext';
import { useSpotify, Track } from '../context/SpotifyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { GradientArt } from './GradientArt';
import { PlaylistCover } from './PlaylistCover';
import { PlaylistSelectionModal } from './PlaylistSelectionModal';
import { DownloadButton } from './DownloadButton'; // Import the new button

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } }, };
const itemVariants = { hidden: { x: -20, opacity: 0 }, visible: { x: 0, opacity: 1 }, };

const TrackItem: React.FC<{
  track: Track;
  context: Track[];
  onPlay: (track: Track, context: Track[]) => void;
  onAddToQueue: (track: Track) => void;
  onAddToPlaylist: (track: Track) => void;
}> = ({ track, context, onPlay, onAddToQueue, onAddToPlaylist }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div layout className="bg-secondary/30 rounded-lg overflow-hidden transition-colors" variants={itemVariants}>
      <div onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-4 p-2 cursor-pointer">
        {track.imageUrl ? (
            <img src={track.imageUrl} alt={track.name} className="w-12 h-12 rounded-md object-cover bg-gray-800" />
        ) : (
            <GradientArt id={track.spotifyId} className="w-12 h-12 rounded-md flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary truncate">{track.name}</h3>
          <p className="text-sm text-text-secondary truncate">{track.artist}</p>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex justify-evenly items-center py-2 border-t border-secondary/50"
          >
            <button onClick={() => onPlay(track, context)} title="Play" className="p-2 rounded-full text-text-secondary hover:text-accent transition-colors"><Play size={22} /></button>
            <button onClick={() => onAddToQueue(track)} title="Add to queue" className="p-2 rounded-full text-text-secondary hover:text-accent transition-colors"><ListPlus size={22} /></button>
            <button onClick={() => onAddToPlaylist(track)} title="Add to playlist" className="p-2 rounded-full text-text-secondary hover:text-accent transition-colors"><PlusCircle size={22} /></button>
            {/* Replace old logic with the new component */}
            <DownloadButton track={track} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};


interface MobilePlaylistProps {
  playlistId: string;
  onBack: () => void;
}

export const MobilePlaylist: React.FC<MobilePlaylistProps> = ({ playlistId, onBack }) => {
  const { getPlaylistById, updatePlaylistImage } = usePlaylists();
  const { playTrack, likedTracks, addToQueue } = useSpotify();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modalTrack, setModalTrack] = useState<Track | null>(null);

  if (playlistId === 'downloads') {
      return (
          <div className="pb-4 min-h-full">
              <div className="px-4 mb-6">
                <button onClick={onBack} className="p-2 rounded-full bg-secondary/50 hover:bg-secondary flex-shrink-0">
                  <ChevronLeft size={24} className="text-text-primary" />
                </button>
              </div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 text-text-secondary px-4 flex flex-col items-center"
              >
                  <div className="w-24 h-24 bg-gradient-to-br from-accent to-accent-secondary rounded-lg flex items-center justify-center mb-6">
                    <Download size={48} className="text-primary" />
                  </div>
                  <h2 className="font-semibold text-xl text-text-primary">Server Downloads</h2>
                  <p className="text-sm mt-2 max-w-xs">
                    This is a system view showing music stored on the server. It cannot be viewed directly.
                  </p>
              </motion.div>
          </div>
      );
  }

  let playlist: Playlist | undefined;
  let tracks: Track[];
  let isReadOnly = false;

  if (playlistId === 'liked-songs') {
    tracks = likedTracks;
    isReadOnly = true;
    playlist = { _id: 'liked-songs', name: "Liked Songs", description: `${tracks.length} songs`, tracks };
  } else {
    playlist = getPlaylistById(playlistId);
    tracks = playlist?.tracks || [];
  }
  
  const handleImageChange = () => {
    if (isReadOnly) return;
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && playlist && !isReadOnly) {
        updatePlaylistImage(playlist._id, file);
    }
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
        playTrack(tracks[0], tracks);
    }
  };

  if (!playlist) {
    return (
      <div className="px-4 text-center text-text-secondary">
        <p>Loading playlist...</p>
      </div>
    );
  }

  return (
    <div className="pb-4 min-h-full">
      {modalTrack && <PlaylistSelectionModal track={modalTrack} onClose={() => setModalTrack(null)} />}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/png, image/jpeg"
        className="hidden"
      />
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 mb-6 flex items-start gap-4"
      >
        <button onClick={onBack} className="mt-1 p-2 rounded-full bg-secondary/50 hover:bg-secondary flex-shrink-0">
          <ChevronLeft size={24} className="text-text-primary" />
        </button>
        <div className="relative w-24 h-24 flex-shrink-0 group">
            <PlaylistCover playlist={playlist} className="w-full h-full shadow-lg"/>
            {!isReadOnly && (
                <button onClick={handleImageChange} className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit size={28} />
                </button>
            )}
        </div>
        <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-2xl font-bold truncate">{playlist.name}</h1>
            <p className="text-sm text-text-secondary truncate">{tracks.length} songs</p>
        </div>
      </motion.div>

      <div className="px-4 mb-8">
        <button onClick={handlePlayAll} className="w-14 h-14 bg-accent text-primary rounded-full flex items-center justify-center shadow-lg shadow-accent/30 hover:scale-105 transition-transform">
          <Play size={28} fill="currentColor" className="ml-1" />
        </button>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-4 space-y-2"
      >
        {tracks.length > 0 ? (
          tracks
            .filter(track => track && track.spotifyId && track.name)
            .map((track) => (
              <TrackItem
                key={track.spotifyId}
                track={track}
                context={tracks}
                onPlay={playTrack}
                onAddToQueue={addToQueue}
                onAddToPlaylist={setModalTrack}
              />
            ))
        ) : (
          <motion.div initial={{ opacity: 0}} animate={{ opacity: 1, transition: { delay: 0.2 }}} className="text-center py-16 text-text-secondary">
              {playlistId === 'liked-songs' ? <Heart size={48} className="mx-auto mb-4"/> : <Music size={48} className="mx-auto mb-4"/>}
              <p className="font-semibold">{playlistId === 'liked-songs' ? 'Songs you like will appear here.' : 'This playlist is empty.'}</p>
              <p className="text-sm">{playlistId === 'liked-songs' ? 'Save songs by tapping the heart icon.' : 'Use the search to find and add songs.'}</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
