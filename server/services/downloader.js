const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const downloadsDbPath = path.join(__dirname, '..', 'downloads.json');
// --- THIS IS THE FIX ---
// Corrected the mismatched quotes. It now correctly uses single quotes.
const cookiesPath = '/mnt/musync/cookies.txt';

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
    
    const db = readDownloadsDB();
    db.downloads[downloadId] = {
        downloadId, spotifyId: spotifyTrack.id, name: spotifyTrack.name, artist: spotifyTrack.artist,
        imageUrl: spotifyTrack.imageUrl, duration_ms: spotifyTrack.duration_ms, status: 'queued',
        progress: 0, startTime: new Date().toISOString(), outputPath: null, error: null,
    };
    writeDownloadsDB(db);

    runDownloadAttempt(downloadId, spotifyTrack, false);
    return { downloadId, status: 'queued', spotifyId: spotifyTrack.id };
}

function runDownloadAttempt(downloadId, spotifyTrack, isFallback) {
    const db = readDownloadsDB();
    db.downloads[downloadId].status = 'downloading';
    writeDownloadsDB(db);

    const downloadsDir = process.env.DOWNLOADS_DIR || './downloads';
    const outputTemplate = path.join(downloadsDir, `${downloadId}.%(ext)s`);

    let searchQuery, filterArgs = [];
    if (spotifyTrack.artist === 'YouTube Search') {
        searchQuery = spotifyTrack.name;
    } else if (isFallback) {
        searchQuery = `${spotifyTrack.name} ${spotifyTrack.artist}`;
    } else {
        searchQuery = `"${spotifyTrack.name} - ${spotifyTrack.artist} official audio"`;
        if (spotifyTrack.duration_ms) {
            const durationInSeconds = spotifyTrack.duration_ms / 1000;
            const tolerance = 15;
            filterArgs.push('--match-filter', `duration > ${durationInSeconds - tolerance} & duration < ${durationInSeconds + tolerance}`);
        }
    }

    const baseArgs = [
        '--no-playlist', '--audio-quality', '0', '--format', 'bestaudio[ext=m4a]/bestaudio/best',
        '--output', outputTemplate, '--retries', '3', '--no-mtime', '--add-metadata',
        `ytsearch1:"${searchQuery}"`,
    ];

    if (fs.existsSync(cookiesPath)) {
        baseArgs.unshift('--cookies', cookiesPath);
        console.log(`[yt-dlp] Using cookies file at: ${cookiesPath}`);
    } else {
        console.warn(`[yt-dlp] WARNING: Cookies file not found at ${cookiesPath}. Downloads may fail.`);
    }

    const ytdlp = spawn('yt-dlp', [...baseArgs, ...filterArgs]);
    activeDownloads.set(downloadId, ytdlp);

    ytdlp.on('close', (code) => {
        activeDownloads.delete(downloadId);
        const finalDb = readDownloadsDB();
        const downloadInfo = finalDb.downloads[downloadId];
        if (!downloadInfo) return;

        if (code === 0) {
            const possibleExtensions = ['m4a', 'opus', 'webm', 'mp3'];
            let foundPath = '';
            for (const ext of possibleExtensions) {
                const testPath = path.join(downloadsDir, `${downloadId}.${ext}`);
                if (fs.existsSync(testPath)) {
                    foundPath = testPath;
                    break;
                }
            }

            if (foundPath) {
                const finalPath = path.join(downloadsDir, `${downloadId}.m4a`);
                if (foundPath !== finalPath) {
                    try {
                        fs.renameSync(foundPath, finalPath);
                    } catch(renameError) {
                        console.error(`Failed to rename ${foundPath} to ${finalPath}`, renameError);
                        handleFailure(downloadInfo.downloadId, spotifyTrack, `Failed to standardize file name.`, isFallback);
                        return;
                    }
                }
                console.log(`✅ Download successful for ${downloadId}`);
                downloadInfo.status = 'completed';
                downloadInfo.outputPath = finalPath;
                downloadInfo.completedTime = new Date().toISOString();
                writeDownloadsDB(finalDb);
            } else {
                 handleFailure(downloadInfo.downloadId, spotifyTrack, 'File not found after successful download process.', isFallback);
            }
        } else {
            handleFailure(downloadInfo.downloadId, spotifyTrack, `yt-dlp exited with code ${code}.`, isFallback);
        }
    });
    
    ytdlp.stderr.on('data', data => console.error(`[yt-dlp-stderr] ${downloadId}: ${data.toString().trim()}`));
    ytdlp.on('error', error => handleFailure(downloadId, spotifyTrack, `Failed to start yt-dlp: ${error.message}`, isFallback));
}

function handleFailure(downloadId, spotifyTrack, errorMessage, wasFallback) {
    console.error(`❌ Attempt failed for ${downloadId}: ${errorMessage}`);
    if (!wasFallback && spotifyTrack.artist !== 'YouTube Search') {
        console.log(`- Retrying with fallback search for ${downloadId}`);
        runDownloadAttempt(downloadId, spotifyTrack, true);
    } else {
        console.error(`❌ Fallback also failed for ${downloadId}. Marking as failed.`);
        const db = readDownloadsDB();
        if (db.downloads[downloadId]) {
            db.downloads[downloadId].status = 'failed';
            db.downloads[downloadId].error = errorMessage;
            writeDownloadsDB(db);
        }
    }
}

async function getCompletedDownloads() {
    const db = readDownloadsDB();
    return Object.values(db.downloads || {}).filter(d => d.status === 'completed');
}
async function getDownloadStatus(downloadId) {
    const db = readDownloadsDB();
    return db.downloads[downloadId] || null;
}
async function getAllTrackStatuses() {
    const db = readDownloadsDB();
    return Object.values(db.downloads || {});
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
  downloadTrack, getDownloadStatus, getCompletedDownloads,
  cancelDownload, getAllTrackStatuses,
};
