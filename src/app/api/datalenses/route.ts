import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const datasourceId = searchParams.get('datasourceId')

  if (!datasourceId) {
    return NextResponse.json({ error: 'Data source ID is required' }, { status: 400 })
  }

  const supabase = createRouteHandlerClient({ cookies })

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: lenses, error } = await supabase
      .from('datalenses')
      .select(`
        *,
        datasources:datasource_id (
          datasource_name
        )
      `)
      .eq('datasource_id', datasourceId)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching data lenses:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data to use consistent terminology
    const transformedLenses = lenses.map(lens => ({
      id: lens.id,
      datasource_id: lens.datasource_id,
      datalens_name: lens.datalens_name,
      datalens_config: lens.datalens_config,
      datasource: {
        id: lens.datasources.id,
        datasource_name: lens.datasources.datasource_name,
        database_type: lens.datasources.database_type,
        created_at: lens.datasources.created_at
      }
    }))

    return NextResponse.json({ lenses: transformedLenses })
  } catch (error: any) {
    console.error('Error in data lenses API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 