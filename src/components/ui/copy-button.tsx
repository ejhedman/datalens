'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import yaml from 'js-yaml'

interface CopyButtonProps {
  data: any
  className?: string
}

export function CopyButton({ data, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      const yamlString = yaml.dump(data, {
        indent: 2,
        lineWidth: -1, // No line wrapping
        noRefs: true, // Don't use YAML references
        sortKeys: false, // Maintain original key order
      })
      await navigator.clipboard.writeText(yamlString)
      setCopied(true)
      toast.success('YAML copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleCopy}
      className={className}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" />
          Copy as YAML
        </>
      )}
    </Button>
  )
} 