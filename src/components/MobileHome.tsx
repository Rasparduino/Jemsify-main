import React, { useState } from 'react';
import { Play, PlusCircle } from 'lucide-react';
import { useSpotify, Track } from '../context/SpotifyContext';
import { motion } from 'framer-motion';
import { PlaylistSelectionModal } from './PlaylistSelectionModal';
import { GradientArt } from './GradientArt';

export const MobileHome: React.FC = () => {
  const { recentlyPlayed, playTrack } = useSpotify();
  const [modalTrack, setModalTrack] = useState<Track | null>(null);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };
  
  const containerVariants = { 
    hidden: { opacity: 0 }, 
    visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.2 } } 
  };
  
  const itemVariants = { 
    hidden: { y: 20, opacity: 0 }, 
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } } 
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
              <motion.div
                key={track.spotifyId}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
              >
                <div
                  className="flex items-center gap-4 p-2 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors group cursor-pointer"
                  onClick={() => playTrack(track, recentlyPlayed)}
                >
                  {track.imageUrl ? (
                    <img 
                      src={track.imageUrl} 
                      alt={track.name}
                      className="w-14 h-14 rounded-md object-cover"
                    />
                  ) : (
                    <GradientArt id={track.spotifyId} className="w-14 h-14 rounded-md flex-shrink-0" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary truncate">{track.name}</h3>
                    <p className="text-sm text-text-secondary truncate">{track.artist}</p>
                  </div>
                  <div className="flex items-center gap-1 pr-1">
                     <button 
                        onClick={(e) => { e.stopPropagation(); setModalTrack(track); }} 
                        title="Add to playlist" 
                        className="p-2 rounded-full text-text-secondary hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlusCircle size={20} />
                     </button>
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-accent text-primary opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110">
                      <Play size={22} fill="currentColor" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-text-secondary text-center py-8">Your recently played songs will appear here.</p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};