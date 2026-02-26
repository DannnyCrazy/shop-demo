class MemoryStatement {
  db: MemoryDatabase
  queryStr: string
  params: any[]

  constructor(db: MemoryDatabase, queryStr: string) {
    this.db = db
    this.queryStr = queryStr
    this.params = []
  }

  all(...params: any[]) {
    return this.db._execute(this.queryStr, params, 'all')
  }

  get(...params: any[]) {
    return this.db._execute(this.queryStr, params, 'get')
  }

  run(...params: any[]) {
    return this.db._execute(this.queryStr, params, 'run')
  }
}

export class MemoryDatabase {
  data: Record<string, any[]> = {}

  constructor(filename?: string) {
    console.log('Initializing In-Memory Database...')
  }

  query(sql: string) {
    return new MemoryStatement(this, sql)
  }

  prepare(sql: string) {
    return new MemoryStatement(this, sql)
  }

  run(sql: string, params: any[] = []) {
    return this._execute(sql, params, 'run')
  }

  _execute(sql: string, params: any[], mode: 'all' | 'get' | 'run') {
    const normalize = (s: string) => s.trim().replace(/\s+/g, ' ')
    const q = normalize(sql)

    // Very basic SQL parser for Demo purposes
    if (q.toUpperCase().startsWith('CREATE TABLE')) {
      const match = q.match(/CREATE TABLE IF NOT EXISTS (\w+)/i)
      if (match) {
        const table = match[1]
        if (!this.data[table]) this.data[table] = []
      }
      return { lastInsertRowid: 0 }
    }

    if (q.toUpperCase().startsWith('INSERT INTO')) {
      const match = q.match(/INSERT INTO (\w+) \((.*?)\) VALUES \((.*?)\)/i)
      if (match) {
        const table = match[1]
        const cols = match[2].split(',').map((s) => s.trim())
        // Handle basic params substitution
        const row: any = {}
        cols.forEach((col, i) => {
          row[col] = params[i]
        })

        // Auto-increment ID simulation
        if (!this.data[table]) this.data[table] = []
        const id = this.data[table].length + 1
        row.id = id
        row.created_at = new Date().toISOString() // Default for demo

        this.data[table].push(row)
        return { lastInsertRowid: id }
      }
    }

    if (q.toUpperCase().startsWith('SELECT')) {
      const match = q.match(/SELECT \* FROM (\w+)(.*)/i)
      if (match) {
        const table = match[1]
        const rest = match[2]
        let rows = this.data[table] || []

        // Basic WHERE clause (id=?, username=?)
        if (rest.includes('WHERE')) {
          if (rest.includes('username = ? AND password = ?')) {
            rows = rows.filter((r) => r.username === params[0] && r.password === params[1])
          } else if (rest.includes('id = ?')) {
            rows = rows.filter((r) => r.id == params[0]) // Loose equality for string/number
          } else if (rest.includes('user_id = ?')) {
            rows = rows.filter((r) => r.user_id == params[0])
          } else if (rest.includes("username = 'admin'")) {
            rows = rows.filter((r) => r.username === 'admin')
          } else if (rest.includes('LIMIT 1')) {
            rows = rows.slice(0, 1)
          }
        }

        if (rest.includes('ORDER BY created_at DESC')) {
          rows = [...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        }

        if (mode === 'get') return rows[0] || null
        return rows
      }
    }

    if (q.toUpperCase().startsWith('UPDATE')) {
      // Simple update support for demo (products)
      const match = q.match(/UPDATE (\w+) SET (.*?) WHERE id=\?/i)
      if (match) {
        const table = match[1]
        const id = params[params.length - 1]
        const row = this.data[table].find((r) => r.id == id)
        if (row) {
          // Assuming params match the SET clause order
          // This is fragile but works for the specific queries in index.ts
          const setClause = match[2]
          // "name=?, description=?, ..."
          const fields = setClause.split(',').map((s) => s.split('=')[0].trim())
          fields.forEach((f, i) => {
            row[f] = params[i]
          })
        }
        return { changes: 1 }
      }
    }

    if (q.toUpperCase().startsWith('DELETE')) {
      const match = q.match(/DELETE FROM (\w+) WHERE id = \?/i)
      if (match) {
        const table = match[1]
        const id = params[0]
        const idx = this.data[table].findIndex((r) => r.id == id)
        if (idx !== -1) {
          this.data[table].splice(idx, 1)
        }
        return { changes: 1 }
      }
    }

    return { lastInsertRowid: 0, changes: 0 }
  }
}
