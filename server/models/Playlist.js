const mongoose = require('mongoose');

const TrackSchema = new mongoose.Schema({
  spotifyId: { type: String, required: true },
  name: { type: String, required: true },
  artist: { type: String, required: true },
  albumName: { type: String },
  imageUrl: { type: String },
  duration_ms: { type: Number },
  downloadId: { type: String } // Links to the physical file
});

const PlaylistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tracks: [TrackSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Playlist = mongoose.model('Playlist', PlaylistSchema);
module.exports = Playlist;