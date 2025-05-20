export interface DataSource {
  id: string
  datasource_name: string
  database_type?: string
  created_at: string
}

export interface DataLens {
  id: string
  datasource_id: string
  datalens_name: string
  datalens_config: Record<string, any>
  datasource: DataSource
}

export interface DataLensCreate {
  datasource_id: string
  datalens_name: string
  datalens_config: Record<string, any>
}

export interface DataLensUpdate {
  datasource_id?: string
  datalens_name?: string
  datalens_config?: Record<string, any>
} 