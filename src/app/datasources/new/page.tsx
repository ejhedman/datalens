'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function NewDataSourcePage() {
  const [isTesting, setIsTesting] = useState(false)
  const [formData, setFormData] = useState({
    datasource_name: '',
    jdbc_url: '',
    db_username: '',
    db_password: '',
  })
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleTestConnection = async () => {
    if (!formData.jdbc_url || !formData.db_username || !formData.db_password) {
      toast.error('Please fill in all connection details')
      return
    }

    setIsTesting(true)
    try {
      const response = await fetch('/api/datasources/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jdbcUrl: formData.jdbc_url,
          username: formData.db_username,
          password: formData.db_password
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Connection successful!')
      } else {
        toast.error('Connection failed: ' + result.error)
      }
    } catch (error: any) {
      toast.error('Error testing connection: ' + error.message)
    } finally {
      setIsTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('You must be logged in to create a data source')
        router.push('/login')
        return
      }

      const datasourceData = {
        datasource_name: formData.datasource_name,
        jdbc_url: formData.jdbc_url,
        username: formData.db_username,
        password: formData.db_password,
        user_id: session.user.id
      }

      const { data, error } = await supabase
        .from('datasources')
        .insert([datasourceData])
        .select()
        .single()

      if (error) {
        throw error
      }

      toast.success('Data source created successfully')
      router.push('/datasources')
    } catch (error: any) {
      toast.error('Error creating data source: ' + error.message)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-6">New Data Source</h2>
        </div>

        <div>
          <Label htmlFor="datasource_name">Data Source Name</Label>
          <Input
            id="datasource_name"
            name="datasource_name"
            value={formData.datasource_name}
            onChange={handleInputChange}
            placeholder="My Data Source"
            required
          />
        </div>

        <div>
          <Label htmlFor="jdbc_url">JDBC URL</Label>
          <Input
            id="jdbc_url"
            name="jdbc_url"
            value={formData.jdbc_url}
            onChange={handleInputChange}
            placeholder="jdbc:postgresql://host:port/database"
            required
          />
        </div>

        <div>
          <Label htmlFor="db_username">Database Username</Label>
          <Input
            id="db_username"
            name="db_username"
            value={formData.db_username}
            onChange={handleInputChange}
            placeholder="username"
            required
          />
        </div>

        <div>
          <Label htmlFor="db_password">Database Password</Label>
          <Input
            id="db_password"
            name="db_password"
            type="password"
            value={formData.db_password}
            onChange={handleInputChange}
            placeholder="••••••••"
            required
          />
        </div>

        <div className="flex space-x-4">
          <Button type="submit">
            Create
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleTestConnection}
            disabled={isTesting}
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/datasources')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
} 