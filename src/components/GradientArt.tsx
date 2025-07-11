import React from 'react';
import { Search } from 'lucide-react';

interface GradientArtProps {
    id: string;
    className?: string;
}

export const GradientArt: React.FC<GradientArtProps> = ({ id, className }) => {
    // A simple hash function to get somewhat unique colors per track
    const hash = id.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const hue1 = hash % 360;
    const hue2 = (hash / 2) % 360;

    const gradientStyle = {
        background: `linear-gradient(to bottom right, hsl(${hue1}, 60%, 50%), hsl(${hue2}, 60%, 30%))`
    };

    return (
        <div style={gradientStyle} className={`flex items-center justify-center ${className}`}>
            <Search size="40%" className="text-primary opacity-30" />
        </div>
    );
};