// Server API endpoints for handling downloads and streaming
// This would be implemented on your Node.js/Express server

export interface ServerAPI {
  // Search and download endpoints
  searchAndDownload: (spotifyTrack: any) => Promise<DownloadResult>;
  getDownloadStatus: (downloadId: string) => Promise<DownloadStatus>;
  streamAudio: (downloadId: string) => Promise<ReadableStream>;
  
  // Cache management
  getCachedTracks: () => Promise<CachedTrack[]>;
  deleteCachedTrack: (downloadId: string) => Promise<boolean>;
  clearCache: () => Promise<boolean>;
}

interface DownloadResult {
  id: string;
  status: 'queued' | 'downloading' | 'completed' | 'failed';
  filePath?: string;
  streamUrl?: string;
  error?: string;
}

interface DownloadStatus {
  id: string;
  progress: number; // 0-1
  status: 'queued' | 'downloading' | 'completed' | 'failed';
  eta?: number; // seconds
}

interface CachedTrack {
  id: string;
  spotifyId: string;
  title: string;
  artist: string;
  filePath: string;
  fileSize: number;
  downloadedAt: Date;
  quality: string;
}

// Example server implementation (pseudo-code):
/*
// server.js
const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const DOWNLOADS_DIR = './downloads';

// Ensure downloads directory exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// Download endpoint
app.post('/api/download', async (req, res) => {
  const { spotifyTrack } = req.body;
  const searchQuery = `${spotifyTrack.name} ${spotifyTrack.artist}`;
  const downloadId = `dl_${Date.now()}_${spotifyTrack.id}`;
  const outputPath = path.join(DOWNLOADS_DIR, `${downloadId}.%(ext)s`);
  
  // Use yt-dlp to search and download
  const ytdlpCommand = [
    'yt-dlp',
    '--extract-flat',
    '--no-playlist',
    '--format', 'bestaudio[ext=m4a]/bestaudio',
    '--output', outputPath,
    `ytsearch1:"${searchQuery}"`
  ].join(' ');
  
  exec(ytdlpCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('Download failed:', error);
      return res.status(500).json({ error: 'Download failed' });
    }
    
    res.json({
      id: downloadId,
      status: 'completed',
      streamUrl: `/api/stream/${downloadId}`
    });
  });
});

// Streaming endpoint
app.get('/api/stream/:downloadId', (req, res) => {
  const { downloadId } = req.params;
  const filePath = path.join(DOWNLOADS_DIR, `${downloadId}.m4a`);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;
  
  if (range) {
    // Support range requests for audio seeking
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/mp4',
    };
    
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mp4',
    };
    
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
*/

// Client-side API wrapper
class ServerAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  async downloadTrack(spotifyTrack: any): Promise<DownloadResult> {
    const response = await fetch(`${this.baseUrl}/api/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spotifyTrack })
    });
    
    return response.json();
  }

  async getDownloadStatus(downloadId: string): Promise<DownloadStatus> {
    const response = await fetch(`${this.baseUrl}/api/status/${downloadId}`);
    return response.json();
  }

  getStreamUrl(downloadId: string): string {
    return `${this.baseUrl}/api/stream/${downloadId}`;
  }

  async getCachedTracks(): Promise<CachedTrack[]> {
    const response = await fetch(`${this.baseUrl}/api/cache`);
    return response.json();
  }
}

export const serverAPI = new ServerAPIClient();