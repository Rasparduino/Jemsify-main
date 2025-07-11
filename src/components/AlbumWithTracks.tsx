import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Loader, Play, PlusCircle } from 'lucide-react';
import { useSpotify, Track } from '../context/SpotifyContext';
import { useServer } from '../context/ServerContext';

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
    const { isDownloading, downloadTrack } = useServer();
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const fetchTracks = useCallback(async () => {
        if (tracks.length > 0) return; // Don't re-fetch
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

    const handleTrackClick = (track: Track) => {
        onTrackSelect(track, tracks);
        if (!isDownloading(track.spotifyId)) {
            downloadTrack({
                id: track.spotifyId,
                name: track.name,
                artist: track.artist,
                imageUrl: track.imageUrl
            });
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
                        <div className="pt-1 pb-2 px-2">
                            {isLoading && <div className="flex justify-center p-4"><Loader className="animate-spin text-accent" /></div>}
                            {!isLoading && tracks.map((track, index) => (
                                <div key={track.spotifyId} className="flex items-center gap-3 p-2 group hover:bg-secondary/40 rounded-md cursor-pointer" onClick={() => handleTrackClick(track)}>
                                    <span className="w-6 text-center text-text-secondary font-mono text-sm">{index + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-text-primary truncate">{track.name}</p>
                                        <p className="text-xs text-text-secondary truncate">{track.artist}</p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); openPlaylistModal(track); }} className="p-1 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                                        <PlusCircle size={20} />
                                    </button>
                                    <div className="w-8 h-8 flex items-center justify-center">
                                      {isDownloading(track.spotifyId) ? <Loader size={18} className="animate-spin text-blue-500" /> : <Play size={18} className="text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};