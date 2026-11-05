import 'dotenv/config'
import express from 'express'
import mysql from 'mysql2/promise'
import { promisify } from 'node:util'
import {
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto'

const app = express()
const port = Number(process.env.API_PORT || 3001)
const scrypt = promisify(scryptCallback)
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 40628),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'apex_race_control',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
})
const sessions = new Map()
const sessionDurationMs = 12 * 60 * 60 * 1000
const sessionCookie = 'apex_session'

const resources = {
  teams: 'teams',
  vehicles: 'vehicles',
  drivers: 'drivers',
  circuits: 'circuits',
  championships: 'championships',
  events: 'events',
  standings: 'standings',
  teamStandings: 'team_standings',
}

app.use(express.json({ limit: '5mb' }))

function parseData(value) {
  return typeof value === 'string' ? JSON.parse(value) : value
}

const requiredFields = {
  teams: { strings: ['name', 'shortName'] },
  vehicles: { strings: ['make', 'model'], numbers: ['number'] },
  drivers: { strings: ['firstName', 'lastName'], numbers: ['number'] },
  circuits: { strings: ['name', 'city'] },
  championships: { strings: ['name'], numbers: ['season'] },
  events: { strings: ['name', 'date'], numbers: ['round'] },
  standings: { strings: ['driverId'], numbers: ['position'] },
  teamStandings: { strings: ['teamId'], numbers: ['position'] },
}

function validateRecord(resource, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 'El registro debe ser un objeto JSON.'
  }
  if (value.id !== undefined && (typeof value.id !== 'string' || value.id.length > 64)) {
    return 'El campo id debe ser texto de hasta 64 caracteres.'
  }
  const required = requiredFields[resource]
  for (const field of required.strings) {
    if (typeof value[field] !== 'string' || !value[field].trim()) {
      return `El campo ${field} es obligatorio.`
    }
  }
  for (const field of required.numbers || []) {
    if (typeof value[field] !== 'number' || !Number.isFinite(value[field]) || value[field] <= 0) {
      return `El campo ${field} debe ser un número mayor que cero.`
    }
  }
  return null
}

app.get('/api/health', async (_request, response, next) => {
  try {
    await pool.query('SELECT 1')
    response.json({ status: 'ok' })
  } catch (error) {
    next(error)
  }
})

function safeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    driverId: user.driver_id ?? user.driverId ?? null,
    initials: user.name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase(),
  }
}

async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = await scrypt(password, salt, 64)
  return { salt, hash: hash.toString('hex') }
}

function readSession(request) {
  const token = request.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookie}=`))
    ?.slice(sessionCookie.length + 1)
  if (!token) return null

  const session = sessions.get(token)
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(token)
    return null
  }
  return { token, ...session }
}

function setSessionCookie(response, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.setHeader(
    'Set-Cookie',
    `${sessionCookie}=${token}; HttpOnly; SameSite=Lax; Path=/api; Max-Age=${sessionDurationMs / 1000}${secure}`,
  )
}

function startSession(response, user) {
  const token = randomBytes(32).toString('hex')
  sessions.set(token, { user: safeUser(user), expiresAt: Date.now() + sessionDurationMs })
  setSessionCookie(response, token)
  return safeUser(user)
}

app.post('/api/auth/register', async (request, response, next) => {
  const name = typeof request.body.name === 'string' ? request.body.name.trim() : ''
  const email = typeof request.body.email === 'string' ? request.body.email.trim().toLowerCase() : ''
  const password = typeof request.body.password === 'string' ? request.body.password : ''
  if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return response.status(400).json({ error: 'Ingresa un nombre y un correo válidos.' })
  }
  if (password.length < 8 || password.length > 128) {
    return response.status(400).json({ error: 'La contraseña debe tener entre 8 y 128 caracteres.' })
  }

  try {
    const { salt, hash } = await hashPassword(password)
    const user = { id: randomUUID(), name, email, role: 'public' }
    await pool.execute(
      'INSERT INTO auth_users (id, name, email, password_salt, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, user.name, user.email, salt, hash, user.role],
    )
    response.status(201).json({ user: startSession(response, user) })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return response.status(409).json({ error: 'Ya existe una cuenta con ese correo.' })
    }
    next(error)
  }
})

app.post('/api/auth/login', async (request, response, next) => {
  const email = typeof request.body.email === 'string' ? request.body.email.trim().toLowerCase() : ''
  const password = typeof request.body.password === 'string' ? request.body.password : ''
  if (!email || !password || password.length > 128) {
    return response.status(400).json({ error: 'Correo o contraseña incorrectos.' })
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, password_salt, password_hash, role, driver_id FROM auth_users WHERE email = ? LIMIT 1',
      [email],
    )
    const user = rows[0]
    if (!user) return response.status(401).json({ error: 'Correo o contraseña incorrectos.' })

    const { hash } = await hashPassword(password, user.password_salt)
    const actualHash = Buffer.from(hash, 'hex')
    const storedHash = Buffer.from(user.password_hash, 'hex')
    if (actualHash.length !== storedHash.length || !timingSafeEqual(actualHash, storedHash)) {
      return response.status(401).json({ error: 'Correo o contraseña incorrectos.' })
    }

    response.json({ user: startSession(response, user) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/auth/session', (request, response) => {
  const session = readSession(request)
  if (!session) return response.status(401).json({ error: 'No hay una sesión activa.' })
  response.json({ user: session.user })
})

app.post('/api/auth/logout', (request, response) => {
  const session = readSession(request)
  if (session) sessions.delete(session.token)
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.setHeader('Set-Cookie', `${sessionCookie}=; HttpOnly; SameSite=Lax; Path=/api; Max-Age=0${secure}`)
  response.status(204).end()
})

app.use('/api', (request, response, next) => {
  const session = readSession(request)
  if (!session) return response.status(401).json({ error: 'Inicia sesión para continuar.' })
  request.user = session.user
  next()
})

function requireOrganizer(request, response, next) {
  if (request.user?.role !== 'organizer') {
    return response.status(403).json({ error: 'Solo el organizador puede modificar los datos.' })
  }
  next()
}

app.get('/api/auth/users', requireOrganizer, async (_request, response, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, driver_id FROM auth_users ORDER BY created_at DESC',
    )
    response.json(rows.map(safeUser))
  } catch (error) {
    next(error)
  }
})

app.patch('/api/auth/users/:id', requireOrganizer, async (request, response, next) => {
  const { role } = request.body
  const driverId = typeof request.body.driverId === 'string' ? request.body.driverId : null
  const allowedRoles = ['organizer', 'director', 'steward', 'timekeeper', 'pilot', 'press', 'public']
  if (!allowedRoles.includes(role)) {
    return response.status(400).json({ error: 'El rol seleccionado no es válido.' })
  }
  if (role === 'pilot' && !driverId) {
    return response.status(400).json({ error: 'Selecciona el piloto asociado a esta cuenta.' })
  }

  try {
    if (role === 'pilot') {
      const [drivers] = await pool.execute('SELECT id FROM drivers WHERE id = ? LIMIT 1', [driverId])
      if (!drivers.length) return response.status(400).json({ error: 'El piloto seleccionado no existe en la base de datos.' })
    }

    const [result] = await pool.execute(
      'UPDATE auth_users SET role = ?, driver_id = ? WHERE id = ?',
      [role, role === 'pilot' ? driverId : null, request.params.id],
    )
    if (!result.affectedRows) return response.status(404).json({ error: 'La cuenta no existe.' })

    for (const [token, session] of sessions) {
      if (session.user.id === request.params.id) sessions.delete(token)
    }
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, driver_id FROM auth_users WHERE id = ? LIMIT 1',
      [request.params.id],
    )
    response.json(safeUser(rows[0]))
  } catch (error) {
    next(error)
  }
})

app.get('/api/counts', async (_request, response, next) => {
  try {
    if (_request.user.role === 'pilot') {
      if (!_request.user.driverId) return response.json({ drivers: 0 })
      const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM drivers WHERE id = ?', [_request.user.driverId])
      return response.json({ drivers: Number(rows[0].total) })
    }

    const counts = {}
    for (const [resource, table] of Object.entries(resources)) {
      const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM \`${table}\``)
      counts[resource] = Number(rows[0].total)
    }
    response.json(counts)
  } catch (error) {
    next(error)
  }
})

app.get('/api/:resource', async (request, response, next) => {
  const table = Object.hasOwn(resources, request.params.resource) ? resources[request.params.resource] : null
  if (!table) return response.status(404).json({ error: 'Catálogo no encontrado.' })
  if (request.user.role === 'pilot' && request.params.resource !== 'drivers') {
    return response.status(403).json({ error: 'Tu cuenta solo puede consultar tu propia ficha de piloto.' })
  }

  try {
    const [rows] = await pool.query(`SELECT data FROM \`${table}\` ORDER BY created_at, id`)
    const records = rows.map((row) => parseData(row.data))
    response.json(
      request.user.role === 'pilot'
        ? records.filter((record) => record.id === request.user.driverId)
        : records,
    )
  } catch (error) {
    next(error)
  }
})

app.post('/api/:resource', requireOrganizer, async (request, response, next) => {
  const table = Object.hasOwn(resources, request.params.resource) ? resources[request.params.resource] : null
  if (!table) return response.status(404).json({ error: 'Catálogo no encontrado.' })
  const validationError = validateRecord(request.params.resource, request.body)
  if (validationError) return response.status(400).json({ error: validationError })

  const record = { ...request.body, id: request.body.id || randomUUID() }
  try {
    await pool.execute(`INSERT INTO \`${table}\` (id, data) VALUES (?, ?)`, [
      record.id,
      JSON.stringify(record),
    ])
    response.status(201).json(record)
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return response.status(409).json({ error: 'Ya existe un registro con ese id.' })
    }
    next(error)
  }
})

app.put('/api/:resource/:id', requireOrganizer, async (request, response, next) => {
  const table = Object.hasOwn(resources, request.params.resource) ? resources[request.params.resource] : null
  if (!table) return response.status(404).json({ error: 'Catálogo no encontrado.' })
  const validationError = validateRecord(request.params.resource, request.body)
  if (validationError) return response.status(400).json({ error: validationError })

  const record = { ...request.body, id: request.params.id }
  try {
    const [rows] = await pool.execute(`SELECT id FROM \`${table}\` WHERE id = ?`, [request.params.id])
    if (!rows.length) return response.status(404).json({ error: 'Registro no encontrado.' })
    await pool.execute(`UPDATE \`${table}\` SET data = ? WHERE id = ?`, [
      JSON.stringify(record),
      request.params.id,
    ])
    response.json(record)
  } catch (error) {
    next(error)
  }
})

app.get('/api/:resource/:id', async (request, response, next) => {
  const table = Object.hasOwn(resources, request.params.resource) ? resources[request.params.resource] : null
  if (!table) return response.status(404).json({ error: 'Catálogo no encontrado.' })
  if (
    request.user.role === 'pilot' &&
    (request.params.resource !== 'drivers' || request.params.id !== request.user.driverId)
  ) {
    return response.status(403).json({ error: 'Tu cuenta solo puede consultar tu propia ficha de piloto.' })
  }

  try {
    const [rows] = await pool.execute(`SELECT data FROM \`${table}\` WHERE id = ?`, [request.params.id])
    if (!rows.length) return response.status(404).json({ error: 'Registro no encontrado.' })
    response.json(parseData(rows[0].data))
  } catch (error) {
    next(error)
  }
})

app.delete('/api/:resource/:id', requireOrganizer, async (request, response, next) => {
  const table = Object.hasOwn(resources, request.params.resource) ? resources[request.params.resource] : null
  if (!table) return response.status(404).json({ error: 'Catálogo no encontrado.' })

  try {
    const [rows] = await pool.execute(`SELECT id FROM \`${table}\` WHERE id = ?`, [request.params.id])
    if (!rows.length) return response.status(404).json({ error: 'Registro no encontrado.' })
    await pool.execute(`DELETE FROM \`${table}\` WHERE id = ?`, [request.params.id])
    response.json({ success: true, id: request.params.id, message: 'Registro eliminado con éxito.' })
  } catch (error) {
    next(error)
  }
})

app.post('/api/bootstrap', requireOrganizer, async (request, response, next) => {
  const data = request.body
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return response.status(400).json({ error: 'El contenido inicial no es válido.' })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [rows] = await connection.query(
      `SELECT (${Object.values(resources).map((table) => `(SELECT COUNT(*) FROM \`${table}\`)`).join(' + ')}) AS total`,
    )
    if (Number(rows[0].total) > 0) {
      await connection.rollback()
      return response.status(409).json({ error: 'La base de datos ya contiene registros.' })
    }

    for (const [resource, table] of Object.entries(resources)) {
      const records = data[resource]
      if (!Array.isArray(records)) {
        await connection.rollback()
        return response.status(400).json({ error: `Faltan registros iniciales para ${resource}.` })
      }
      for (const item of records) {
        const validationError = validateRecord(resource, item)
        if (validationError || !item.id) {
          await connection.rollback()
          return response.status(400).json({ error: validationError || `Falta id en ${resource}.` })
        }
        await connection.execute(`INSERT INTO \`${table}\` (id, data) VALUES (?, ?)`, [
          item.id,
          JSON.stringify(item),
        ])
      }
    }

    await connection.commit()
    response.status(201).json({ status: 'initialized' })
  } catch (error) {
    await connection.rollback()
    next(error)
  } finally {
    connection.release()
  }
})

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({ error: 'Error interno de la API. Revisa la consola del servidor.' })
})

try {
  await pool.query('SELECT 1')
  await pool.query(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(254) NOT NULL UNIQUE,
      password_salt CHAR(32) NOT NULL,
      password_hash CHAR(128) NOT NULL,
      role VARCHAR(24) NOT NULL DEFAULT 'public',
      driver_id VARCHAR(64) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  const [userColumns] = await pool.query("SHOW COLUMNS FROM auth_users LIKE 'driver_id'")
  if (!userColumns.length) {
    await pool.query('ALTER TABLE auth_users ADD COLUMN driver_id VARCHAR(64) NULL')
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const adminPassword = process.env.ADMIN_PASSWORD
  if (adminEmail && adminPassword) {
    const { salt, hash } = await hashPassword(adminPassword)
    await pool.execute(
      `INSERT INTO auth_users (id, name, email, password_salt, password_hash, role)
       VALUES (?, ?, ?, ?, ?, 'organizer')
       ON DUPLICATE KEY UPDATE name = VALUES(name), password_salt = VALUES(password_salt),
         password_hash = VALUES(password_hash), role = 'organizer'`,
      [randomUUID(), process.env.ADMIN_NAME?.trim() || 'Administrador', adminEmail, salt, hash],
    )
    console.log(`Cuenta organizadora configurada para ${adminEmail}`)
  }

  app.listen(port, '127.0.0.1', () => {
    console.log(`API lista en http://127.0.0.1:${port}`)
  })
} catch (error) {
  console.error('No se pudo conectar a MySQL. Verifica el archivo .env y database/schema.sql.', error)
  process.exitCode = 1
}
