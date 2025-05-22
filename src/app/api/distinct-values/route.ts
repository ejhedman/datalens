import { NextRequest, NextResponse } from 'next/server';
import { loadTables } from '@/lib/config';
import { query, getPool } from '@/lib/db';

interface Column {
  name: string;
  type: string;
}

interface Table {
  name: string;
  columns: Column[];
}

interface DataSource {
  jdbc_url: string;
  username: string;
  password: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const table = searchParams.get('table');
    const column = searchParams.get('column');
    const searchTerm = searchParams.get('searchTerm') || '';
    const filters = JSON.parse(searchParams.get('filters') || '{}') as Record<string, string[]>;
    const dataSourceStr = searchParams.get('dataSource');
    const dataSource = dataSourceStr ? JSON.parse(dataSourceStr) as DataSource : undefined;

    if (!table || !column) {
      return NextResponse.json(
        { error: 'Table and column are required' },
        { status: 400 }
      );
    }

    const tables = await loadTables();
    const tableConfig = tables.find((t: Table) => t.name === table);

    if (!tableConfig) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    const { name, columns } = tableConfig;
    const schema = 'public'; // Default to public schema

    // Get database pool with DataSource configuration if provided
    const pool = await getPool(dataSource);

    // Verify the column exists in the table
    const columnConfig = columns.find((col: Column) => col.name === column);
    if (!columnConfig) {
      return NextResponse.json(
        { error: 'Column not found in table' },
        { status: 404 }
      );
    }

    // Build the query
    let queryText = `SELECT DISTINCT ${column} FROM ${schema}.${name}`;
    const queryParams: any[] = [];

    // Add search term if provided
    if (searchTerm) {
      queryText += ` WHERE ${column}::text ILIKE $1`;
      queryParams.push(`%${searchTerm}%`);
    }

    // Add filters if provided
    if (Object.keys(filters).length > 0) {
      const filterConditions = Object.entries(filters)
        .filter(([field, values]) => {
          const columnExists = columns.some((col: Column) => col.name === field);
          return columnExists && Array.isArray(values) && values.length > 0;
        })
        .map(([field, values], index) => {
          const columnConfig = columns.find((col: Column) => col.name === field);
          if (columnConfig?.type === 'datetime') {
            if (values.length === 1) {
              queryParams.push(values[0]);
              return `${field} = $${queryParams.length}::timestamp`;
            }
            const placeholders = values.map(() => {
              queryParams.push(values[0]);
              return `$${queryParams.length}::timestamp`;
            }).join(',');
            return `${field} IN (${placeholders})`;
          } else if (columnConfig?.type === 'boolean') {
            if (values.length === 1) {
              const boolValue = values[0] === 'true' ? 'true' : 'false';
              queryParams.push(boolValue);
              return `CAST(${field} AS bool) = $${queryParams.length}::bool`;
            }
            const placeholders = values.map(() => {
              const boolValue = values[0] === 'true' ? 'true' : 'false';
              queryParams.push(boolValue);
              return `$${queryParams.length}::bool`;
            }).join(',');
            return `CAST(${field} AS bool) IN (${placeholders})`;
          } else {
            if (values.length === 1) {
              queryParams.push(values[0]);
              return `${field} = $${queryParams.length}`;
            }
            const placeholders = values.map(() => `$${queryParams.length}`).join(',');
            queryParams.push(...values);
            return `${field} IN (${placeholders})`;
          }
        });

      if (filterConditions.length > 0) {
        queryText += searchTerm ? ' AND ' : ' WHERE ';
        queryText += filterConditions.join(' AND ');
      }
    }

    // Add order by
    queryText += ` ORDER BY ${column}`;

    // Execute query
    const result = await query(queryText, queryParams);
    return NextResponse.json(result.map(row => row[column]));
  } catch (error) {
    console.error('Error in distinct values route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 