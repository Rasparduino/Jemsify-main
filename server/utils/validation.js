function validateSpotifyTrack(track) {
  const errors = [];

  if (!track) {
    errors.push('Track object is required');
    return { isValid: false, errors };
  }

  if (!track.id || typeof track.id !== 'string') {
    errors.push('Track ID is required and must be a string');
  }

  if (!track.name || typeof track.name !== 'string') {
    errors.push('Track name is required and must be a string');
  }

  if (!track.artist || typeof track.artist !== 'string') {
    errors.push('Track artist is required and must be a string');
  }

  // Optional fields validation
  if (track.album && typeof track.album !== 'string') {
    errors.push('Track album must be a string if provided');
  }

  if (track.duration && (typeof track.duration !== 'number' || track.duration <= 0)) {
    errors.push('Track duration must be a positive number if provided');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateDownloadId(downloadId) {
  if (!downloadId || typeof downloadId !== 'string') {
    return { isValid: false, error: 'Download ID is required and must be a string' };
  }

  if (!/^dl_\d+_[a-f0-9-]+$/i.test(downloadId)) {
    return { isValid: false, error: 'Invalid download ID format' };
  }

  return { isValid: true };
}

function sanitizeFilename(filename) {
  // Remove or replace characters that are problematic in filenames
  return filename
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 200); // Limit length
}

function validateSearchQuery(query) {
  if (!query || typeof query !== 'string') {
    return { isValid: false, error: 'Search query is required and must be a string' };
  }

  if (query.trim().length < 2) {
    return { isValid: false, error: 'Search query must be at least 2 characters long' };
  }

  if (query.length > 200) {
    return { isValid: false, error: 'Search query must be less than 200 characters' };
  }

  return { isValid: true };
}

module.exports = {
  validateSpotifyTrack,
  validateDownloadId,
  sanitizeFilename,
  validateSearchQuery
};