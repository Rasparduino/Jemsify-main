import React from 'react';
import { Music } from 'lucide-react';
import { Playlist } from '../context/PlaylistContext';

interface PlaylistCoverProps {
    playlist: Playlist;
    className?: string;
}

export const PlaylistCover: React.FC<PlaylistCoverProps> = ({ playlist, className }) => {
    // Prioritize custom image if it exists
    if (playlist.customImageUrl) {
        const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3099';
        return (
            <img
                src={`${API_URL}${playlist.customImageUrl}`}
                alt={playlist.name}
                className={`object-cover rounded-lg ${className}`}
            />
        );
    }

    // Filter for tracks that have a real image URL and get the first 4
    const coverImages = playlist.tracks.filter(t => t.imageUrl).slice(0, 4);

    // If we have fewer than 4 images with covers, show the default music icon
    if (coverImages.length < 4) {
        return (
            <div className={`bg-secondary rounded-lg flex items-center justify-center ${className}`}>
                <Music size="50%" className="text-text-secondary" />
            </div>
        );
    }
    
    return (
        <div className={`grid grid-cols-2 grid-rows-2 overflow-hidden rounded-lg ${className}`}>
            {coverImages.map(track => (
                <img
                    key={track.spotifyId}
                    src={track.imageUrl!}
                    alt={track.name}
                    className="w-full h-full object-cover"
                />
            ))}
        </div>
    );
};