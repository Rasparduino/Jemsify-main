import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Heart, ChevronDown, Volume2, Volume1, VolumeX, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { useSpotify } from '../context/SpotifyContext';
import { GradientArt } from './GradientArt';

interface MobilePlayerProps {
  isExpanded: boolean;
  onToggleExpanded: (expanded: boolean) => void;
}

export const MobilePlayer: React.FC<MobilePlayerProps> = ({ isExpanded, onToggleExpanded }) => {
  const { 
    currentTrack, isPlaying, togglePlayPause, nextTrack, previousTrack, 
    audioRef, toggleLike, isLiked,
    volume, setVolume,
    isShuffled, toggleShuffle,
    repeatMode, cycleRepeatMode
  } = useSpotify();
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const timeUpdateHandler = () => setCurrentTime(audio.currentTime);
    const loadedMetadataHandler = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', timeUpdateHandler);
    audio.addEventListener('loadedmetadata', loadedMetadataHandler);
    
    if (audio.readyState > 0) {
      loadedMetadataHandler();
      timeUpdateHandler();
    }

    return () => {
      audio.removeEventListener('timeupdate', timeUpdateHandler);
      audio.removeEventListener('loadedmetadata', loadedMetadataHandler);
    };
  }, [audioRef]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = Number(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  const isYoutubeTrack = currentTrack.artist === 'YouTube Search';
  const albumArt = currentTrack.imageUrl;
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;

  return (
    <>
      {!isExpanded ? (
        <div onClick={() => onToggleExpanded(true)} className="bg-secondary/80 backdrop-blur-md rounded-lg p-2 flex items-center gap-3 active:bg-secondary transition-colors mx-2">
            {isYoutubeTrack || !albumArt ? (
                <GradientArt id={currentTrack.spotifyId} className="w-10 h-10 rounded-md flex-shrink-0" />
            ) : (
                <img src={albumArt} alt={currentTrack.name} className="w-10 h-10 rounded-md object-cover" />
            )}
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-text-primary text-sm truncate">{currentTrack.name}</h4>
                <p className="text-xs text-text-secondary truncate">{currentTrack.artist}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); toggleLike(currentTrack); }} className={`p-1 ${isLiked(currentTrack.spotifyId) ? 'text-accent' : 'text-text-secondary'}`}>
                <Heart size={20} fill={isLiked(currentTrack.spotifyId) ? 'currentColor' : 'none'}/>
              </button>
              <button onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} className="w-8 h-8 flex items-center justify-center text-text-primary">
                  {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>
            </div>
        </div>
      ) : (
        <div className="bg-gradient-to-b from-accent-secondary/50 to-primary flex flex-col p-4 pt-12 inset-0 h-full">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => onToggleExpanded(false)} className="p-2 text-text-primary"><ChevronDown size={28} /></button>
            <p className="font-semibold text-text-primary">Now Playing</p>
            <button className="p-2 opacity-0 pointer-events-none"><ChevronDown size={28} /></button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4 mb-8">
            {isYoutubeTrack || !albumArt ? (
                <GradientArt id={currentTrack.spotifyId} className="w-full max-w-xs aspect-square rounded-lg shadow-2xl" />
            ) : (
                <img src={albumArt} alt={currentTrack.name} className="w-full max-w-xs aspect-square rounded-lg shadow-2xl object-cover"/>
            )}
          </div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold truncate text-text-primary">{currentTrack.name}</h1>
              <p className="text-lg text-text-secondary truncate">{currentTrack.artist}</p>
            </div>
            <button onClick={() => toggleLike(currentTrack)} className={`p-2 ${isLiked(currentTrack.spotifyId) ? 'text-accent' : 'text-text-secondary'}`}>
              <Heart size={24} fill={isLiked(currentTrack.spotifyId) ? 'currentColor' : 'none'} />
            </button>
          </div>
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={duration || 1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-text-primary"
            />
            <div className="flex justify-between text-xs text-text-secondary mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          <div className="flex items-center justify-evenly text-text-primary mb-4">
            <button onClick={toggleShuffle} className={`p-2 transition-colors ${isShuffled ? 'text-accent' : 'text-text-secondary'}`}>
                <Shuffle size={20} />
            </button>
            <button onClick={previousTrack} className="p-2"><SkipBack size={32} fill="currentColor" /></button>
            <button onClick={togglePlayPause} className="w-16 h-16 bg-text-primary text-primary rounded-full flex items-center justify-center">
              {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>
            <button onClick={nextTrack} className="p-2"><SkipForward size={32} fill="currentColor" /></button>
            <button onClick={cycleRepeatMode} className={`p-2 transition-colors ${repeatMode !== 'off' ? 'text-accent' : 'text-text-secondary'}`}>
                <RepeatIcon size={20} />
            </button>
          </div>
          <div className="flex items-center gap-3 px-2">
            <VolumeIcon size={20} className="text-text-secondary"/>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-text-primary"
            />
          </div>
        </div>
      )}
    </>
  );
};