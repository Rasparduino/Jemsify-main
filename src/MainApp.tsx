import React, { useState, useEffect, useCallback } from 'react';
import { MobilePlayer } from './components/MobilePlayer';
import { MobileSearch } from './components/MobileSearch';
import { MobileHome } from './components/MobileHome';
import { MobilePlaylist } from './components/MobilePlaylist';
import { MobileLibrary } from './components/MobileLibrary';
import { BottomNavigation } from './components/BottomNavigation';
import { ThemeSelector } from './components/ThemeSelector';
import { MobileArtist } from './components/MobileArtist';
import { MobileAlbum } from './components/MobileAlbum';
import { MobileFriends } from './components/MobileFriends';
import { useAuth } from './context/AuthContext';
import { useSpotify } from './context/SpotifyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Brush, Maximize, Minimize, WifiOff } from 'lucide-react'; // Import WifiOff
import { useNetworkStatus } from './context/NetworkStatusContext'; // Import the hook

// Interface for browser history state
interface AppHistoryState {
    view: 'home' | 'search' | 'library' | 'friends';
    playlistId?: string | null;
    artistId?: string | null;
    albumId?: string | null;
}

// --- NEW: Offline Banner Component ---
const OfflineBanner = () => (
    <motion.div
        initial={{ y: '-100%' }}
        animate={{ y: 0 }}
        exit={{ y: '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white flex items-center justify-center p-2 text-sm font-semibold"
    >
        <WifiOff size={16} className="mr-2" />
        You are currently offline. Some features may be unavailable.
    </motion.div>
);


export const MainApp: React.FC = () => {
    const [currentView, setCurrentView] = useState<'home' | 'search' | 'library' | 'friends'>('home');
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
    const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
    const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
    const [showThemeSelector, setShowThemeSelector] = useState(false);
    const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
    const { logout } = useAuth();
    const { togglePlayPause } = useSpotify();
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
    const { isOnline } = useNetworkStatus(); // Use the network status hook

    const updateHistory = useCallback((state: AppHistoryState) => {
        const currentState = window.history.state;
        if (JSON.stringify(state) !== JSON.stringify(currentState)) {
            window.history.pushState(state, '');
        }
    }, []);

    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (event.state) {
                const { view, playlistId, artistId, albumId } = event.state as AppHistoryState;
                setCurrentView(view);
                setSelectedPlaylistId(playlistId || null);
                setSelectedArtistId(artistId || null);
                setSelectedAlbumId(albumId || null);
            }
        };
        window.addEventListener('popstate', handlePopState);
        window.history.replaceState({ view: 'home', playlistId: null, artistId: null, albumId: null }, '');

        return () => window.removeEventListener('popstate', handlePopState);
    }, []);
    
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };
    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
            if (event.code === 'Space') {
                event.preventDefault();
                togglePlayPause();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlayPause]);

    const resetSubViews = () => {
        setSelectedPlaylistId(null);
        setSelectedArtistId(null);
        setSelectedAlbumId(null);
    };

    const handleViewChange = (view: 'home' | 'search' | 'library' | 'friends') => {
        resetSubViews();
        setCurrentView(view);
        updateHistory({ view, playlistId: null, artistId: null, albumId: null });
    };
    
    const handlePlaylistSelect = (playlistId: string) => {
        resetSubViews();
        setCurrentView('library');
        setSelectedPlaylistId(playlistId);
        updateHistory({ view: 'library', playlistId });
    };

    const handleArtistSelect = (artistId: string) => {
        resetSubViews();
        setSelectedArtistId(artistId);
        updateHistory({ view: currentView, artistId });
    };

    const handleAlbumSelect = (albumId: string) => {
        resetSubViews();
        setSelectedAlbumId(albumId);
        updateHistory({ view: currentView, albumId });
    };
    
    const handleBack = () => {
        window.history.back();
    };

    const renderContent = () => {
        if (selectedAlbumId) {
            return <MobileAlbum albumId={selectedAlbumId} onBack={handleBack} onArtistSelect={handleArtistSelect} />;
        }
        if (selectedArtistId) {
            return <MobileArtist artistId={selectedArtistId} onBack={handleBack} onAlbumSelect={handleAlbumSelect} />;
        }
        if (selectedPlaylistId) {
            return <MobilePlaylist playlistId={selectedPlaylistId} onBack={handleBack} />;
        }
        switch (currentView) {
            case 'home': return <MobileHome />;
            case 'search': return <MobileSearch onArtistSelect={handleArtistSelect} />;
            case 'friends': return <MobileFriends />;
            case 'library': return <MobileLibrary onPlaylistSelect={handlePlaylistSelect} />;
            default: return <MobileHome />;
        }
    };

    const activeViewKey = selectedAlbumId || selectedArtistId || selectedPlaylistId || currentView;

    const getNavView = () => {
        if (selectedAlbumId || selectedArtistId) return 'sub-page';
        if (selectedPlaylistId) return 'library';
        return currentView;
    }

    return (
        <div className="min-h-screen bg-primary text-primary flex flex-col relative overflow-hidden h-[100dvh]">
            <AnimatePresence>
                {!isOnline && <OfflineBanner />}
            </AnimatePresence>
            
            <audio ref={useSpotify().audioRef} />

            <header className="fixed top-0 left-0 right-0 z-20 flex justify-between items-center p-4 bg-primary/70 backdrop-blur-md">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary tracking-tight leading-none">μSynth</h1>
                  <p className="text-xs text-text-secondary -mt-0.5 ml-px">by Smaran</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={toggleFullScreen} className="p-2.5 rounded-full bg-secondary/80 text-text-secondary hover:text-accent transition-colors">
                        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                    </button>
                    <button onClick={() => setShowThemeSelector(true)} className="p-2.5 rounded-full bg-secondary/80 text-text-secondary hover:text-accent transition-colors"><Brush size={18} /></button>
                    <button onClick={logout} className="bg-red-600/80 text-white text-xs px-3 py-1.5 rounded-full hover:bg-red-500 transition-colors">Logout</button>
                </div>
            </header>
            
            <main 
                className={`flex-1 overflow-y-auto pb-32 pt-20 transition-all duration-500 ${isPlayerExpanded ? 'blur-md brightness-50 scale-[.98]' : 'blur-0 brightness-100 scale-100'}`}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeViewKey}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </main>

            <AnimatePresence>
                {showThemeSelector && <ThemeSelector onClose={() => setShowThemeSelector(false)} />}
            </AnimatePresence>

            <AnimatePresence>
                {!isPlayerExpanded && (
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                    className="fixed bottom-16 left-0 right-0 z-40"
                >
                    <MobilePlayer isExpanded={false} onToggleExpanded={setIsPlayerExpanded} />
                </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isPlayerExpanded && (
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", stiffness: 400, damping: 40 }}
                    className="fixed inset-0 z-50"
                >
                    <MobilePlayer isExpanded={true} onToggleExpanded={setIsPlayerExpanded} />
                </motion.div>
                )}
            </AnimatePresence>

            <div 
                className={`fixed bottom-0 left-0 right-0 z-30 transition-all duration-500 ${isPlayerExpanded ? 'blur-md brightness-50' : 'blur-0 brightness-100'}`}
>
                <BottomNavigation currentView={getNavView()} onViewChange={handleViewChange} />
            </div>
        </div>
    );
};
