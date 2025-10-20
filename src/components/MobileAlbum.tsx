import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, PlusCircle, ListPlus } from 'lucide-react';
import { useSpotify, Track } from '../context/SpotifyContext';
import { useServer } from '../context/ServerContext';
import { PlaylistSelectionModal } from './PlaylistSelectionModal';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadButton } from './DownloadButton'; // Import the new button

const formatSpotifyTrack = (albumImage: string) => (spotifyTrack: any): Track => ({
    spotifyId: spotifyTrack.id,
    name: spotifyTrack.name,
    artist: spotifyTrack.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
    albumName: '',
    duration_ms: spotifyTrack.duration_ms,
    preview_url: spotifyTrack.preview_url,
    imageUrl: albumImage
});

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

const TrackItem: React.FC<{
  track: Track;
  index: number;
  context: Track[];
  onPlay: (track: Track, context: Track[]) => void;
  onAddToQueue: (track: Track) => void;
  onAddToPlaylist: (track: Track) => void;
}> = ({ track, index, context, onPlay, onAddToQueue, onAddToPlaylist }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div layout className="bg-secondary/30 rounded-lg overflow-hidden transition-colors" variants={itemVariants}>
      <div onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-4 p-2 cursor-pointer">
        <span className="w-6 text-center text-text-secondary font-medium">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary truncate">{track.name}</p>
          <p className="text-xs text-text-secondary truncate">{track.artist}</p>
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

interface MobileAlbumProps {
    albumId: string;
    onBack: () => void;
    onArtistSelect: (artistId: string) => void;
}

export const MobileAlbum: React.FC<MobileAlbumProps> = ({ albumId, onBack, onArtistSelect }) => {
    const [album, setAlbum] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalTrack, setModalTrack] = useState<Track | null>(null);

    const { playTrack, addToQueue } = useSpotify();
    const { downloadedTracks } = useServer();
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const fetchAlbumData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_URL}/api/spotify/album/${albumId}`);
                if (!res.ok) throw new Error('Failed to fetch album data.');
                const data = await res.json();
                setAlbum(data);
            } catch (err) {
                setError('Could not load album. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAlbumData();
    }, [albumId, API_URL]);
    
    if (loading) return <div className="p-8 text-center text-text-secondary">Loading album...</div>;
    if (error || !album) return <div className="p-8 text-center text-red-400">{error || 'Album not found.'}</div>;
    
    const albumCover = album.images[0]?.url;
    const formattedTracks = album.tracks.items.map(formatSpotifyTrack(albumCover));

    const handlePlayAlbum = () => {
        if (formattedTracks.length > 0) {
            playTrack(formattedTracks[0], formattedTracks);
        }
    };
    
    return (
        <div className="pb-4 min-h-full bg-gradient-to-b from-accent-secondary/20 via-primary/50 to-primary">
            {modalTrack && <PlaylistSelectionModal track={modalTrack} onClose={() => setModalTrack(null)} />}
            <div className="p-4">
                <button onClick={onBack} className="p-2 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40 mb-4">
                    <ChevronLeft size={24} className="text-text-primary" />
                </button>
                <motion.div initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} transition={{delay: 0.1}} className="flex flex-col items-center text-center">
                    <img src={albumCover} alt={album.name} className="w-48 h-48 rounded-lg shadow-2xl mb-4" />
                    <h1 className="text-3xl font-extrabold text-text-primary">{album.name}</h1>
                    <div 
                        onClick={() => onArtistSelect(album.artists[0].id)}
                        className="text-lg font-medium text-text-secondary hover:underline cursor-pointer"
                    >
                        {album.artists[0].name}
                    </div>
                    <p className="text-xs text-text-secondary/80 mt-1">{album.album_type.charAt(0).toUpperCase() + album.album_type.slice(1)} • {album.release_date.substring(0, 4)}</p>
                </motion.div>
            </div>

            <div className="px-4 mb-4">
                <button onClick={handlePlayAlbum} className="w-14 h-14 bg-accent text-primary rounded-full flex items-center justify-center shadow-lg shadow-accent/30 hover:scale-105 transition-transform">
                    <Play size={28} fill="currentColor" className="ml-1" />
                </button>
            </div>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="px-4 space-y-1"
            >
                {formattedTracks.map((track, index) => (
                    <TrackItem
                        key={track.spotifyId}
                        track={track}
                        index={index}
                        context={formattedTracks}
                        onPlay={playTrack}
                        onAddToQueue={addToQueue}
                        onAddToPlaylist={setModalTrack}
                    />
                ))}
            </motion.div>
        </div>
    );
};
