const express = require('express');
const { search, getArtist, getArtistTopTracks, getArtistAlbums, getAlbum } = require('../services/spotify');
const router = express.Router();

// Search tracks and artists
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    console.log(`[Spotify Router] Searching for: "${q}"`);
    const results = await search(q, ['track', 'artist'], parseInt(limit));
    const responseData = {
        tracks: (results.tracks?.items || []).map(item => ({
            spotifyId: item.id,
            name: item.name,
            artist: item.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
            albumName: item.album?.name || 'Unknown Album',
            duration_ms: item.duration_ms,
            preview_url: item.preview_url,
            imageUrl: item.album?.images?.[0]?.url || null
        })),
        artists: (results.artists?.items || []).map(item => ({
            spotifyId: item.id,
            name: item.name,
            imageUrl: item.images?.[0]?.url || null,
            popularity: item.popularity
        }))
    };
    res.json(responseData);
  } catch (error) {
    console.error('❌ Spotify search route error:', error.message);
    res.status(500).json({ error: 'Search failed', message: error.message });
  }
});

router.get('/artist/:id', async (req, res) => {
    try {
        const artist = await getArtist(req.params.id);
        res.json({
            spotifyId: artist.id,
            name: artist.name,
            imageUrl: artist.images?.[0]?.url || null,
            popularity: artist.popularity,
            genres: artist.genres
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get artist details', message: error.message });
    }
});

// Get artist top tracks
router.get('/artist/:id/top-tracks', async (req, res) => {
    try {
        const tracks = await getArtistTopTracks(req.params.id);
        res.json(tracks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get artist top tracks', message: error.message });
    }
});

// Get artist albums
router.get('/artist/:id/albums', async (req, res) => {
    try {
        const albums = await getArtistAlbums(req.params.id);
        res.json(albums);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get artist albums', message: error.message });
    }
});

// Get album details
router.get('/album/:id', async (req, res) => {
    try {
        const album = await getAlbum(req.params.id);
        res.json(album);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get album details', message: error.message });
    }
});

module.exports = router;