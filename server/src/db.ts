import { sql } from '@vercel/postgres'
import { MemoryDatabase } from './db-memory.js'

const hasPostgres = Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL)

const convertPlaceholders = (statement: string) => {
  let index = 0
  return statement.replace(/\?/g, () => `$${++index}`)
}

const createPostgresAdapter = () => {
  const runQuery = async (statement: string, params: any[] = []) => {
    const converted = convertPlaceholders(statement)
    return sql.query(converted, params)
  }

  return {
    ready: Promise.resolve(),
    query: (statement: string) => ({
      get: async (...params: any[]) => {
        const result = await runQuery(statement, params)
        return result.rows[0] ?? null
      },
      all: async (...params: any[]) => {
        const result = await runQuery(statement, params)
        return result.rows
      }
    }),
    run: async (statement: string, params: any[] = []) => {
      let sqlText = statement
      const isInsert = /^\s*INSERT\s+INTO/i.test(statement)
      const hasReturning = /\bRETURNING\b/i.test(statement)

      if (isInsert && !hasReturning) {
        sqlText = `${statement.trim()} RETURNING id`
      }

      const result = await runQuery(sqlText, params)
      const lastInsertRowid = isInsert ? (result.rows?.[0]?.id ?? 0) : 0

      return {
        lastInsertRowid,
        changes: result.rowCount ?? 0
      }
    }
  }
}

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

const seedData = async () => {
  const admin = await sql.query("SELECT * FROM users WHERE username = 'admin'")
  if (!admin.rows[0]) {
    await sql.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', ['admin', 'admin123', 'admin'])
  }

  const product = await sql.query('SELECT * FROM products LIMIT 1')
  if (!product.rows[0]) {
    await sql.query(
      `
      INSERT INTO products (name, description, price, stock, category, specs, images, model_url, doc_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
      [
        'AH-GB01-4080D-L50-8',
        '工业铝型材 4080D',
        88.0,
        100,
        'profile',
        JSON.stringify({
          material: 'Aluminium 6063-T5',
          length: 6000,
          weight: '3.5kg/m'
        }),
        JSON.stringify(['https://picsum.photos/600/600?random=1']),
        '/AH-GB01-4080D-L50-8.stl',
        '/document.pdf'
      ]
    )
  }
}

let db: any

if (hasPostgres) {
  db = createPostgresAdapter()
  db.ready = (async () => {
    await createTables()
    await seedData()
  })()
} else {
  console.warn('POSTGRES_URL not set, falling back to in-memory database')
  db = new MemoryDatabase()
  db.ready = Promise.resolve()
}

export default db
