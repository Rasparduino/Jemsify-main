const fs = require('fs');
const path = require('path');

async function getCacheInfo() {
  const downloadsDir = process.env.DOWNLOADS_DIR || './downloads';
  
  if (!fs.existsSync(downloadsDir)) {
    return {
      totalFiles: 0,
      totalSize: 0,
      availableSpace: 0,
      maxCacheSize: parseInt(process.env.MAX_CACHE_SIZE) || 5368709120 // 5GB default
    };
  }

  const files = fs.readdirSync(downloadsDir);
  const audioFiles = files.filter(file => /\.(m4a|mp3|webm|ogg)$/.test(file));
  
  let totalSize = 0;
  const fileDetails = [];

  for (const file of audioFiles) {
    const filePath = path.join(downloadsDir, file);
    const stats = fs.statSync(filePath);
    totalSize += stats.size;
    
    fileDetails.push({
      name: file,
      size: stats.size,
      created: stats.birthtime,
      accessed: stats.atime
    });
  }

  const maxCacheSize = parseInt(process.env.MAX_CACHE_SIZE) || 5368709120;
  
  return {
    totalFiles: audioFiles.length,
    totalSize,
    availableSpace: maxCacheSize - totalSize,
    maxCacheSize,
    files: fileDetails.sort((a, b) => b.created - a.created)
  };
}

async function clearCache() {
  const downloadsDir = process.env.DOWNLOADS_DIR || './downloads';
  
  if (!fs.existsSync(downloadsDir)) {
    return { deletedFiles: 0, freedSpace: 0 };
  }

  const files = fs.readdirSync(downloadsDir);
  const audioFiles = files.filter(file => /\.(m4a|mp3|webm|ogg)$/.test(file));
  
  let deletedFiles = 0;
  let freedSpace = 0;

  for (const file of audioFiles) {
    const filePath = path.join(downloadsDir, file);
    try {
      const stats = fs.statSync(filePath);
      fs.unlinkSync(filePath);
      deletedFiles++;
      freedSpace += stats.size;
      console.log(`🗑️ Deleted: ${file}`);
    } catch (error) {
      console.error(`❌ Failed to delete ${file}:`, error.message);
    }
  }

  console.log(`🧹 Cache cleared: ${deletedFiles} files, ${Math.round(freedSpace / 1024 / 1024)} MB freed`);
  
  return { deletedFiles, freedSpace };
}

async function deleteTrack(downloadId) {
  const downloadsDir = process.env.DOWNLOADS_DIR || './downloads';
  const extensions = ['m4a', 'mp3', 'webm', 'ogg'];
  
  for (const ext of extensions) {
    const filePath = path.join(downloadsDir, `${downloadId}.${ext}`);
    if (fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath);
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted track: ${downloadId}.${ext}`);
        return { success: true, freedSpace: stats.size };
      } catch (error) {
        console.error(`❌ Failed to delete ${downloadId}.${ext}:`, error.message);
        return { success: false, error: error.message };
      }
    }
  }
  
  return { success: false, error: 'File not found' };
}

module.exports = {
  getCacheInfo,
  clearCache,
  deleteTrack
};