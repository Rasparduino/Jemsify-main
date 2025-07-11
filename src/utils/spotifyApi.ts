// Spotify Web API integration
class SpotifyAPI {
  private accessToken: string | null = null;
  private clientId: string = process.env.REACT_APP_SPOTIFY_CLIENT_ID || '';
  private clientSecret: string = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET || '';

  async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    return this.accessToken;
  }

  async search(query: string, type: 'track' | 'artist' | 'album' = 'track') {
    const token = await this.getAccessToken();
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=20`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    return response.json();
  }

  async getTrack(id: string) {
    const token = await this.getAccessToken();
    const response = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.json();
  }

  async getPlaylist(id: string) {
    const token = await this.getAccessToken();
    const response = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.json();
  }
}

export const spotifyApi = new SpotifyAPI();