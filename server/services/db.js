const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db.json');

// Function to read the database file
const readDB = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Could not read database file.", error);
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