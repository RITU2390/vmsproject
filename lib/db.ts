import mysql from "mysql2/promise"

let pool: mysql.Pool | null = null

export function getPool() {
  if (!pool) {
    const { MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD } = process.env

    if (!MYSQL_HOST || !MYSQL_DATABASE || !MYSQL_USER || !MYSQL_PASSWORD) {
      throw new Error(
        "Missing MySQL env vars. Please set MYSQL_HOST, MYSQL_PORT (optional), MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD in Project Settings.",
      )
    }

    pool = mysql.createPool({
      host: MYSQL_HOST,
      port: MYSQL_PORT ? Number(MYSQL_PORT) : 3306,
      database: MYSQL_DATABASE,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true,
      // timezone to UTC; store timestamps consistently
      timezone: "Z",
    })
  }
  return pool
}

export async function query<T = any>(sql: string, params?: any[]) {
  const p = getPool()
  const [rows] = await p.execute(sql, params)
  return rows as T
}

export async function transaction<T>(fn: (conn: mysql.PoolConnection) => Promise<T>) {
  const p = getPool()
  const conn = await p.getConnection()
  try {
    await conn.beginTransaction()
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}
