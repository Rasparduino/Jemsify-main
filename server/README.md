# Spotify Clone Server

Backend server for the Spotify Clone mobile app with yt-dlp integration for downloading and streaming music.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Python 3.6+
- yt-dlp

### Installation

1. **Install Node.js dependencies:**
```bash
npm install
```

2. **Install yt-dlp:**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install python3-pip
pip3 install yt-dlp

# macOS
brew install yt-dlp

# Windows
# Download from: https://github.com/yt-dlp/yt-dlp/releases
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your Spotify API credentials
```

4. **Start the server:**
```bash
npm run dev
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Spotify API Credentials (Required)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# File Storage
DOWNLOADS_DIR=./downloads
MAX_CACHE_SIZE=5368709120  # 5GB in bytes
CLEANUP_INTERVAL=24        # Hours

# CORS Settings
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Audio Quality
DEFAULT_AUDIO_QUALITY=bestaudio[ext=m4a]/bestaudio
MAX_CONCURRENT_DOWNLOADS=3
```

### Spotify API Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Note your Client ID and Client Secret
4. Add them to your `.env` file

## 📡 API Endpoints

### Download Endpoints

- `POST /api/download` - Start downloading a track
- `GET /api/download/status/:downloadId` - Get download status
- `DELETE /api/download/:downloadId` - Cancel download

### Streaming Endpoints

- `GET /api/stream/:downloadId` - Stream audio file

### Cache Management

- `GET /api/cache` - Get cache information
- `GET /api/cache/tracks` - List cached tracks
- `DELETE /api/cache/tracks/:downloadId` - Delete specific track
- `DELETE /api/cache` - Clear entire cache

### Spotify Integration

- `GET /api/spotify/search?q=query` - Search tracks
- `GET /api/spotify/track/:trackId` - Get track details
- `GET /api/spotify/test` - Test API connection

### Health Check

- `GET /api/health` - Server health status

## 🎵 How It Works

1. **Search**: Frontend searches Spotify API for tracks
2. **Download Request**: User requests download of a track
3. **YouTube Search**: Server searches YouTube for matching audio
4. **Download**: yt-dlp downloads best quality audio
5. **Cache**: Audio file is stored locally
6. **Stream**: Frontend streams audio from server

## 🗂️ Project Structure

```
server/
├── server.js              # Main server file
├── routes/                 # API route handlers
│   ├── download.js         # Download management
│   ├── stream.js           # Audio streaming
│   ├── cache.js            # Cache management
│   └── spotify.js          # Spotify API integration
├── services/               # Business logic
│   ├── downloader.js       # yt-dlp integration
│   ├── spotify.js          # Spotify API client
│   ├── cache.js            # Cache utilities
│   └── cleanup.js          # File cleanup
├── utils/                  # Utility functions
│   └── validation.js       # Input validation
├── downloads/              # Downloaded audio files
└── logs/                   # Server logs
```

## 🔒 Security Features

- Input validation for all endpoints
- CORS protection
- File path sanitization
- Rate limiting (recommended for production)
- Error handling and logging

## 📊 Monitoring

### Logs
- Server logs all download requests
- Error logging for failed downloads
- Cache management operations

### Cache Management
- Automatic cleanup of old files
- Size-based cache eviction
- Manual cache clearing endpoints

## 🚀 Production Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start server.js --name spotify-clone-server
pm2 startup
pm2 save
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache python3 py3-pip
RUN pip3 install yt-dlp
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Setup
- Ensure yt-dlp is installed and accessible
- Configure firewall for port 3001
- Set up reverse proxy (nginx recommended)
- Configure SSL certificates
- Set up log rotation

## 🛠️ Troubleshooting

### Common Issues

1. **yt-dlp not found**
   - Ensure yt-dlp is installed: `yt-dlp --version`
   - Check PATH environment variable

2. **Spotify API errors**
   - Verify credentials in `.env`
   - Test connection: `GET /api/spotify/test`

3. **Download failures**
   - Check yt-dlp logs in server console
   - Verify search query format
   - Check available disk space

4. **Streaming issues**
   - Verify file exists in downloads directory
   - Check file permissions
   - Test with different audio formats

### Debug Mode
```bash
NODE_ENV=development npm run dev
```

## 📄 Legal Notice

This server is for educational and personal use only. Ensure compliance with:
- YouTube Terms of Service
- Spotify Terms of Service  
- Local copyright laws
- Fair use guidelines

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is for educational purposes only. Not for commercial use.