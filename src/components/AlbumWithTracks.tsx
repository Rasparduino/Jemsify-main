import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Loader, Play, PlusCircle, ListPlus } from 'lucide-react';
import { useSpotify, Track } from '../context/SpotifyContext';
import { DownloadButton } from './DownloadButton'; // Import the new button

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
    <motion.div layout className="bg-secondary/40 rounded-lg overflow-hidden transition-colors">
      <div onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-3 p-2 cursor-pointer">
        <span className="w-6 text-center text-text-secondary font-mono text-sm">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="text-text-primary truncate">{track.name}</p>
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

interface Album {
    id: string;
    name: string;
    images: { url: string }[];
    release_date: string;
    album_type: string;
}

interface AlbumWithTracksProps {
    album: Album;
    onAlbumSelect: (albumId: string) => void;
    onTrackSelect: (track: Track, context: Track[]) => void;
    openPlaylistModal: (track: Track) => void;
}

export const AlbumWithTracks: React.FC<AlbumWithTracksProps> = ({ album, onAlbumSelect, onTrackSelect, openPlaylistModal }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { addToQueue } = useSpotify();
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const fetchTracks = useCallback(async () => {
        if (tracks.length > 0) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/spotify/album/${album.id}`);
            if (!res.ok) throw new Error("Failed to fetch album tracks");
            const data = await res.json();
            const formattedTracks = data.tracks.items.map((track: any) => ({
                spotifyId: track.id,
                name: track.name,
                artist: track.artists.map((a: any) => a.name).join(', '),
                albumName: album.name,
                duration_ms: track.duration_ms,
                preview_url: track.preview_url,
                imageUrl: album.images[0]?.url || null
            }));
            setTracks(formattedTracks);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [album.id, album.name, album.images, tracks.length, API_URL]);

    const handleToggle = () => {
        const expanding = !isExpanded;
        setIsExpanded(expanding);
        if (expanding) {
            fetchTracks();
        }
    };

    return (
        <div className="bg-secondary/30 rounded-lg overflow-hidden">
            <button onClick={handleToggle} className="w-full flex items-center gap-4 p-3 text-left hover:bg-secondary/50 transition-colors">
                <img src={album.images[0]?.url} alt={album.name} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-text-primary truncate">{album.name}</p>
                    <p className="text-sm text-text-secondary">{album.release_date.substring(0, 4)} • {album.album_type.charAt(0).toUpperCase() + album.album_type.slice(1)}</p>
                </div>
                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                    <ChevronDown size={24} className="text-text-secondary" />
                </motion.div>
            </button>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <div className="pt-1 pb-2 px-2 space-y-1">
                            {isLoading && <div className="flex justify-center p-4"><Loader className="animate-spin text-accent" /></div>}
                            {!isLoading && tracks.map((track, index) => (
                                <TrackItem
                                    key={track.spotifyId}
                                    track={track}
                                    index={index}
                                    context={tracks}
                                    onPlay={onTrackSelect}
                                    onAddToQueue={addToQueue}
                                    onAddToPlaylist={openPlaylistModal}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
