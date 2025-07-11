const axios = require('axios');

let accessToken = null;
let tokenExpiry = null;

// Attach functions directly to the exports object
exports.getAccessToken = async function() {
  if (accessToken && tokenExpiry && new Date() < tokenExpiry) {
    return accessToken;
  }
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Spotify API credentials not configured in .env file');
  }

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', 'grant_type=client_credentials', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      }
    });
    accessToken = response.data.access_token;
    tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000) - 60000);
    console.log('🎵 Spotify access token obtained');
    return accessToken;
  } catch (error) {
    console.error('❌ Failed to get Spotify access token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Spotify API');
  }
}

exports.search = async function(query, types = ['track', 'artist'], limit = 20) {
    const token = await exports.getAccessToken();
    try {
        const response = await axios.get('https://api.spotify.com/v1/search', {
            params: { q: query, type: types.join(','), limit, market: 'US' },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('❌ Spotify search error:', error.response?.data || error.message);
        throw new Error('Failed to search on Spotify');
    }
}

exports.getArtist = async function(artistId) {
    const token = await exports.getAccessToken();
    try {
        const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('❌ Spotify get artist error:', error.response?.data || error.message);
        throw new Error('Failed to get artist from Spotify');
    }
}

exports.getArtistTopTracks = async function(artistId) {
    const token = await exports.getAccessToken();
    try {
        const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks`, {
            params: { market: 'US' },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data.tracks;
    } catch (error) {
        console.error('❌ Spotify get artist top tracks error:', error.response?.data || error.message);
        throw new Error('Failed to get artist top tracks from Spotify');
    }
}

exports.getArtistAlbums = async function(artistId, limit = 50) {
    const token = await exports.getAccessToken();
    try {
        const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/albums`, {
            params: { include_groups: 'album,single', limit, market: 'US' },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data.items;
    } catch (error) {
        console.error('❌ Spotify get artist albums error:', error.response?.data || error.message);
        throw new Error('Failed to get artist albums from Spotify');
    }
}

exports.getAlbum = async function(albumId) {
    const token = await exports.getAccessToken();
    try {
        const response = await axios.get(`https://api.spotify.com/v1/albums/${albumId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('❌ Spotify get album error:', error.response?.data || error.message);
        throw new Error('Failed to get album from Spotify');
    }
}