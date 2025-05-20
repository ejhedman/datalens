import { Pool } from 'pg';
// import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

interface DbConfig {
  host: string;
  port: number;
  database: string;
  schema: string;
  user: string;
  password: string;
  ssl?: {
    rejectUnauthorized: boolean;
    ca?: string;
    key?: string;
    cert?: string;
  };
}

let pool: Pool | null = null;

export async function getPool(): Promise<Pool> {
  if (pool) return pool;

  let dbConfig: DbConfig;
  
  // if (process.env.NODE_ENV === 'production') {
  //   const client = new SecretsManagerClient({ region: 'us-east-1' });
  //   const command = new GetSecretValueCommand({
  //     SecretId: process.env.AWS_SECRET_ARN,
  //   });
  //   const response = await client.send(command);
  //   dbConfig = JSON.parse(response.SecretString || '{}');
  // } else {
    // Development config
    dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_DATABASE || 'postgres',
      schema: process.env.DB_SCHEMA || 'public',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: {
        rejectUnauthorized: false,
        ca: process.env.DB_CA_CERT,
        key: process.env.DB_CLIENT_KEY,
        cert: process.env.DB_CLIENT_CERT,
      },
    // };
  }

  // Log connection details including password for debugging
  console.log('Attempting to connect to database:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    schema: dbConfig.schema,
    user: dbConfig.user,
    password: dbConfig.password,
    ssl: dbConfig.ssl ? 'enabled' : 'disabled',
  });

  // Verify environment variables are set
  console.log('Environment variables check:', {
    DB_HOST: process.env.DB_HOST ? 'set' : 'not set',
    DB_PORT: process.env.DB_PORT ? 'set' : 'not set',
    DB_USER: process.env.DB_USER ? 'set' : 'not set',
    DB_PASSWORD: process.env.DB_PASSWORD ? 'set' : 'not set',
    DB_DATABASE: process.env.DB_DATABASE ? 'set' : 'not set',
    DB_SCHEMA: process.env.DB_SCHEMA ? 'set' : 'not set',
  });

  // Create connection string with URL encoded password
  const encodedPassword = encodeURIComponent(dbConfig.password);
  const connectionString = `postgresql://${dbConfig.user}:${encodedPassword}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
  
  console.log('Using connection string:', connectionString.replace(encodedPassword, '*****'));

  // Try to connect with connection string
  try {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    const client = await pool.connect();
    console.log('Successfully connected to database');
    
    // Test query
    const result = await client.query('SELECT current_database(), current_user, version()');
    console.log('Database info:', result.rows[0]);
    
    client.release();
    return pool;
  } catch (error) {
    console.error('Failed to connect to database:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      code: error instanceof Error ? (error as any).code : 'Unknown',
    });
    throw error;
  }
}

export async function query(
  sql: string,
  params: any[] = []
): Promise<any[]> {
  const pool = await getPool();
  const client = await pool.connect();
  try {
    const startTime = Date.now();
    
    // Format any timestamp parameters
    const formattedParams = params.map(param => {
      if (typeof param === 'string' && param.includes('GMT')) {
        // Convert timestamp string to ISO format
        return new Date(param).toISOString();
      }
      return param;
    });
    
    // Execute the query with formatted parameters
    const result = await client.query({
      text: sql,
      values: formattedParams
    });
    
    const executionTime = Date.now() - startTime;
    
    console.log({
      query: sql,
      params: formattedParams,
      executionTime,
      rowCount: result?.rowCount || 0,
    });

    return result?.rows || [];
  } catch (error) {
    console.error('Database query error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      code: error instanceof Error ? (error as any).code : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      sql,
      params
    });
    throw error;
  } finally {
    client.release();
  }
} 