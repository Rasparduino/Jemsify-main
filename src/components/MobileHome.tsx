import React, { useState } from 'react';
import { Play, PlusCircle, ListPlus } from 'lucide-react';
import { useSpotify, Track } from '../context/SpotifyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaylistSelectionModal } from './PlaylistSelectionModal';
import { GradientArt } from './GradientArt';
import { DownloadButton } from './DownloadButton'; // Import the new button

const containerVariants = { 
  hidden: { opacity: 0 }, 
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.2 } } 
};
  
const itemVariants = { 
  hidden: { y: 20, opacity: 0 }, 
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } } 
};

// Reusable TrackItem component for this view
const TrackItem: React.FC<{
  track: Track;
  context: Track[];
  onPlay: (track: Track, context: Track[]) => void;
  onAddToQueue: (track: Track) => void;
  onAddToPlaylist: (track: Track) => void;
}> = ({ track, context, onPlay, onAddToQueue, onAddToPlaylist }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div layout className="bg-secondary/50 rounded-lg overflow-hidden transition-colors" variants={itemVariants} whileHover={{ scale: 1.02 }}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-4 p-3 cursor-pointer"
      >
        {track.imageUrl ? (
          <img src={track.imageUrl} alt={track.name} className="w-12 h-12 rounded-md object-cover flex-shrink-0"/>
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


export const MobileHome: React.FC = () => {
  const { recentlyPlayed, playTrack, addToQueue } = useSpotify();
  const [modalTrack, setModalTrack] = useState<Track | null>(null);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };
  
  return (
    <div className="pb-4 min-h-full px-4">
      {modalTrack && <PlaylistSelectionModal track={modalTrack} onClose={() => setModalTrack(null)} />}
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-6"
      >
        <h1 className="text-3xl font-extrabold text-text-primary">{greeting()}</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.2 } }}
      >
        <h2 className="text-xl font-bold mb-4 text-text-primary">Recently Played</h2>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {recentlyPlayed.length > 0 ? (
            recentlyPlayed.map((track) => (
              <TrackItem
                key={track.spotifyId}
                track={track}
                context={recentlyPlayed}
                onPlay={playTrack}
                onAddToQueue={addToQueue}
                onAddToPlaylist={setModalTrack}
              />
            ))
          ) : (
            <p className="text-text-secondary text-center py-8">Your recently played songs will appear here.</p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};
