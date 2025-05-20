import { Client } from 'pg'

interface ConnectionResult {
  success: boolean
  error?: string
  ddl?: string
}

export async function testJdbcConnection(
  jdbcUrl: string,
  username: string,
  password: string
): Promise<ConnectionResult> {
  try {
    // Extract host, port, and database name from JDBC URL
    const url = new URL(jdbcUrl.replace('jdbc:', ''))
    const host = url.hostname
    const port = parseInt(url.port)
    const database = url.pathname.substring(1) // Remove leading slash

    const client = new Client({
      host,
      port,
      database,
      user: username,
      password,
      ssl: {
        rejectUnauthorized: false // Required for AWS RDS and other cloud databases
      }
    })

    await client.connect()

    // Test the connection with a simple query
    await client.query('SELECT 1')

    await client.end()

    return {
      success: true
    }
  } catch (error: any) {
    console.error('Database connection error:', error)
    return {
      success: false,
      error: error.message
    }
  }
} 