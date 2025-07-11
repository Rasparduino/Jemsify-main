const fs = require('fs');
const path = require('path');

async function cleanupOldFiles() {
  console.log('🧹 File cleanup by age is disabled. No files will be removed.');
  return;
}

async function enforceMaxCacheSize() {
  console.log('📊 Max cache size enforcement is disabled. No files will be removed.');
  return;
}

module.exports = {
  cleanupOldFiles,
  enforceMaxCacheSize
};