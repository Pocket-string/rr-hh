import sql from 'mssql'

const config: sql.config = {
  server: process.env.SQLSERVER_HOST || 'localhost',
  port: parseInt(process.env.SQLSERVER_PORT || '1433'),
  user: process.env.SQLSERVER_USER || '',
  password: process.env.SQLSERVER_PASSWORD || '',
  database: process.env.SQLSERVER_DATABASE || '',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

let pool: sql.ConnectionPool | null = null

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await new sql.ConnectionPool(config).connect()
  }
  return pool
}

export async function query<T = sql.IRecordSet<unknown>>(
  queryText: string,
  params?: Record<string, unknown>
): Promise<T> {
  const p = await getPool()
  const request = p.request()

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value)
    }
  }

  const result = await request.query(queryText)
  return result.recordset as T
}

export async function execute(
  queryText: string,
  params?: Record<string, unknown>
): Promise<sql.IResult<unknown>> {
  const p = await getPool()
  const request = p.request()

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value)
    }
  }

  return request.query(queryText)
}

export { sql }
