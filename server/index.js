import 'dotenv/config'
import express from 'express'
import mysql from 'mysql2/promise'
import { randomUUID } from 'node:crypto'

const app = express()
const port = Number(process.env.API_PORT || 3001)
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

app.get('/api/counts', async (_request, response, next) => {
  try {
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

  try {
    const [rows] = await pool.query(`SELECT data FROM \`${table}\` ORDER BY created_at, id`)
    response.json(rows.map((row) => parseData(row.data)))
  } catch (error) {
    next(error)
  }
})

app.post('/api/:resource', async (request, response, next) => {
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

app.put('/api/:resource/:id', async (request, response, next) => {
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

  try {
    const [rows] = await pool.execute(`SELECT data FROM \`${table}\` WHERE id = ?`, [request.params.id])
    if (!rows.length) return response.status(404).json({ error: 'Registro no encontrado.' })
    response.json(parseData(rows[0].data))
  } catch (error) {
    next(error)
  }
})

app.delete('/api/:resource/:id', async (request, response, next) => {
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

app.post('/api/bootstrap', async (request, response, next) => {
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
  app.listen(port, '127.0.0.1', () => {
    console.log(`API lista en http://127.0.0.1:${port}`)
  })
} catch (error) {
  console.error('No se pudo conectar a MySQL. Verifica el archivo .env y database/schema.sql.', error)
  process.exitCode = 1
}
