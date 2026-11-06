import { createDemoDatabase, DEMO_USER_ID, type DemoDatabase, type Row } from './data'
import { DEMO_EMAIL, DEMO_PASSWORD, loadDemoData, saveDemoData } from './mode'

/**
 * Stands in for Supabase while a guest is signed in. Every client request is
 * answered here from sample data in the browser, so guests never reach the real
 * database. It covers only the REST, auth and function calls this app makes.
 */

const UNIQUE_COLUMNS: Record<string, string[]> = {
  inventory_categories: ['name'],
  inventory_items: ['sku'],
  employees: ['employee_id'],
  hardware_assets: ['serial_number'],
  purchase_requests: ['request_number'],
}
const INTEGER_COLUMNS: Record<string, string[]> = {
  inventory_items: ['quantity', 'min_stock_threshold'],
  inventory_transactions: ['quantity', 'previous_stock', 'updated_stock'],
  purchase_request_items: ['quantity'],
}
// Rows removed along with their parent, mirroring ON DELETE CASCADE in the migrations.
const CASCADES: Record<string, [string, string][]> = {
  employees: [['asset_assignments', 'employee_id']],
  hardware_assets: [['asset_assignments', 'asset_id'], ['asset_history', 'asset_id']],
  inventory_items: [['inventory_transactions', 'item_id']],
  purchase_requests: [['purchase_request_items', 'request_id']],
  ai_conversations: [['ai_messages', 'conversation_id']],
}
// alias -> [table, foreign key, whether the key lives on the current row]
const RELATIONS: Record<string, [string, string, boolean]> = {
  category: ['inventory_categories', 'category_id', true],
  employee: ['employees', 'employee_id', true],
  purchase_request_items: ['purchase_request_items', 'request_id', false],
  asset_assignments: ['asset_assignments', 'asset_id', false],
}
const QUERY_OPTIONS = new Set(['select', 'order', 'limit', 'offset', 'columns'])
const NOT_AVAILABLE = 'This is not available in guest mode. Sign up to use it.'

const user = {
  id: DEMO_USER_ID,
  aud: 'authenticated',
  role: 'authenticated',
  email: DEMO_EMAIL,
  app_metadata: { provider: 'demo' },
  user_metadata: { full_name: 'Guest User' },
  created_at: '2026-01-01T00:00:00Z',
}

function encode(value: object): string {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function createSession() {
  const expires_at = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
  return {
    access_token: `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: DEMO_USER_ID, exp: expires_at, role: 'authenticated' })}.demo`,
    refresh_token: 'demo',
    token_type: 'bearer',
    expires_in: 60 * 60 * 24 * 7,
    expires_at,
    user,
  }
}

function json(status: number, body?: unknown, headers: Record<string, string> = {}): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

function readDatabase(): DemoDatabase {
  const saved = loadDemoData()
  return saved ? (JSON.parse(saved) as DemoDatabase) : createDemoDatabase()
}

function splitTopLevel(value: string): string[] {
  const parts: string[] = []
  let depth = 0
  let quoted = false
  let escaped = false
  let current = ''
  for (const char of value) {
    if (escaped) { current += char; escaped = false; continue }
    if (quoted && char === '\\') { current += char; escaped = true; continue }
    if (char === '"') quoted = !quoted
    if (!quoted && char === '(') depth++
    if (!quoted && char === ')') depth--
    if (char === ',' && depth === 0 && !quoted) { parts.push(current); current = '' } else current += char
  }
  if (current) parts.push(current)
  return parts
}

function matchesPattern(value: unknown, rawPattern: string): boolean {
  if (value === null || value === undefined) return false
  const pattern = rawPattern.startsWith('"') ? rawPattern.slice(1, -1).replace(/\\(.)/g, '$1') : rawPattern
  const source = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*')
  return new RegExp(`^${source}$`, 'i').test(String(value))
}

function matchesFilter(row: Row, column: string, filter: string): boolean {
  const dot = filter.indexOf('.')
  const operator = filter.slice(0, dot)
  const operand = filter.slice(dot + 1)
  if (operator === 'eq') return String(row[column]) === operand
  if (operator === 'neq') return String(row[column]) !== operand
  if (operator === 'like' || operator === 'ilike') return matchesPattern(row[column], operand)
  if (operator === 'in') {
    return operand.slice(1, -1).split(',').map((v) => v.replace(/^"|"$/g, '')).includes(String(row[column]))
  }
  return true
}

function matchesQuery(row: Row, query: URLSearchParams): boolean {
  for (const [key, value] of query) {
    if (QUERY_OPTIONS.has(key)) continue
    if (key === 'or') {
      const anyMatch = splitTopLevel(value.slice(1, -1)).some((part) => {
        const dot = part.indexOf('.')
        return matchesFilter(row, part.slice(0, dot), part.slice(dot + 1))
      })
      if (!anyMatch) return false
    } else if (!matchesFilter(row, key, value)) {
      return false
    }
  }
  return true
}

function selectColumns(db: DemoDatabase, row: Row, selection: string): Row {
  const output: Row = {}
  for (const rawField of splitTopLevel(selection)) {
    const field = rawField.trim()
    const embedded = field.match(/^(?:([a-z_]+):)?([a-z_]+)\((.*)\)$/)
    if (embedded) {
      const alias = embedded[1] || embedded[2]
      const table = embedded[2]
      const relation = RELATIONS[alias] || RELATIONS[table]
      if (relation?.[2]) {
        const related = db[table].find((candidate) => candidate.id === row[relation[1]])
        output[alias] = related ? selectColumns(db, related, embedded[3]) : null
      } else if (relation) {
        output[alias] = db[table]
          .filter((candidate) => candidate[relation[1]] === row.id)
          .map((candidate) => selectColumns(db, candidate, embedded[3]))
      }
    } else if (field === '*') {
      Object.assign(output, row)
    } else {
      output[field] = row[field]
    }
  }
  return output
}

function findConstraintError(table: string, rows: Row[], candidate: Row, self?: Row): Response | null {
  for (const column of INTEGER_COLUMNS[table] || []) {
    const value = candidate[column]
    if (value === null || value === undefined) continue
    if (!Number.isInteger(Number(value))) {
      return json(400, { code: '22P02', message: `invalid input syntax for type integer: "${value}"` })
    }
    if (Number(value) < 0) return json(400, { code: '23514', message: 'Value cannot be negative.' })
  }
  for (const column of UNIQUE_COLUMNS[table] || []) {
    const value = candidate[column]
    if (value !== null && value !== undefined && rows.some((row) => row !== self && row[column] === value)) {
      return json(409, { code: '23505', message: `duplicate key value violates unique constraint "${table}_${column}_key"` })
    }
  }
  return null
}

function handleRest(db: DemoDatabase, request: Request, body: string, url: URL): Response {
  const table = url.pathname.split('/').pop() || ''
  const rows = db[table]
  if (!rows) return json(404, { code: 'PGRST205', message: `Unknown table ${table}` })

  const query = url.searchParams
  const selection = query.get('select') || '*'
  const wantsSingle = (request.headers.get('accept') || '').includes('vnd.pgrst.object')
  const wantsRows = (request.headers.get('prefer') || '').includes('return=representation')

  const respond = (status: number, affected: Row[]) => {
    if (!wantsRows) return json(204)
    const output = affected.map((row) => selectColumns(db, row, selection))
    if (!wantsSingle) return json(status, output)
    return output.length === 1 ? json(status, output[0]) : json(406, { code: 'PGRST116', message: 'Expected one row' })
  }

  if (request.method === 'GET' || request.method === 'HEAD') {
    let found = rows.filter((row) => matchesQuery(row, query))
    const total = found.length
    for (const part of (query.get('order') || '').split(',').filter(Boolean).reverse()) {
      const [column, direction] = part.split('.')
      const sign = direction === 'desc' ? -1 : 1
      found = [...found].sort((a, b) => {
        const left = String(a[column] ?? '')
        const right = String(b[column] ?? '')
        return left === right ? 0 : (left > right ? 1 : -1) * sign
      })
    }
    const offset = Number(query.get('offset') || 0)
    const limit = query.has('limit') ? Number(query.get('limit')) : found.length
    found = found.slice(offset, offset + limit)
    const range = { 'content-range': `${offset}-${Math.max(offset + found.length - 1, 0)}/${total}` }
    if (request.method === 'HEAD') return new Response(null, { status: 200, headers: range })
    const output = found.map((row) => selectColumns(db, row, selection))
    if (!wantsSingle) return json(200, output, range)
    return output.length === 1 ? json(200, output[0], range) : json(406, { code: 'PGRST116', message: 'Expected one row' })
  }

  if (request.method === 'POST') {
    const created: Row[] = []
    for (const fields of [JSON.parse(body)].flat() as Row[]) {
      const now = new Date().toISOString()
      const row: Row = { id: crypto.randomUUID(), created_at: now, updated_at: now, ...fields }
      const failure = findConstraintError(table, rows, row)
      if (failure) return failure
      rows.push(row)
      created.push(row)
    }
    return respond(201, created)
  }

  if (request.method === 'PATCH') {
    const changes = JSON.parse(body) as Row
    const found = rows.filter((row) => matchesQuery(row, query))
    for (const row of found) {
      const failure = findConstraintError(table, rows, { ...row, ...changes }, row)
      if (failure) return failure
      Object.assign(row, changes, { updated_at: new Date().toISOString() })
    }
    return respond(200, found)
  }

  if (request.method === 'DELETE') {
    const found = rows.filter((row) => matchesQuery(row, query))
    if (table === 'inventory_categories' && found.some((row) => db.inventory_items.some((item) => item.category_id === row.id))) {
      return json(409, { code: '23503', message: 'update or delete on table "inventory_categories" violates foreign key constraint' })
    }
    const ids = found.map((row) => row.id)
    db[table] = rows.filter((row) => !found.includes(row))
    for (const [child, key] of CASCADES[table] || []) {
      db[child] = db[child].filter((row) => !ids.includes(row[key]))
    }
    return respond(200, found)
  }

  return json(405, { message: 'Method not allowed' })
}

function handleAuth(path: string, request: Request, body: string, url: URL): Response {
  if (path === 'token') {
    if (url.searchParams.get('grant_type') === 'refresh_token') return json(200, createSession())
    const credentials = JSON.parse(body) as { email?: string; password?: string }
    return credentials.email === DEMO_EMAIL && credentials.password === DEMO_PASSWORD
      ? json(200, createSession())
      : json(400, { error_code: 'invalid_credentials', msg: 'Invalid login credentials' })
  }
  if (path === 'user' && request.method === 'GET') return json(200, user)
  if (path === 'logout') return json(204)
  return json(403, { error_code: 'demo_mode', msg: NOT_AVAILABLE })
}

export async function demoFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = new Request(input, init)
  const url = new URL(request.url)
  const path = url.pathname

  if (path.startsWith('/auth/v1/')) {
    return handleAuth(path.slice('/auth/v1/'.length), request, await request.text(), url)
  }
  if (path.startsWith('/storage/')) return json(403, { statusCode: '403', error: 'demo_mode', message: NOT_AVAILABLE })

  const db = readDatabase()
  const body = await request.text()
  let response: Response
  if (path.startsWith('/functions/v1/')) {
    const { conversation_id } = JSON.parse(body) as { conversation_id: string }
    const answer = 'This is a sample answer. Ask AI is not connected to real data in guest mode.'
    const now = new Date().toISOString()
    db.ai_messages.push({ id: crypto.randomUUID(), conversation_id, role: 'assistant', content: answer, created_at: now })
    response = json(200, { answer })
  } else if (path.startsWith('/rest/v1/')) {
    response = handleRest(db, request, body, url)
  } else {
    return json(404, { message: 'Not found' })
  }
  saveDemoData(JSON.stringify(db))
  return response
}
