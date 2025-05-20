export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      datasources: {
        Row: {
          id: string
          user_id: string
          datasource_name: string
          jdbc_url: string
          username: string
          password: string
          created_at: string
          updated_at: string
          datalens_config?: any
        }
        Insert: {
          id?: string
          user_id: string
          datasource_name: string
          jdbc_url: string
          username: string
          password: string
          created_at?: string
          updated_at?: string
          datalens_config?: any
        }
        Update: {
          id?: string
          user_id?: string
          datasource_name?: string
          jdbc_url?: string
          username?: string
          password?: string
          created_at?: string
          updated_at?: string
          datalens_config?: any
        }
      }
      datalenses: {
        Row: {
          id: string
          datasource_id: string
          datalens_name: string
          user_id: string
          datalens_config: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          datasource_id: string
          datalens_name: string
          user_id: string
          datalens_config?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          datasource_id?: string
          datalens_name?: string
          user_id?: string
          datalens_config?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "datalenses_datasource_id_fkey"
            columns: ["datasource_id"]
            isOneToOne: false
            referencedRelation: "datasources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_lenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
  }
} 