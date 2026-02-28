import path from 'path'
import fs from 'fs'
import Database from 'better-sqlite3'
import { sql } from '@vercel/postgres'

const sqlitePath = process.env.SQLITE_PATH || path.resolve(process.cwd(), 'shop.sqlite')

if (!fs.existsSync(sqlitePath)) {
  console.error(`SQLite file not found at: ${sqlitePath}`)
  process.exit(1)
}

const sqlite = new Database(sqlitePath, { readonly: true })

const users = sqlite.prepare('SELECT * FROM users').all()
const products = sqlite.prepare('SELECT * FROM products').all()
const orders = sqlite.prepare('SELECT * FROM orders').all()

const createTables = async () => {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'user'
    )
  `)

  await sql.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT,
      description TEXT,
      price REAL,
      stock INTEGER,
      category TEXT,
      specs TEXT,
      images TEXT,
      model_url TEXT,
      doc_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await sql.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      items TEXT,
      total_price REAL,
      status TEXT DEFAULT 'pending',
      contact_info TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
}

const resetIfRequested = async () => {
  if (process.env.RESET_EXISTING === '1') {
    await sql.query('TRUNCATE TABLE orders, products, users RESTART IDENTITY CASCADE')
  }
}

const migrateUsers = async () => {
  for (const user of users) {
    await sql.query(
      `
      INSERT INTO users (id, username, password, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        password = EXCLUDED.password,
        role = EXCLUDED.role
    `,
      [user.id, user.username, user.password, user.role]
    )
  }
}

const migrateProducts = async () => {
  for (const product of products) {
    await sql.query(
      `
      INSERT INTO products (id, name, description, price, stock, category, specs, images, model_url, doc_url, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        stock = EXCLUDED.stock,
        category = EXCLUDED.category,
        specs = EXCLUDED.specs,
        images = EXCLUDED.images,
        model_url = EXCLUDED.model_url,
        doc_url = EXCLUDED.doc_url,
        created_at = EXCLUDED.created_at
    `,
      [
        product.id,
        product.name,
        product.description,
        product.price,
        product.stock,
        product.category,
        product.specs,
        product.images,
        product.model_url,
        product.doc_url,
        product.created_at
      ]
    )
  }
}

const migrateOrders = async () => {
  for (const order of orders) {
    await sql.query(
      `
      INSERT INTO orders (id, user_id, items, total_price, status, contact_info, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        items = EXCLUDED.items,
        total_price = EXCLUDED.total_price,
        status = EXCLUDED.status,
        contact_info = EXCLUDED.contact_info,
        created_at = EXCLUDED.created_at
    `,
      [order.id, order.user_id, order.items, order.total_price, order.status, order.contact_info, order.created_at]
    )
  }
}

const syncSequences = async () => {
  await sql.query("SELECT setval(pg_get_serial_sequence('users','id'), COALESCE(MAX(id), 1)) FROM users")
  await sql.query("SELECT setval(pg_get_serial_sequence('products','id'), COALESCE(MAX(id), 1)) FROM products")
  await sql.query("SELECT setval(pg_get_serial_sequence('orders','id'), COALESCE(MAX(id), 1)) FROM orders")
}

const run = async () => {
  console.log(`Using SQLite: ${sqlitePath}`)
  await createTables()
  await resetIfRequested()

  await sql.query('BEGIN')
  try {
    await migrateUsers()
    await migrateProducts()
    await migrateOrders()
    await syncSequences()
    await sql.query('COMMIT')
    console.log('Migration complete.')
  } catch (error) {
    await sql.query('ROLLBACK')
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

run()
