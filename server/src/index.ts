import { Hono } from 'hono'
import type { Context } from 'hono'
import { cors } from 'hono/cors'
import { sign, verify } from 'hono/jwt'
import db from './db'

const app = new Hono()
const api = new Hono()
const SECRET = 'super-secret-key' // In prod, use env var

app.use('/*', cors())

// Static files are served by Vercel/Nginx directly from public/ folder
// For local Bun development, run `bun run dev` which should handle static assets or use a separate static server.

const registerRoutes = (router: Hono) => {
  // Auth Routes
  router.post('/login', async (c) => {
    const { username, password } = await c.req.json()
    const user = db.query('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password) as any

    if (user) {
      const token = await sign({ id: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, SECRET)
      return c.json({ token, user: { id: user.id, username: user.username, role: user.role } })
    }
    return c.json({ error: 'Invalid credentials' }, 401)
  })

  router.post('/register', async (c) => {
    const { username, password } = await c.req.json()
    try {
      const result = db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, password, 'user'])
      const user = { id: result.lastInsertRowid, username, role: 'user' }
      const token = await sign({ id: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, SECRET)
      return c.json({ token, user })
    } catch (e) {
      return c.json({ error: 'Username already exists' }, 400)
    }
  })

  // Middleware for admin auth
  const adminAuth = async (c: Context, next: () => Promise<void>) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader) return c.json({ error: 'Unauthorized' }, 401)

    const token = authHeader.split(' ')[1]
    try {
      const payload = await verify(token, SECRET, 'HS256')
      if (payload.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)
      c.set('user', payload)
      await next()
    } catch (e) {
      return c.json({ error: 'Invalid token' }, 401)
    }
  }

  // Product Routes
  router.get('/products', (c) => {
    const products = db.query('SELECT * FROM products').all()
    // Parse JSON fields
    const result = products.map((p: any) => ({
      ...p,
      specs: JSON.parse(p.specs || '{}'),
      images: JSON.parse(p.images || '[]')
    }))
    return c.json(result)
  })

  router.get('/products/:id', (c) => {
    const id = c.req.param('id')
    const product: any = db.query('SELECT * FROM products WHERE id = ?').get(id)
    if (!product) return c.json({ error: 'Not found' }, 404)
    return c.json({
      ...product,
      specs: JSON.parse(product.specs || '{}'),
      images: JSON.parse(product.images || '[]')
    })
  })

  router.post('/products', adminAuth, async (c) => {
    const body = await c.req.json()
    const { name, description, price, stock, category, specs, images, model_url, doc_url } = body

    const result = db.run(
      `
    INSERT INTO products (name, description, price, stock, category, specs, images, model_url, doc_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
      [name, description, price, stock, category, JSON.stringify(specs), JSON.stringify(images), model_url, doc_url]
    )

    return c.json({ id: result.lastInsertRowid, ...body })
  })

  router.put('/products/:id', adminAuth, async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { name, description, price, stock, category, specs, images, model_url, doc_url } = body

    db.run(
      `
    UPDATE products SET name=?, description=?, price=?, stock=?, category=?, specs=?, images=?, model_url=?, doc_url=?
    WHERE id=?
  `,
      [name, description, price, stock, category, JSON.stringify(specs), JSON.stringify(images), model_url, doc_url, id]
    )

    return c.json({ id, ...body })
  })

  router.delete('/products/:id', adminAuth, (c) => {
    const id = c.req.param('id')
    db.run('DELETE FROM products WHERE id = ?', [id])
    return c.json({ success: true })
  })

  // Order Routes
  router.get('/orders', adminAuth, (c) => {
    const orders = db.query('SELECT * FROM orders ORDER BY created_at DESC').all()
    const result = orders.map((o: any) => ({
      ...o,
      items: JSON.parse(o.items || '[]'),
      contact_info: JSON.parse(o.contact_info || '{}')
    }))
    return c.json(result)
  })

  router.post('/orders', async (c) => {
    const body = await c.req.json()
    const { items, contact_info, user_id } = body

    // Calculate total price from db to be safe (simplified here)
    let total = 0
    // In real app, fetch prices from DB. Here trusting client for demo or assume items have price.
    // Let's assume items have price.
    if (items && Array.isArray(items)) {
      total = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
    }

    const result = db.run(
      `
      INSERT INTO orders (user_id, items, total_price, status, contact_info)
      VALUES (?, ?, ?, ?, ?)
    `,
      [user_id || null, JSON.stringify(items), total, 'pending', JSON.stringify(contact_info)]
    )

    return c.json({ id: result.lastInsertRowid, status: 'pending', total_price: total })
  })

  router.get('/my-orders', async (c) => {
    // Simple "my orders" for demo, maybe pass user_id in query or header if not fully auth
    // If we have token:
    const authHeader = c.req.header('Authorization')
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1]
        const payload = await verify(token, SECRET, 'HS256')
        const orders = db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(payload.id)
        return c.json(orders.map((o: any) => ({ ...o, items: JSON.parse(o.items), contact_info: JSON.parse(o.contact_info) })))
      } catch (e) {}
    }
    return c.json([])
  })
}

registerRoutes(api)
app.route('/api', api)
app.route('/', api)

export default app
