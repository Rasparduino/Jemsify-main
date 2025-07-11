import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Artist } from '../context/SpotifyContext';
import { AlbumWithTracks } from './AlbumWithTracks';

interface ArtistDiscographyProps {
    artist: Artist | null;
    albums: any[];
    onBack: () => void;
    onAlbumSelect: (albumId: string) => void;
    onTrackSelect: (track: any, context: any[]) => void;
    openPlaylistModal: (track: any) => void;
}

export const ArtistDiscography: React.FC<ArtistDiscographyProps> = ({ artist, albums, onBack, onAlbumSelect, onTrackSelect, openPlaylistModal }) => {
    if (!artist) return null;

    const sortedAlbums = [...albums].sort((a, b) => {
        const dateA = new Date(a.release_date).getTime();
        const dateB = new Date(b.release_date).getTime();
        return dateB - dateA;
    });

    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="pb-4 min-h-full"
        >
            <div className="p-4">
                <button onClick={onBack} className="flex items-center gap-2 p-2 -ml-2 text-text-primary hover:text-accent transition-colors">
                    <ChevronLeft size={24} />
                    <span className="font-bold">{artist.name}</span>
                </button>
                <h1 className="text-3xl font-extrabold text-text-primary mt-4">Discography</h1>
            </div>

            <div className="px-4 space-y-3">
                {sortedAlbums.map(album => (
                    <AlbumWithTracks 
                        key={album.id}
                        album={album}
                        onAlbumSelect={onAlbumSelect}
                        onTrackSelect={onTrackSelect}
                        openPlaylistModal={openPlaylistModal}
                    />
                ))}
            </div>
        </motion.div>
    );
};