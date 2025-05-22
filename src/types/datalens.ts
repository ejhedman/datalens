export interface DataSource {
  id: string
  datasource_name: string
  database_type?: string
  created_at: string
}

export interface DataNavigatorConfig {
  tables: Array<{
    name: string;
    type: 'table' | 'view';
    ordinal: number;
    active: boolean;
    key_column?: string;
    sort_column?: string;
    columns: Array<{
      name: string;
      dataType: string;
      ordinal: number;
      active: boolean;
      filterable?: boolean;
      sortable?: boolean;
      key_column?: boolean;
      sort_column?: boolean;
    }>;
  }>;
}

export interface DataLens {
  id: string
  datasource_id: string
  datalens_name: string
  datalens_config: DataNavigatorConfig
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