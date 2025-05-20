import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Client } from 'pg'

// Helper function to send SSE messages
function sendSSEMessage(
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController,
  data: any
) {
  try {
    const message = `data: ${JSON.stringify(data)}\n\n`
    controller.enqueue(encoder.encode(message))
  } catch (error) {
    console.error('Error sending SSE message:', error)
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Failed to send message' })}\n\n`))
  }
}

// Helper function to split schema into chunks
function splitSchemaIntoChunks(schema: any[], chunkSize: number = 10) {
  const chunks: any[][] = []
  for (let i = 0; i < schema.length; i += chunkSize) {
    chunks.push(schema.slice(i, i + chunkSize))
  }
  return chunks
}

export async function POST(request: Request) {
  try {
    // Initialize SSE response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Check authentication
          const supabase = createRouteHandlerClient({ cookies })
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (!session) {
            sendSSEMessage(encoder, controller, {
              type: 'error',
              error: 'Unauthorized'
            })
            controller.close()
            return
          }

          // Get connection parameters from request body
          const { jdbcUrl, username, password } = await request.json()

          if (!jdbcUrl || !username || !password) {
            sendSSEMessage(encoder, controller, {
              type: 'error',
              error: 'Missing required connection parameters'
            })
            controller.close()
            return
          }

          // Parse JDBC URL
          const urlString = jdbcUrl.replace('jdbc:postgresql://', 'http://')
          const url = new URL(urlString)
          const host = url.hostname
          const port = url.port || '5432'
          const database = url.pathname.substring(1)

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

          // Connect to database
          await client.connect()

          // Send initial progress
          sendSSEMessage(encoder, controller, {
            type: 'progress',
            data: {
              current: 0,
              total: 1,
              currentTable: 'Starting...',
              type: 'connection'
            }
          })

          // Get all tables and views
          const schemaQuery = `
            SELECT 
              table_name,
              table_type,
              table_schema
            FROM 
              information_schema.tables 
            WHERE 
              table_schema NOT IN ('pg_catalog', 'information_schema')
              AND table_schema NOT LIKE 'pg_toast%'
            ORDER BY 
              table_schema, table_name;
          `
          const { rows: tables } = await client.query(schemaQuery)

          // Initialize schema array
          const schema: any[] = []
          let current = 0
          const total = tables.length

          // Process each table
          for (const table of tables) {
            current++
            const tableName = table.table_name
            const schemaName = table.table_schema
            const fullTableName = `${schemaName}.${tableName}`

            // Send progress update
            sendSSEMessage(encoder, controller, {
              type: 'progress',
              data: {
                current,
                total,
                currentTable: fullTableName,
                type: 'schema'
              }
            })

            // Get column information
            const columnQuery = `
              SELECT 
                column_name,
                data_type,
                ordinal_position
              FROM 
                information_schema.columns
              WHERE 
                table_schema = $1
                AND table_name = $2
              ORDER BY 
                ordinal_position;
            `
            const { rows: columns } = await client.query(columnQuery, [schemaName, tableName])

            // Add table to schema
            schema.push({
              name: tableName,
              type: table.table_type.toLowerCase() === 'view' ? 'view' : 'table',
              ordinal: schema.length + 1,
              active: true,
              sort_column: 'x_uid',
              key_column: 'x_uid',
              columns: columns.map(col => ({
                name: col.column_name,
                dataType: col.data_type,
                ordinal: col.ordinal_position,
                active: true,
                filterable: true,
                sortable: true
              }))
            })
          }

          // Send completion message with full schema
          sendSSEMessage(encoder, controller, {
            type: 'complete',
            data: {
              current: total,
              total,
              currentTable: 'Complete',
              schema: schema
            }
          })

          // Close database connection
          await client.end()
          
          // Close the stream
          controller.close()
        } catch (error: any) {
          console.error('Error in DDL reading:', error)
          sendSSEMessage(encoder, controller, {
            type: 'error',
            error: error.message || 'Failed to read database schema'
          })
          controller.close()
        }
      }
    })

    // Return SSE response
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('Error setting up DDL reading:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to setup DDL reading' },
      { status: 500 }
    )
  }
} 