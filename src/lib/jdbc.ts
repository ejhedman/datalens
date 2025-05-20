'use server'

import { Client } from 'pg'

interface TestConnectionResult {
  success: boolean
  error?: string
}

interface TestConnectionParams {
  jdbcUrl: string
  username: string
  password: string
}

export async function testJdbcConnection({
  jdbcUrl,
  username,
  password,
}: TestConnectionParams): Promise<TestConnectionResult> {
  try {
    // Parse JDBC URL to get connection parameters
    const urlString = jdbcUrl.replace('jdbc:postgresql://', 'http://')
    const url = new URL(urlString)
    const host = url.hostname
    const port = url.port || '5432'
    const database = url.pathname.substring(1) // Remove leading slash

    // Create PostgreSQL client
    const client = new Client({
      host,
      port: parseInt(port),
      database,
      user: username,
      password,
      ssl: {
        rejectUnauthorized: false // Required for AWS RDS
      }
    })

    // Attempt to connect
    await client.connect()
    
    // Test the connection with a simple query
    await client.query('SELECT 1')
    
    // Close the connection
    await client.end()

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to connect to database',
    }
  }
} 