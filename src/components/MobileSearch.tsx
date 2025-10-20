import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, Loader, PlusCircle, User, ListPlus } from 'lucide-react';
import { useSpotify, Track, Artist } from '../context/SpotifyContext';
import { useServer } from '../context/ServerContext';
import { PlaylistSelectionModal } from './PlaylistSelectionModal';
import { motion, AnimatePresence } from 'framer-motion';
// --- FIX: Import the new DownloadButton ---
import { DownloadButton } from './DownloadButton';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

// --- FIX: The props for this component are now much simpler ---
const SearchTrackItem: React.FC<{
  track: Track;
  onPlay: () => void;
  onAddToQueue: () => void;
  onAddToPlaylist: () => void;
}> = ({ track, onPlay, onAddToQueue, onAddToPlaylist }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div layout className="bg-secondary/50 rounded-lg overflow-hidden transition-colors" variants={itemVariants}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 p-3 cursor-pointer"
      >
        <img src={track.imageUrl || 'https://via.placeholder.com/64'} alt={track.name} className="w-12 h-12 rounded-md flex-shrink-0 object-cover bg-gray-800"/>
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
            <button onClick={onPlay} title="Play" className="p-2 rounded-full text-text-secondary hover:text-accent transition-colors"><Play size={22} /></button>
            <button onClick={onAddToQueue} title="Add to queue" className="p-2 rounded-full text-text-secondary hover:text-accent transition-colors"><ListPlus size={22} /></button>
            <button onClick={onAddToPlaylist} title="Add to playlist" className="p-2 rounded-full text-text-secondary hover:text-accent transition-colors"><PlusCircle size={22} /></button>
            {/* --- FIX: The complex download logic is replaced by our new component --- */}
            <DownloadButton track={track} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface MobileSearchProps {
    onArtistSelect: (artistId: string) => void;
}

export const MobileSearch: React.FC<MobileSearchProps> = ({ onArtistSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { searchResults, searchArtists, searchTracks, playTrack, addToQueue } = useSpotify();
  // --- FIX: We no longer need all the download state here directly ---
  const { downloadedTracks, youtubeSearch } = useServer();
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [ytSearchStatus, setYtSearchStatus] = useState<'idle' | 'searching' | 'found' | 'error'>('idle');
  const [ytQuery, setYtQuery] = useState('');
  const [trackIdToPlay, setTrackIdToPlay] = useState<string | null>(null);
  const [modalTrack, setModalTrack] = useState<Track | null>(null);

  useEffect(() => {
    if (ytSearchStatus !== 'idle') return;
    setIsSearching(true);
    const timer = setTimeout(() => {
      searchTracks(searchQuery).finally(() => setIsSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchTracks, ytSearchStatus]);
  
  useEffect(() => {
    if (trackIdToPlay && downloadedTracks.some(t => t.spotifyId === trackIdToPlay)) {
      const downloadedTrack = downloadedTracks.find(t => t.spotifyId === trackIdToPlay);
      if (downloadedTrack) {
        setYtSearchStatus('found');
        setTimeout(() => {
            const trackToPlay: Track = { 
                ...downloadedTrack, 
                albumName: 'YouTube', 
                duration_ms: 0, 
                preview_url: null 
            };
            playTrack(trackToPlay);
            setYtSearchStatus('idle');
            setTrackIdToPlay(null);
        }, 1000);
      }
    }
  }, [downloadedTracks, trackIdToPlay, playTrack]);

  const handleYoutubeSearch = async () => {
    if (searchQuery.trim().length > 0) {
      searchInputRef.current?.blur();
      setYtSearchStatus('searching');
      setYtQuery(searchQuery);
      try {
        const result = await youtubeSearch(searchQuery);
        setTrackIdToPlay(result.track.spotifyId);
      } catch (error) {
        console.error("YT Search failed", error);
        setYtSearchStatus('error');
        setTimeout(() => setYtSearchStatus('idle'), 3000);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchInputRef.current?.blur();
    }
  };

  const renderContent = () => {
    if (ytSearchStatus !== 'idle') {
      let message = "";
      if (ytSearchStatus === 'searching') message = `Searching YouTube for "${ytQuery}"...`;
      if (ytSearchStatus === 'found') message = `Found song! Playing now...`;
      if (ytSearchStatus === 'error') message = `Could not find "${ytQuery}". Try another search.`;

      return (
        <motion.div key="yt-status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-2 animate-pulse bg-clip-text text-transparent bg-gradient-to-r from-accent to-accent-secondary">
              {message}
            </h2>
            {ytSearchStatus === 'searching' && <Loader className="text-accent animate-spin mt-4" />}
        </motion.div>
      );
    }

    const hasResults = searchResults.length > 0 || searchArtists.length > 0;

    if (hasResults) {
        return (
            <motion.div
                key="results"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                variants={containerVariants}
                className="space-y-4"
            >
                {searchResults.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold mb-2 text-text-primary">Songs</h2>
                        <div className="space-y-2">
                            {searchResults.slice(0, 4).map((track) => (
                                <SearchTrackItem
                                  key={track.spotifyId}
                                  track={track}
                                  onPlay={() => playTrack(track, searchResults)}
                                  onAddToQueue={() => addToQueue(track)}
                                  onAddToPlaylist={() => setModalTrack(track)}
                                />
                            ))}
                        </div>
                    </div>
                )}
                
                {searchArtists.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold mt-6 mb-2 text-text-primary">Artists</h2>
                        <div className="space-y-2">
                            {searchArtists.slice(0, 4).map((artist) => (
                                <motion.div
                                    key={artist.spotifyId}
                                    variants={itemVariants}
                                    onClick={() => onArtistSelect(artist.spotifyId)}
                                    className="flex items-center gap-3 p-3 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors group cursor-pointer"
                                >
                                    {artist.imageUrl ? (
                                        <img src={artist.imageUrl} alt={artist.name} className="w-12 h-12 rounded-full flex-shrink-0 object-cover bg-gray-800" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full flex-shrink-0 bg-secondary flex items-center justify-center"><User size={24} /></div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-text-primary truncate">{artist.name}</h3>
                                        <p className="text-sm text-text-secondary">Artist</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        );
    }
    
    if (!isSearching && searchQuery) {
      return (
        <motion.div key="no-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <p className="text-text-secondary">No results found for "{searchQuery}"</p>
        </motion.div>
      );
    }
    
    return (
       <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-xl font-bold mb-4 text-text-primary">Browse all</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: 'Pop', color: 'bg-pink-500' },
            { name: 'Hip-Hop', color: 'bg-orange-500' },
            { name: 'Rock', color: 'bg-red-700' },
            { name: 'Electronic', color: 'bg-blue-500' }
          ].map((category) => (
            <div key={category.name} onClick={() => setSearchQuery(`genre:${category.name.toLowerCase()}`)} className={`h-24 ${category.color} rounded-lg p-3 flex items-end font-bold text-lg shadow-lg cursor-pointer`}>
              {category.name}
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-full">
      {modalTrack && <PlaylistSelectionModal track={modalTrack} onClose={() => setModalTrack(null)} />}
      <div className="px-4 mb-4">
        <h1 className="text-3xl font-extrabold text-text-primary mb-4">Search</h1>
        <div className="relative">
          <Search size={22} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to listen to?"
            className="w-full pl-12 pr-4 py-3 bg-secondary text-text-primary rounded-lg border-2 border-transparent outline-none focus:ring-2 focus:ring-accent transition-all"
          />
          {isSearching && <Loader size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary animate-spin" />}
        </div>
        {ytSearchStatus === 'idle' && !isSearching && searchQuery.trim().length > 0 && (
            <div className="text-center mt-4">
                <button 
                    onClick={handleYoutubeSearch}
                    className="text-text-secondary hover:text-accent transition-colors"
                >
                    <p className="text-sm">Not finding it? <span className="font-bold underline">Click me to search on YouTube.</span></p>
                </button>
            </div>
        )}
      </div>

      <div className="px-4">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
    </div>
  );
};
