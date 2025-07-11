export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  duration_ms: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  tracks: {
    total: number;
    items: Array<{
      track: SpotifyTrack;
    }>;
  };
}

export interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
}

export interface DownloadedTrack {
  id: string;
  spotifyId: string;
  filePath: string;
  audioUrl: string;
  downloadedAt: Date;
  quality: 'high' | 'medium' | 'low';
}