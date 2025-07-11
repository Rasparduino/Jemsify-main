import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Music, Headphones } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSpotify, Track } from '../context/SpotifyContext';
import { AddFriendModal } from './AddFriendModal';
import { GradientArt } from './GradientArt';

interface Friend {
  id: string;
  email: string;
  nowPlaying: Track | null;
}

export const MobileFriends: React.FC = () => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { token } = useAuth();
    const { playTrack } = useSpotify();
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const fetchFriends = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/friends`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setFriends(data);
            }
        } catch (error) {
            console.error("Failed to fetch friends:", error);
        } finally {
            setLoading(false);
        }
    }, [token, API_URL]);

    useEffect(() => {
        fetchFriends();
        const interval = setInterval(fetchFriends, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [fetchFriends]);

    const handleAddFriend = async (email: string): Promise<string> => {
        try {
            const res = await fetch(`${API_URL}/api/friends/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to add friend');
            fetchFriends(); // Re-fetch friends list immediately
            return 'success';
        } catch (error) {
            return error.message;
        }
    };
    
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <div className="pb-4 min-h-full">
            {isAddModalOpen && <AddFriendModal onClose={() => setIsAddModalOpen(false)} onAddFriend={handleAddFriend} />}
            <div className="px-4 mb-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-extrabold text-text-primary">Friends</h1>
                    <button onClick={() => setIsAddModalOpen(true)} className="p-2 rounded-full hover:bg-secondary text-text-secondary hover:text-accent">
                        <UserPlus size={22} />
                    </button>
                </div>
            </div>

            {loading ? (
                <p className="text-center text-text-secondary">Loading friends...</p>
            ) : friends.length === 0 ? (
                <div className="text-center py-16 text-text-secondary px-8">
                    <Users size={48} className="mx-auto mb-4" />
                    <p className="font-semibold text-text-primary">It's quiet in here...</p>
                    <p className="text-sm">Add friends by email to see what they're listening to.</p>
                </div>
            ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3 px-4">
                    {friends.map(friend => (
                        <motion.div key={friend.id} variants={itemVariants} className="bg-secondary/50 p-3 rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center">
                                    <Users size={24} className="text-text-secondary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-text-primary truncate">{friend.email}</p>
                                    <p className="text-xs text-text-secondary">Friend</p>
                                </div>
                            </div>
                            {friend.nowPlaying && (
                                <div className="mt-3 bg-primary/50 p-2 rounded-md flex items-center gap-3">
                                    {friend.nowPlaying.imageUrl ?
                                        <img src={friend.nowPlaying.imageUrl} alt={friend.nowPlaying.name} className="w-10 h-10 rounded-md object-cover" />
                                        : <GradientArt id={friend.nowPlaying.spotifyId} className="w-10 h-10 rounded-md flex-shrink-0" />
                                    }
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-text-primary truncate">{friend.nowPlaying.name}</p>
                                        <p className="text-xs text-text-secondary truncate">{friend.nowPlaying.artist}</p>
                                    </div>
                                    <button onClick={() => playTrack(friend.nowPlaying!)} className="p-2 text-accent hover:text-accent-secondary">
                                        <Headphones size={20} />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};