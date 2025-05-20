import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface ReadDDLDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (schema: any) => void
  jdbcUrl: string
  username: string
  password: string
}

export function ReadDDLDialog({ isOpen, onClose, onSave, jdbcUrl, username, password }: ReadDDLDialogProps) {
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)
  const [currentTable, setCurrentTable] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [schema, setSchema] = useState<any[]>([])
  const [showConfirmation, setShowConfirmation] = useState(true)

  // Reset state when dialog is opened
  useEffect(() => {
    if (isOpen) {
      setProgress(0)
      setTotal(0)
      setCurrentTable('')
      setIsLoading(false)
      setSchema([])
      setShowConfirmation(true)
    }
  }, [isOpen])

  const handleReadDDL = async () => {
    setShowConfirmation(false)
    setIsLoading(true)
    setProgress(0)
    setTotal(0)
    setCurrentTable('')
    setSchema([])

    try {
      const response = await fetch('/api/datasources/read-ddl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jdbcUrl,
          username,
          password,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to read DDL')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to read response')
      }

      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Decode the chunk and add it to our buffer
        buffer += new TextDecoder().decode(value)
        
        // Process complete messages
        const messages = buffer.split('\n\n')
        buffer = messages.pop() || '' // Keep the last incomplete message in the buffer

        for (const message of messages) {
          if (!message.trim()) continue
          
          try {
            const data = JSON.parse(message.replace('data: ', ''))
            
            if (data.type === 'progress') {
              setProgress(data.data.current)
              setTotal(data.data.total)
              setCurrentTable(data.data.currentTable)
            } else if (data.type === 'complete') {
              setProgress(data.data.total)
              setTotal(data.data.total)
              setCurrentTable('Complete')
              setSchema(data.data.schema)
            } else if (data.type === 'error') {
              throw new Error(data.error)
            }
          } catch (error) {
            console.error('Error parsing message:', error, 'Message:', message)
            continue
          }
        }
      }
    } catch (error: any) {
      console.error('Error reading DDL:', error)
      toast.error(error.message || 'Failed to read DDL')
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = () => {
    if (schema.length > 0) {
      try {
        onSave(schema)
        onClose()
      } catch (error: any) {
        console.error('Error saving schema:', error)
        toast.error('Failed to save schema')
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[510px]">
        <DialogHeader>
          <DialogTitle>Read Database Schema</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {showConfirmation && (
            <div className="text-center">
              <p className="mb-4">This will overwrite the current DataLens configuration with the schema from the database. All customizations will be lost.</p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleReadDDL}>Read Schema</Button>
              </div>
            </div>
          )}

          {!showConfirmation && !isLoading && schema.length === 0 && (
            <div className="text-center">
              <p className="mb-4">Click Start to begin reading the database schema.</p>
              <Button onClick={handleReadDDL}>Start</Button>
            </div>
          )}

          {!showConfirmation && isLoading && (
            <div className="space-y-4 min-h-[100px] flex flex-col justify-center">
              <Progress value={(progress / total) * 100} />
              <div className="h-6 w-full flex items-center justify-between px-4">
                <p className="text-sm truncate">
                  {currentTable}
                </p>
                <p className="text-sm text-gray-500">
                  {progress} of {total}
                </p>
              </div>
            </div>
          )}

          {!showConfirmation && schema.length > 0 && !isLoading && (
            <div className="space-y-4 min-h-[100px] flex flex-col justify-center">
              <div className="w-full px-4">
                <p className="text-sm text-center text-green-600">
                  Schema reading complete! Found {schema.length} tables/views.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!showConfirmation && schema.length > 0 && (
            <Button onClick={handleSave}>
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 