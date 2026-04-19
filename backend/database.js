const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'szpiczek.db'));

// Tabela rezerwacji
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    pharmacy TEXT NOT NULL,
    service TEXT NOT NULL,
    vaccine TEXT,
    test TEXT,
    exam TEXT,
    medications TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    source TEXT DEFAULT 'online',
    cancelToken TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  )
`);

// Tabela zablokowanych slotów
db.exec(`
  CREATE TABLE IF NOT EXISTS blocked_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pharmacy TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    reason TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  )
`);

// Tabela użytkowników (login apteki)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pharmacy TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )
`);
try {
  db.exec(`ALTER TABLE bookings ADD COLUMN cancelToken TEXT`);
} catch (e) {
  // Kolumna już istnieje
}
console.log('✅ Baza danych SQLite gotowa');

module.exports = db;