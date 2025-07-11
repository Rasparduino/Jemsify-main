const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const downloadsDbPath = path.join(__dirname, '..', 'downloads.json');

const readDownloadsDB = () => {
    if (!fs.existsSync(downloadsDbPath)) return { downloads: {} };
    try {
        const data = fs.readFileSync(downloadsDbPath, 'utf-8');
        return data ? JSON.parse(data) : { downloads: {} };
    } catch (e) {
        console.error("Error reading downloads DB:", e);
        return { downloads: {} };
    }
};

const writeDownloadsDB = (data) => {
    try {
        fs.writeFileSync(downloadsDbPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error("Error writing to downloads DB:", e);
    }
};

const activeDownloads = new Map();

async function downloadTrack(spotifyTrack) {
    const downloadId = `dl_${Date.now()}_${uuidv4().substring(0, 8)}`;
    const downloadsDir = process.env.DOWNLOADS_DIR || './downloads';
    
    // --- FIX: Differentiate search query logic ---
    let searchQuery;
    if (spotifyTrack.artist === 'YouTube Search') {
        // Direct search, use query as-is
        searchQuery = spotifyTrack.name;
    } else {
        // Spotify track, be more specific
        searchQuery = `${spotifyTrack.name} ${spotifyTrack.artist} lyrics`;
    }
    
    const outputTemplate = path.join(downloadsDir, `${downloadId}.%(ext)s`);

    const db = readDownloadsDB();
    db.downloads[downloadId] = {
        downloadId,
        spotifyId: spotifyTrack.id,
        name: spotifyTrack.name,
        artist: spotifyTrack.artist,
        imageUrl: spotifyTrack.imageUrl,
        status: 'queued',
        progress: 0,
        startTime: new Date().toISOString(),
        outputPath: null,
        error: null,
    };
    writeDownloadsDB(db);

    startYtDlpDownload(downloadId, searchQuery, outputTemplate);
    return { downloadId, status: 'queued', spotifyId: spotifyTrack.id };
}

function startYtDlpDownload(downloadId, searchQuery, outputTemplate) {
    const db = readDownloadsDB();
    db.downloads[downloadId].status = 'downloading';
    writeDownloadsDB(db);

    console.log(`[yt-dlp] Searching for: "${searchQuery}"`);
    
    const args = [
        '--no-playlist',
        '--audio-quality','0',
        '--format', 'bestaudio[ext=m4a]/bestaudio/best',
        '--output', outputTemplate,
        '--no-warnings',
        `ytsearch1:"${searchQuery}"`,
    ];

    const ytdlp = spawn('yt-dlp', args);
    activeDownloads.set(downloadId, ytdlp);

    ytdlp.on('close', (code) => {
        activeDownloads.delete(downloadId);
        const finalDb = readDownloadsDB();
        const downloadInfo = finalDb.downloads[downloadId];

        if (!downloadInfo) return; 

        if (code === 0) {
            const expectedPath = path.join(process.env.DOWNLOADS_DIR || './downloads', `${downloadId}.m4a`);
            
            if (fs.existsSync(expectedPath)) {
                console.log(`✅ Download successful. Updating DB for ${downloadId}.`);
                downloadInfo.status = 'completed';
                downloadInfo.outputPath = expectedPath;
                downloadInfo.completedTime = new Date().toISOString();
            } else {
                console.error(`❌ yt-dlp exited successfully, but file not found at ${expectedPath}`);
                downloadInfo.status = 'failed';
                downloadInfo.error = 'File not found after successful download.';
            }
        } else {
            console.error(`❌ Download failed for ${downloadId} with exit code ${code}.`);
            downloadInfo.status = 'failed';
            downloadInfo.error = `yt-dlp exited with code ${code}. Check server logs for stderr.`;
        }
        
        writeDownloadsDB(finalDb);
    });

    ytdlp.stderr.on('data', (data) => {
        console.error(`[yt-dlp-stderr] for ${downloadId}: ${data.toString().trim()}`);
    });

    ytdlp.on('error', (error) => {
        activeDownloads.delete(downloadId);
        const finalDb = readDownloadsDB();
        if (finalDb.downloads[downloadId]) {
            finalDb.downloads[downloadId].status = 'failed';
            finalDb.downloads[downloadId].error = `Failed to start yt-dlp: ${error.message}`;
            writeDownloadsDB(finalDb);
        }
    });
}

async function getCompletedDownloads() {
    const db = readDownloadsDB();
    if (!db.downloads) return [];
    return Object.values(db.downloads).filter(d => d.status === 'completed');
}

async function getDownloadStatus(downloadId) {
    const db = readDownloadsDB();
    return db.downloads[downloadId] || null;
}

async function getAllTrackStatuses() {
    const db = readDownloadsDB();
    if (!db.downloads) return [];
    return Object.values(db.downloads);
}

async function cancelDownload(downloadId) {
    const process = activeDownloads.get(downloadId);
    if (process) {
        process.kill('SIGTERM');
        activeDownloads.delete(downloadId);
        const db = readDownloadsDB();
        if (db.downloads[downloadId]) {
            db.downloads[downloadId].status = 'cancelled';
            writeDownloadsDB(db);
        }
        return true;
    }
    return false;
}

module.exports = {
  downloadTrack,
  getDownloadStatus,
  getCompletedDownloads,
  cancelDownload,
  getAllTrackStatuses,
};