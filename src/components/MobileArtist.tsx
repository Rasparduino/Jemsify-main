import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, PlusCircle, Loader, Album } from 'lucide-react';
import { useSpotify, Track, Artist } from '../context/SpotifyContext';
import { useServer } from '../context/ServerContext';
import { PlaylistSelectionModal } from './PlaylistSelectionModal';
import { ArtistDiscography } from './ArtistDiscography';
import { motion } from 'framer-motion';

const formatSpotifyTrack = (spotifyTrack: any): Track => ({
    spotifyId: spotifyTrack.id,
    name: spotifyTrack.name,
    artist: spotifyTrack.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
    albumName: spotifyTrack.album?.name || '',
    duration_ms: spotifyTrack.duration_ms,
    preview_url: spotifyTrack.preview_url,
    imageUrl: spotifyTrack.album?.images?.[0]?.url || null
});

interface MobileArtistProps {
    artistId: string;
    onBack: () => void;
    onAlbumSelect: (albumId: string) => void;
}

export const MobileArtist: React.FC<MobileArtistProps> = ({ artistId, onBack, onAlbumSelect }) => {
    const [artist, setArtist] = useState<Artist | null>(null);
    const [topTracks, setTopTracks] = useState<Track[]>([]);
    const [albums, setAlbums] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalTrack, setModalTrack] = useState<Track | null>(null);
    const [showDiscography, setShowDiscography] = useState(false);

    const { playTrack } = useSpotify();
    const { downloadTrack, isDownloading, downloadedTracks } = useServer();
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const fetchArtistData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [artistRes, topTracksRes, albumsRes] = await Promise.all([
                    fetch(`${API_URL}/api/spotify/artist/${artistId}`),
                    fetch(`${API_URL}/api/spotify/artist/${artistId}/top-tracks`),
                    fetch(`${API_URL}/api/spotify/artist/${artistId}/albums?limit=50`)
                ]);

                if (!artistRes.ok || !topTracksRes.ok || !albumsRes.ok) throw new Error('Failed to fetch artist data.');

                const artistData = await artistRes.json();
                const topTracksData = await topTracksRes.json();
                const albumsData = await albumsRes.json();

                setArtist(artistData);
                setTopTracks(topTracksData.map(formatSpotifyTrack));
                const uniqueAlbums = albumsData.filter((album: any, index: number, self: any[]) =>
                    index === self.findIndex((a) => a.name === album.name)
                );
                setAlbums(uniqueAlbums);

            } catch (err) {
                setError('Could not load artist. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchArtistData();
    }, [artistId, API_URL]);
    
    const handleTrackClick = (track: Track) => {
        playTrack(track, topTracks);
        if (!isDownloading(track.spotifyId) && !downloadedTracks.some(d => d.spotifyId === track.spotifyId)) {
            downloadTrack({ id: track.spotifyId, name: track.name, artist: track.artist, imageUrl: track.imageUrl });
        }
    };

    if (loading) return <div className="p-8 text-center text-text-secondary">Loading artist...</div>;
    if (error) return <div className="p-8 text-center text-red-400">{error}</div>;

    if (showDiscography) {
        return (
            <ArtistDiscography 
                artist={artist}
                albums={albums}
                onBack={() => setShowDiscography(false)}
                onAlbumSelect={onAlbumSelect}
                onTrackSelect={playTrack}
                openPlaylistModal={setModalTrack}
            />
        );
    }

    const bannerImage = artist?.imageUrl || albums[0]?.images[0]?.url || topTracks[0]?.imageUrl;

    return (
        <div className="pb-4 min-h-full">
            {modalTrack && <PlaylistSelectionModal track={modalTrack} onClose={() => setModalTrack(null)} />}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative h-48 w-full">
                {bannerImage && <img src={bannerImage} alt={artist?.name} className="absolute inset-0 w-full h-full object-cover opacity-30" />}
                <div className="absolute inset-0 bg-gradient-to-t from-primary to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 w-full">
                    <h1 className="text-4xl font-extrabold text-text-primary shadow-black [text-shadow:1px_1px_2px_var(--tw-shadow-color)]">{artist?.name}</h1>
                </div>
                <button onClick={onBack} className="absolute top-4 left-4 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60">
                    <ChevronLeft size={24} className="text-text-primary" />
                </button>
            </motion.div>
            
            <div className="p-4">
                <h2 className="text-xl font-bold text-text-primary mb-4">Popular</h2>
                <div className="space-y-1">
                    {topTracks.slice(0, 5).map((track, index) => (
                        <motion.div
                            key={track.spotifyId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                            className="flex items-center gap-4 p-2 hover:bg-secondary rounded-lg group"
                        >
                            <span className="w-6 text-center text-text-secondary font-medium">{index + 1}</span>
                            <img src={track.imageUrl!} alt={track.name} className="w-10 h-10 rounded object-cover" />
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleTrackClick(track)}>
                                <p className="font-semibold text-text-primary truncate">{track.name}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={(e) => { e.stopPropagation(); setModalTrack(track); }} title="Add to playlist" className="p-2 rounded-full text-text-secondary hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <PlusCircle size={20} />
                                </button>
                                {isDownloading(track.spotifyId) ? (
                                    <div className="w-10 h-10 flex items-center justify-center text-blue-500">
                                        <Loader size={20} className="animate-spin" />
                                    </div>
                                ) : (
                                    <button onClick={() => handleTrackClick(track)} className="w-10 h-10 flex items-center justify-center text-text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play size={20} fill="currentColor" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="p-4">
                <h2 className="text-xl font-bold text-text-primary mb-4">Discography</h2>
                <div className="flex justify-between items-center">
                    <p className="text-sm text-text-secondary">Albums and singles</p>
                    <button onClick={() => setShowDiscography(true)} className="px-3 py-1 text-sm font-bold border-2 border-text-secondary rounded-full text-text-secondary hover:border-text-primary hover:text-text-primary transition-colors">
                        See all
                    </button>
                </div>
                <div className="flex gap-4 overflow-x-auto pt-4 pb-2 snap-x snap-mandatory -mx-4 px-4">
                    {albums.slice(0, 10).map((album, index) => (
                        <motion.div
                            key={album.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + 0.05 * index }}
                            onClick={() => onAlbumSelect(album.id)}
                            className="snap-start flex-shrink-0 w-36 cursor-pointer group"
                        >
                            <img src={album.images[0]?.url} alt={album.name} className="w-36 h-36 rounded-lg object-cover mb-2 transition-transform group-hover:scale-105" />
                            <p className="font-semibold text-sm text-text-primary truncate">{album.name}</p>
                            <p className="text-xs text-text-secondary">{album.release_date.substring(0, 4)}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};