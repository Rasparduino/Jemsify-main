import React from 'react';
import { DownloadCloud, Loader, ArrowDownToLine } from 'lucide-react';
import { useServer } from '../context/ServerContext';
import { Track } from '../context/SpotifyContext';

interface DownloadButtonProps {
  track: Track;
}

/**
 * A smart button that handles the three states of a track:
 * 1. Not Downloaded: Shows a cloud icon to download TO the server.
 * 2. Downloading: Shows a loading spinner.
 * 3. Downloaded: Shows a direct download icon to save the file TO the user's device.
 */
export const DownloadButton: React.FC<DownloadButtonProps> = ({ track }) => {
  const { 
    isDownloading, 
    isTrackDownloaded, 
    downloadTrack, 
    streamTrack 
  } = useServer();

  const isCurrentlyDownloading = isDownloading(track.spotifyId);
  const downloadedTrack = isTrackDownloaded(track.spotifyId);
  
  // Sanitize the track name to create a valid filename for the download.
  const sanitizedFilename = `${track.name} - ${track.artist}`
    .replace(/[<>:"/\\|?*]/g, '_') // Replace characters that are invalid in filenames.
    .replace(/\s+/g, ' ')         // Condense multiple spaces to a single space.
    .trim() + '.m4a';             // Add the file extension.

  // State 1: The track is currently being downloaded to the server.
  if (isCurrentlyDownloading) {
    return (
      <div className="p-2 text-accent" title="Downloading to server...">
        <Loader size={22} className="animate-spin" />
      </div>
    );
  }

  // State 2: The track is already on the server and ready for download to the device.
  if (downloadedTrack && downloadedTrack.downloadId) {
    return (
      <a
        href={streamTrack(downloadedTrack.downloadId)}
        download={sanitizedFilename}
        onClick={(e) => e.stopPropagation()} // Prevent click from triggering other track actions.
        title="Download to your device"
        className="p-2 rounded-full text-green-400 hover:text-green-300 transition-colors"
      >
        <ArrowDownToLine size={22} />
      </a>
    );
  }

  // State 3: The track is not on the server.
  return (
    <button
      onClick={(e) => {
        e.stopPropagation(); // Prevent click from triggering other track actions.
        downloadTrack({
          id: track.spotifyId,
          name: track.name,
          artist: track.artist,
          imageUrl: track.imageUrl,
          duration_ms: track.duration_ms,
        });
      }}
      title="Download to server"
      className="p-2 rounded-full text-text-secondary hover:text-accent transition-colors"
    >
      <DownloadCloud size={22} />
    </button>
  );
};
