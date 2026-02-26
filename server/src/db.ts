import { MemoryDatabase } from "./db-memory";

// Helper to determine environment
const isBun = typeof Bun !== "undefined";

let db: any;

if (isBun) {
  try {
    // Dynamic import to avoid node failure, though Bun handles static fine.
    // But for portability, we use require-like behavior if possible or just rely on Bun global.
    const { Database } = require("bun:sqlite");
    db = new Database("shop.sqlite");
  } catch (e) {
    console.warn("Failed to load bun:sqlite, falling back to memory db");
    db = new MemoryDatabase();
  }
} else {
  // Node.js / Vercel environment
  db = new MemoryDatabase();
}

// Initialize tables
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user'
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    price REAL,
    stock INTEGER,
    category TEXT,
    specs TEXT, -- JSON
    images TEXT, -- JSON
    model_url TEXT,
    doc_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    items TEXT, -- JSON array of {productId, quantity, price, etc.}
    total_price REAL,
    status TEXT DEFAULT 'pending',
    contact_info TEXT, -- JSON {name, phone, address}
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Seed admin user if not exists
const admin = db.query("SELECT * FROM users WHERE username = 'admin'").get();
if (!admin) {
  db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ["admin", "admin123", "admin"]);
}

// Seed initial product if not exists
const product = db.query("SELECT * FROM products LIMIT 1").get();
if (!product) {
  db.run(`
    INSERT INTO products (name, description, price, stock, category, specs, images, model_url, doc_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    "AH-GB01-4080D-L50-8",
    "工业铝型材 4080D",
    88.00,
    100,
    "profile",
    JSON.stringify({
      material: "Aluminium 6063-T5",
      length: 6000,
      weight: "3.5kg/m"
    }),
    JSON.stringify(["https://picsum.photos/600/600?random=1"]),
    "/AH-GB01-4080D-L50-8.stl",
    "/document.pdf"
  ]);
}

export default db;
