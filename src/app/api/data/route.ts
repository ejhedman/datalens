import { NextRequest, NextResponse } from 'next/server';
import { query, getPool } from '@/lib/db';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface Column {
  name: string;
  type: string;
}

interface TableConfig {
  name: string;
  sort_column: string;
  key_column: string;
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
    const pageSize = parseInt(searchParams.get('pageSize') || '100');
    const sortField = searchParams.get('sortField') || '';
    const sortDirection = searchParams.get('sortDirection') || 'asc';
    const filters = JSON.parse(searchParams.get('filters') || '{}') as Record<string, string[]>;
    const lastKey = searchParams.get('lastKey');
    const dataSourceStr = searchParams.get('dataSource');
    const dataSource = dataSourceStr ? JSON.parse(dataSourceStr) as DataSource : undefined;
    const datalensId = searchParams.get('datalensId');

    if (!table) {
      return NextResponse.json(
        { error: 'Table is required' },
        { status: 400 }
      );
    }

    if (!datalensId) {
      return NextResponse.json(
        { error: 'DataLens ID is required' },
        { status: 400 }
      );
    }

    // Get the DataLens configuration from Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { data: dataLens, error: lensError } = await supabase
      .from('datalenses')
      .select('datalens_config')
      .eq('id', datalensId)
      .single();

    if (lensError) {
      console.error('Supabase error:', lensError);
      return NextResponse.json(
        { error: 'Failed to fetch DataLens configuration' },
        { status: 500 }
      );
    }

    if (!dataLens?.datalens_config) {
      return NextResponse.json(
        { error: 'DataLens configuration not found' },
        { status: 404 }
      );
    }

    // Get the tables array from the configuration
    const tables = Array.isArray(dataLens.datalens_config) 
      ? dataLens.datalens_config 
      : dataLens.datalens_config.tables || [];

    const tableConfig = tables.find((t: TableConfig) => t.name === table);

    if (!tableConfig) {
      return NextResponse.json(
        { error: 'Table not found in DataLens configuration' },
        { status: 404 }
      );
    }

    const { name, sort_column, key_column, columns } = tableConfig;
    const schema = 'public'; // Default to public schema

    // Get database pool with DataSource configuration if provided
    const pool = await getPool(dataSource);

    // Log the columns we're working with
    console.log('Columns from config:', columns.map((col: Column) => col.name));

    // Filter out invalid filters (columns that don't exist in the current table)
    const validFilters = Object.entries(filters)
      .filter(([field, values]) => {
        const columnExists = columns.some((col: Column) => col.name === field);
        if (!columnExists) {
          console.log(`Filtering out invalid column: ${field}`);
        }
        return columnExists && Array.isArray(values) && values.length > 0;
      });

    // Build the base query with proper datetime formatting
    const columnList = columns.map((col: Column) => {
      if (col.type === 'datetime') {
        return `to_char(${col.name}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as ${col.name}`;
      }
      return col.name;
    }).join(', ');

    let queryText: string;
    let queryParams: (string | number)[] = [];
    let paramCount = 1;

    // Start with base query
    queryText = `SELECT ${columnList} FROM ${schema}.${name}`;

    // Add filters if there are valid ones
    if (validFilters.length > 0) {
      const filterConditions = validFilters.map(([field, values]) => {
        const columnConfig = columns.find((col: Column) => col.name === field);
        if (columnConfig?.type === 'datetime') {
          if (values.length === 1) {
            queryParams.push(values[0]);
            return `${field} = $${paramCount++}::timestamp`;
          }
          const placeholders = values.map(() => {
            queryParams.push(values[0]);
            return `$${paramCount++}::timestamp`;
          }).join(',');
          return `${field} IN (${placeholders})`;
        } else if (columnConfig?.type === 'boolean') {
          if (values.length === 1) {
            const boolValue = values[0] === 'true' ? 'true' : 'false';
            queryParams.push(boolValue);
            return `CAST(${field} AS bool) = $${paramCount++}::bool`;
          }
          const placeholders = values.map(() => {
            const boolValue = values[0] === 'true' ? 'true' : 'false';
            queryParams.push(boolValue);
            return `$${paramCount++}::bool`;
          }).join(',');
          return `CAST(${field} AS bool) IN (${placeholders})`;
        } else {
          if (values.length === 1) {
            queryParams.push(values[0]);
            return `${field} = $${paramCount++}`;
          }
          const placeholders = values.map(() => `$${paramCount++}`).join(',');
          queryParams.push(...values);
          return `${field} IN (${placeholders})`;
        }
      });

      queryText += ` WHERE ${filterConditions.join(' AND ')}`;
    }

    // Add pagination if lastKey is provided
    if (lastKey && lastKey !== 'undefined') {
      const sortColumnConfig = columns.find((col: { name: string; type: string }) => col.name === sort_column);
      
      // Get the appropriate type casting
      const sortColumnCast = sortColumnConfig?.type === 'number' ? '::numeric' : 
                           sortColumnConfig?.type === 'datetime' ? '::timestamptz' : 
                           sortColumnConfig?.type === 'text' ? '::text' : '';

      // Add AND if we already have a WHERE clause, otherwise add WHERE
      if (validFilters.length > 0) {
        queryText += ` AND`;
      } else {
        queryText += ` WHERE`;
      }

      queryText += ` ${sort_column}${sortColumnCast} > $${paramCount}${sortColumnCast}`;
      
      // Convert value to appropriate type
      if (sortColumnConfig?.type === 'number') {
        queryParams.push(Number(lastKey));
      } else if (sortColumnConfig?.type === 'datetime') {
        const isoTimestamp = new Date(lastKey).toISOString();
        queryParams.push(isoTimestamp);
      } else {
        queryParams.push(lastKey);
      }
      
      paramCount += 1;
    }

    // Add sorting - first by the sort column for pagination, then by the display columns
    const displaySortColumns = columns.map((col: Column) => {
      if (col.type === 'number') {
        return `${col.name}::numeric`;
      } else if (col.type === 'datetime') {
        return `${col.name}::timestamptz`;
      } else if (col.type === 'text') {
        return `${col.name}::text`;
      }
      return col.name;
    }).join(', ');

    // Get the sort column type for proper casting
    const sortColumnConfig = columns.find((col: { name: string; type: string }) => col.name === sort_column);
    const sortColumnCast = sortColumnConfig?.type === 'number' ? '::numeric' : 
                         sortColumnConfig?.type === 'datetime' ? '::timestamptz' : 
                         sortColumnConfig?.type === 'text' ? '::text' : '';

    // Add sorting and limit - sort_column first for pagination, then display columns
    if (sortField && sortField !== sort_column) {
      // Only use the sort field if it exists in our columns configuration
      const displaySortColumnConfig = columns.find((col: { name: string; type: string }) => col.name === sortField);
      if (displaySortColumnConfig) {
        const displaySortCast = displaySortColumnConfig.type === 'number' ? '::numeric' : 
                              displaySortColumnConfig.type === 'datetime' ? '::timestamptz' : 
                              displaySortColumnConfig.type === 'text' ? '::text' : '';
        
        queryText += ` ORDER BY ${sortField}${displaySortCast} ${sortDirection}, ${sort_column}${sortColumnCast} ASC, ${displaySortColumns} ASC LIMIT $${paramCount}::bigint`;
      } else {
        // If the sort field isn't in our columns, just use the default sorting
        queryText += ` ORDER BY ${sort_column}${sortColumnCast} ${sortDirection}, ${displaySortColumns} ASC LIMIT $${paramCount}::bigint`;
      }
    } else {
      queryText += ` ORDER BY ${sort_column}${sortColumnCast} ${sortDirection}, ${displaySortColumns} ASC LIMIT $${paramCount}::bigint`;
    }
    queryParams.push(Number(pageSize));

    // Get total count of rows in the filtered dataset
    const countQuery = Object.keys(filters).length === 0
      ? `SELECT COUNT(*) as total FROM ${schema}.${name}`
      : (() => {
          if (validFilters.length === 0) {
            return `SELECT COUNT(*) as total FROM ${schema}.${name}`;
          }

          let countParams: any[] = [];
          let paramCount = 1;
          
          const countQueryText = `SELECT COUNT(*) as total FROM ${schema}.${name} WHERE ${validFilters
            .map(([field, values]) => {
              const columnConfig = columns.find((col: Column) => col.name === field);
              if (columnConfig?.type === 'datetime') {
                if (values.length === 1) {
                  countParams.push(values[0]);
                  return `${field} = $${paramCount++}::timestamp`;
                }
                const placeholders = values.map(() => {
                  countParams.push(values[0]);
                  return `$${paramCount++}::timestamp`;
                }).join(',');
                return `${field} IN (${placeholders})`;
              } else if (columnConfig?.type === 'boolean') {
                if (values.length === 1) {
                  const boolValue = values[0] === 'true' ? 'true' : 'false';
                  countParams.push(boolValue);
                  return `CAST(${field} AS bool) = $${paramCount++}::bool`;
                }
                const placeholders = values.map(() => {
                  const boolValue = values[0] === 'true' ? 'true' : 'false';
                  countParams.push(boolValue);
                  return `$${paramCount++}::bool`;
                }).join(',');
                return `CAST(${field} AS bool) IN (${placeholders})`;
              } else {
                if (values.length === 1) {
                  countParams.push(values[0]);
                  return `${field} = $${paramCount++}`;
                }
                const placeholders = values.map(() => {
                  countParams.push(values[0]);
                  return `$${paramCount++}`;
                }).join(',');
                return `${field} IN (${placeholders})`;
              }
            })
            .join(' AND ')}`;

          return { text: countQueryText, params: countParams };
        })();

    // Execute both queries
    const [data, countResult] = await Promise.all([
      query(queryText, queryParams),
      query(
        typeof countQuery === 'string' ? countQuery : countQuery.text,
        typeof countQuery === 'string' ? [] : countQuery.params
      )
    ]);

    const total = parseInt(countResult[0]?.total || '0');

    return NextResponse.json({
      data,
      hasMore: data.length === pageSize,
      lastKey: data.length > 0 ? data[data.length - 1][sort_column] : null,
      totalCount: total,
      query: {
        sql: queryText,
        params: queryParams
      }
    });
  } catch (error) {
    console.error('Error in data route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}