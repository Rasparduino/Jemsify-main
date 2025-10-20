const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db.json');

// Function to read the database file
const readDB = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    // If file is empty, it's not valid JSON, so we start with an empty object.
    const dbData = data ? JSON.parse(data) : {};
    
    // --- FIX: Ensure the basic structure is always present ---
    // If 'users' key doesn't exist, create an empty array.
    if (!dbData.users) {
      dbData.users = [];
    }
    // If 'playlists' key doesn't exist, create an empty array.
    if (!dbData.playlists) {
      dbData.playlists = [];
    }
    
    return dbData;
  } catch (error) {
    console.error("Could not read or parse database file.", error);
    // Return a default structure if file is empty or corrupt
    return { users: [], playlists: [] };
  }
};

// Function to write to the database file
const writeDB = (data) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Could not write to database file.", error);
  }
};

module.exports = { readDB, writeDB };
