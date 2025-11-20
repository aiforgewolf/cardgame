const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    // Use environment variable for database path, or default to backend directory
    const dbDir = process.env.DB_PATH || __dirname;

    // Ensure directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const dbPath = path.join(dbDir, 'elementforge.db');
    console.log(`Using database at: ${dbPath}`);

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
        this.initializeTables();
      }
    });
  }

  initializeTables() {
    this.db.serialize(() => {
      // Users table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE,
          password_hash TEXT NOT NULL,
          is_guest BOOLEAN DEFAULT 0,
          gold INTEGER DEFAULT 100,
          crystals INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Cards table - Master card definitions
      this.db.run(`
        CREATE TABLE IF NOT EXISTS cards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          type TEXT NOT NULL,
          element TEXT NOT NULL,
          attack INTEGER,
          defense INTEGER,
          energy_cost INTEGER NOT NULL,
          rarity TEXT NOT NULL,
          ability TEXT,
          description TEXT,
          is_craftable BOOLEAN DEFAULT 0,
          craft_recipe TEXT,
          gold_price INTEGER
        )
      `);

      // User cards - Cards owned by users
      this.db.run(`
        CREATE TABLE IF NOT EXISTS user_cards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          card_id INTEGER NOT NULL,
          quantity INTEGER DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (card_id) REFERENCES cards(id),
          UNIQUE(user_id, card_id)
        )
      `);

      // Decks
      this.db.run(`
        CREATE TABLE IF NOT EXISTS decks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Deck cards
      this.db.run(`
        CREATE TABLE IF NOT EXISTS deck_cards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          deck_id INTEGER NOT NULL,
          card_id INTEGER NOT NULL,
          quantity INTEGER DEFAULT 1,
          FOREIGN KEY (deck_id) REFERENCES decks(id),
          FOREIGN KEY (card_id) REFERENCES cards(id)
        )
      `);

      // Game history
      this.db.run(`
        CREATE TABLE IF NOT EXISTS game_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player1_id INTEGER NOT NULL,
          player2_id INTEGER NOT NULL,
          winner_id INTEGER,
          victory_type TEXT,
          turns_played INTEGER,
          played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (player1_id) REFERENCES users(id),
          FOREIGN KEY (player2_id) REFERENCES users(id),
          FOREIGN KEY (winner_id) REFERENCES users(id)
        )
      `);

      // Crafting recipes table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS crafting_recipes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          card_id INTEGER NOT NULL,
          fire_essence INTEGER DEFAULT 0,
          water_essence INTEGER DEFAULT 0,
          earth_essence INTEGER DEFAULT 0,
          air_essence INTEGER DEFAULT 0,
          void_essence INTEGER DEFAULT 0,
          FOREIGN KEY (card_id) REFERENCES cards(id)
        )
      `);

      console.log('Database tables initialized');
    });
  }

  // Helper method to run queries with promises
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  // Helper method to get single row
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Helper method to get all rows
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = new Database();
