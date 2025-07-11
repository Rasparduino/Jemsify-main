# Mobile Spotify Clone

A mobile-first Spotify clone that demonstrates how to build a music streaming app with server-side audio downloading and caching.

## ⚠️ Educational Purpose Only

This project is for **educational and personal use only**. It demonstrates:
- Mobile-responsive web app development
- Progressive Web App (PWA) implementation
- Audio streaming architecture
- Server-side download management
- Real-time UI updates

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Mobile-first design** - Optimized for phone screens
- **PWA capabilities** - Can be installed like a native app
- **Real-time updates** - Download progress and status
- **Audio streaming** - Seamless playback from server

### Backend Server (Node.js + yt-dlp)
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Mobile App    │───▶│   Your Server    │───▶│    YouTube      │
│                 │    │                  │    │                 │
│ • Search UI     │    │ • Spotify API    │    │ • Audio Source  │
│ • Audio Player  │    │ • yt-dlp         │    │                 │
│ • Download UI   │    │ • File Cache     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Features

### Current Implementation
- 📱 **Mobile-optimized interface** - Native app feel
- 🔍 **Spotify API integration** - Real search and metadata
- 📥 **Download management** - Queue and progress tracking
- 🎵 **Audio streaming** - From cached files
- 💾 **Offline support** - PWA with service worker
- 🎨 **Beautiful UI** - Spotify-inspired design

### Server Features (To Implement)
- 🔍 **YouTube search** - Find matching audio
- 📥 **yt-dlp integration** - High-quality downloads
- 💾 **File caching** - Efficient storage management
- 🎵 **Audio streaming** - Range request support
- 📊 **Download queue** - Background processing

## 🛠️ Setup Instructions

### 1. Frontend Setup
```bash
npm install
npm run dev
```

### 2. Server Setup (Separate Repository)
Create a Node.js server with these endpoints:

```javascript
// Required endpoints
POST /api/download     // Queue track for download
GET  /api/stream/:id   // Stream audio file
GET  /api/status/:id   // Download progress
GET  /api/cache        // List cached tracks
```

### 3. Install yt-dlp
```bash
# Install yt-dlp on your server
pip install yt-dlp
```

## 📱 Mobile Features

### PWA Installation
- Add to home screen on iOS/Android
- Offline functionality
- Native app experience

### Touch Optimizations
- Swipe gestures
- Touch-friendly controls
- Mobile keyboard support
- Responsive design

## 🔧 Technical Implementation

### Download Flow
1. **User searches** → Spotify API returns metadata
2. **User taps download** → Request sent to server
3. **Server searches YouTube** → Finds matching audio
4. **yt-dlp downloads** → High-quality audio file
5. **Server caches file** → Ready for streaming
6. **App streams audio** → From server cache

### Audio Streaming
```javascript
// Client requests stream
const audioUrl = `/api/stream/${downloadId}`;
audioElement.src = audioUrl;

// Server handles range requests
app.get('/api/stream/:id', (req, res) => {
  // Support seeking with HTTP range requests
  const range = req.headers.range;
  // Stream file with proper headers
});
```

## 📋 Server Implementation Guide

### Required Dependencies
```json
{
  "express": "^4.18.0",
  "cors": "^2.8.5",
  "multer": "^1.4.5",
  "node-cron": "^3.0.2"
}
```

### Key Server Files
```
server/
├── app.js              # Express server
├── routes/
│   ├── download.js     # Download endpoints
│   ├── stream.js       # Streaming endpoints
│   └── cache.js        # Cache management
├── services/
│   ├── spotify.js      # Spotify API client
│   ├── youtube.js      # YouTube search
│   └── downloader.js   # yt-dlp wrapper
└── utils/
    ├── cache.js        # File cache utilities
    └── queue.js        # Download queue
```

## 🎵 Audio Quality

The server downloads the best available audio quality:
- **Format**: M4A/MP4 (best compatibility)
- **Quality**: Up to 320kbps
- **Fallback**: Automatic quality selection

## 📊 Cache Management

- **Automatic cleanup** - Remove old files
- **Size limits** - Configurable storage limits
- **Smart caching** - Keep frequently played tracks

## 🔒 Legal Considerations

This is an **educational project** demonstrating:
- Modern web app architecture
- Audio streaming techniques
- Mobile-first development
- PWA implementation

For production use:
- Use Spotify Web Playback SDK
- Implement proper licensing
- Follow platform terms of service

## 🚀 Deployment

### Frontend (Netlify/Vercel)
```bash
npm run build
# Deploy dist/ folder
```

### Server (VPS/Cloud)
```bash
# Install Node.js and yt-dlp
# Clone server repository
# Configure environment variables
# Start with PM2 or similar
```

## 📱 Mobile Testing

Test on real devices:
- iOS Safari
- Android Chrome
- PWA installation
- Offline functionality

## 🎯 Next Steps

1. **Implement server** - Set up download/streaming backend
2. **Add Spotify auth** - Real user authentication
3. **Enhance UI** - More animations and interactions
4. **Optimize performance** - Lazy loading, caching
5. **Add features** - Playlists, favorites, sharing

## 📄 License

Educational use only. Not for commercial distribution.