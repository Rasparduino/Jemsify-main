import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Repeat, 
  Shuffle,
  Heart,
  Download 
} from 'lucide-react';
import { useSpotify } from '../context/SpotifyContext';

export const Player: React.FC = () => {
  const { currentTrack, isPlaying, togglePlayPause, nextTrack, previousTrack, volume, setVolume } = useSpotify();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [isLiked, setIsLiked] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime(prev => Math.min(prev + 1, duration));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, duration]);

  useEffect(() => {
    if (currentTrack) {
      setDuration(currentTrack.duration || 180); // Default 3 minutes
      setCurrentTime(0);
      setIsLiked(currentTrack.liked || false);
      setIsDownloaded(currentTrack.downloaded || false);
    }
  }, [currentTrack]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    if (progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = Math.floor(percentage * duration);
      setCurrentTime(newTime);
    }
  };

  const handleDownload = () => {
    if (currentTrack) {
      // This would be where yt-dlp integration would happen
      console.log('Download requested for:', currentTrack.name);
      // Mock download status
      setIsDownloaded(true);
    }
  };

  if (!currentTrack) {
    return (
      <div className="h-24 bg-gray-900 border-t border-gray-800 flex items-center justify-center">
        <p className="text-gray-400">No track selected</p>
      </div>
    );
  }

  return (
    <div className="h-24 bg-gray-900 border-t border-gray-800 flex items-center justify-between px-4">
      {/* Current Track Info */}
      <div className="flex items-center gap-4 w-1/3">
        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"></div>
        <div className="min-w-0">
          <h4 className="font-semibold text-sm truncate">{currentTrack.name}</h4>
          <p className="text-xs text-gray-400 truncate">{currentTrack.artist}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`p-2 rounded-full hover:bg-gray-800 transition-colors ${
              isLiked ? 'text-green-500' : 'text-gray-400'
            }`}
          >
            <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleDownload}
            className={`p-2 rounded-full hover:bg-gray-800 transition-colors ${
              isDownloaded ? 'text-blue-500' : 'text-gray-400'
            }`}
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Player Controls */}
      <div className="flex flex-col items-center gap-2 w-1/3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsShuffled(!isShuffled)}
            className={`p-2 rounded-full hover:bg-gray-800 transition-colors ${
              isShuffled ? 'text-green-500' : 'text-gray-400'
            }`}
          >
            <Shuffle size={16} />
          </button>
          <button
            onClick={previousTrack}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
          >
            <SkipBack size={20} />
          </button>
          <button
            onClick={togglePlayPause}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause size={20} className="text-black" />
            ) : (
              <Play size={20} className="text-black ml-0.5" fill="currentColor" />
            )}
          </button>
          <button
            onClick={nextTrack}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
          >
            <SkipForward size={20} />
          </button>
          <button
            onClick={() => setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')}
            className={`p-2 rounded-full hover:bg-gray-800 transition-colors ${
              repeatMode !== 'off' ? 'text-green-500' : 'text-gray-400'
            }`}
          >
            <Repeat size={16} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 w-full max-w-md">
          <span className="text-xs text-gray-400 w-10">{formatTime(currentTime)}</span>
          <div
            ref={progressRef}
            className="flex-1 h-1 bg-gray-600 rounded-full cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-white rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-2 w-1/3 justify-end">
        <Volume2 size={16} className="text-gray-400" />
        <div className="w-20 h-1 bg-gray-600 rounded-full">
          <div
            className="h-full bg-white rounded-full"
            style={{ width: `${volume}%` }}
          />
        </div>
      </div>
    </div>
  );
};