'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowUpIcon, ArrowDownIcon, DragHandleDots2Icon, ChevronRightIcon, ChevronDownIcon } from '@radix-ui/react-icons'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import React from 'react'

interface Column {
  name: string
  dataType: string
  ordinal: number
  active: boolean
  filterable?: boolean
  sortable?: boolean
}

interface Table {
  name: string
  type: 'table' | 'view'
  ordinal: number
  active: boolean
  columns: Column[]
}

interface DataLensOrganizerProps {
  initialSchema: Table[]
  onSave: (schema: Table[]) => Promise<void>
  onCancel: () => void
  title?: string
}

function SortableColumn({
  column,
  index,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  isLast,
  onToggleFilterable,
  onToggleSortable
}: {
  column: Column
  index: number
  onToggleActive: (index: number) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  isLast: boolean
  onToggleFilterable?: (index: number) => void
  onToggleSortable?: (index: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: column.name })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 py-2 px-4 ${column.active ? 'bg-white' : 'bg-gray-50'}`}
    >
      <div className="flex items-center gap-2 pl-4">
        <Checkbox
          checked={column.active}
          onCheckedChange={() => onToggleActive(index)}
        />
        <span className="font-medium text-sm">{column.name}</span>
        <span className="text-xs text-gray-500">({column.dataType})</span>
      </div>

      {column.active && (
        <div className="flex items-center gap-2 ml-auto">
          {onToggleFilterable && (
            <div className="flex items-center gap-1">
              <Checkbox
                id={`filter-${column.name}`}
                checked={column.filterable || false}
                onCheckedChange={() => onToggleFilterable(index)}
              />
              <label
                htmlFor={`filter-${column.name}`}
                className="text-xs font-medium cursor-pointer select-none"
              >
                Filterable
              </label>
            </div>
          )}
          {onToggleSortable && (
            <div className="flex items-center gap-1">
              <Checkbox
                id={`sort-${column.name}`}
                checked={column.sortable || false}
                onCheckedChange={() => onToggleSortable(index)}
              />
              <label
                htmlFor={`sort-${column.name}`}
                className="text-xs font-medium cursor-pointer select-none"
              >
                Sortable
              </label>
            </div>
          )}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
              className="h-5 w-5"
            >
              <ArrowUpIcon className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMoveDown(index)}
              disabled={isLast}
              className="h-5 w-5"
            >
              <ArrowDownIcon className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <DragHandleDots2Icon className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function SortableTable({
  table,
  index,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  isLast,
  onColumnOrderChange,
  sensors
}: {
  table: Table
  index: number
  onToggleActive: (index: number) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  isLast: boolean
  onColumnOrderChange: (tableIndex: number, columns: Column[]) => void
  sensors: any
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: table.name })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleColumnMoveUp = (columnIndex: number) => {
    const newColumns = [...table.columns]
    const column = newColumns[columnIndex]
    newColumns.splice(columnIndex, 1)
    newColumns.splice(columnIndex - 1, 0, column)
    newColumns.forEach((col, idx) => {
      col.ordinal = idx + 1
    })
    onColumnOrderChange(index, newColumns)
  }

  const handleColumnMoveDown = (columnIndex: number) => {
    const newColumns = [...table.columns]
    const column = newColumns[columnIndex]
    newColumns.splice(columnIndex, 1)
    newColumns.splice(columnIndex + 1, 0, column)
    newColumns.forEach((col, idx) => {
      col.ordinal = idx + 1
    })
    onColumnOrderChange(index, newColumns)
  }

  const handleColumnToggleActive = (columnIndex: number) => {
    const newColumns = [...table.columns]
    const column = newColumns[columnIndex]
    const newActiveState = !column.active

    if (!newActiveState) {
      newColumns.splice(columnIndex, 1)
      newColumns.push({ ...column, active: newActiveState })
    } else {
      newColumns[columnIndex] = { ...column, active: newActiveState }
    }

    newColumns.forEach((col, idx) => {
      col.ordinal = idx + 1
    })
    onColumnOrderChange(index, newColumns)
  }

  const handleColumnToggleFilterable = (columnIndex: number) => {
    const newColumns = [...table.columns]
    newColumns[columnIndex] = {
      ...newColumns[columnIndex],
      filterable: !newColumns[columnIndex].filterable
    }
    onColumnOrderChange(index, newColumns)
  }

  const handleColumnToggleSortable = (columnIndex: number) => {
    const newColumns = [...table.columns]
    newColumns[columnIndex] = {
      ...newColumns[columnIndex],
      sortable: !newColumns[columnIndex].sortable
    }
    onColumnOrderChange(index, newColumns)
  }

  return (
    <div className="space-y-0">
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-4 p-4 border ${
          isExpanded ? 'rounded-t-lg' : 'rounded-lg'
        } shadow-sm ${
          table.active 
            ? table.type === 'table' 
              ? 'bg-blue-50' 
              : 'bg-green-50'
            : 'bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <Checkbox
            checked={table.active}
            onCheckedChange={() => onToggleActive(index)}
          />
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
            <span className="font-medium">{table.name}</span>
            <span className="text-sm text-gray-500">({table.type})</span>
          </button>
        </div>

        {table.active && (
          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
              className="h-6 w-6"
            >
              <ArrowUpIcon className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMoveDown(index)}
              disabled={isLast}
              className="h-6 w-6"
            >
              <ArrowDownIcon className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <DragHandleDots2Icon className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="border border-t-0 rounded-b-lg">
          <div className="bg-gray-100 px-3 py-1.5 border-b">
            <h3 className="text-sm font-medium">Columns</h3>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => {
              const { active, over } = event
              if (over && active.id !== over.id) {
                const oldIndex = table.columns.findIndex(col => col.name === active.id)
                const newIndex = table.columns.findIndex(col => col.name === over.id)
                const draggedColumn = table.columns[oldIndex]

                if (draggedColumn.active) {
                  const firstInactiveIndex = table.columns.findIndex(col => !col.active)
                  
                  if (firstInactiveIndex !== -1 && newIndex >= firstInactiveIndex) {
                    return
                  }
                }

                const newColumns = arrayMove(table.columns, oldIndex, newIndex)
                newColumns.forEach((col, idx) => {
                  col.ordinal = idx + 1
                })
                onColumnOrderChange(index, newColumns)
              }
            }}
          >
            <SortableContext
              items={table.columns.map(col => col.name)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y">
                {table.columns
                  .sort((a, b) => a.ordinal - b.ordinal)
                  .map((column, colIndex) => (
                    <SortableColumn
                      key={column.name}
                      column={column}
                      index={colIndex}
                      onToggleActive={handleColumnToggleActive}
                      onMoveUp={handleColumnMoveUp}
                      onMoveDown={handleColumnMoveDown}
                      isLast={colIndex === table.columns.length - 1}
                      onToggleFilterable={handleColumnToggleFilterable}
                      onToggleSortable={handleColumnToggleSortable}
                    />
                  ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  )
}

export default function DataLensOrganizer({ initialSchema, onSave, onCancel, title = 'Configure DataLens' }: DataLensOrganizerProps) {
  const [schema, setSchema] = useState<Table[]>(initialSchema)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleActivateAll = () => {
    setSchema(prevSchema => {
      const newSchema = prevSchema.map(table => ({
        ...table,
        active: true,
        columns: table.columns.map(column => ({
          ...column,
          active: true
        }))
      }))
      return newSchema
    })
  }

  const handleDeactivateAll = () => {
    setSchema(prevSchema => {
      const newSchema = prevSchema.map(table => ({
        ...table,
        active: false,
        columns: table.columns.map(column => ({
          ...column,
          active: false
        }))
      }))
      return newSchema
    })
  }

  const handleToggleActive = (index: number) => {
    setSchema(prevSchema => {
      const newSchema = [...prevSchema]
      const table = newSchema[index]
      const newActiveState = !table.active

      if (!newActiveState) {
        newSchema.splice(index, 1)
        newSchema.push({ ...table, active: newActiveState })
      } else {
        const lastActiveIndex = newSchema.findIndex(t => !t.active)
        if (lastActiveIndex === -1) {
          newSchema[index] = { ...table, active: newActiveState }
        } else {
          newSchema.splice(index, 1)
          newSchema.splice(lastActiveIndex, 0, { ...table, active: newActiveState })
        }
      }

      newSchema.forEach((item, idx) => {
        item.ordinal = idx + 1
      })

      return newSchema
    })
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    setSchema(prevSchema => {
      const newSchema = [...prevSchema]
      const table = newSchema[index]
      newSchema.splice(index, 1)
      newSchema.splice(index - 1, 0, table)
      newSchema.forEach((item, idx) => {
        item.ordinal = idx + 1
      })
      return newSchema
    })
  }

  const handleMoveDown = (index: number) => {
    setSchema(prevSchema => {
      if (index === prevSchema.length - 1) return prevSchema
      const newSchema = [...prevSchema]
      const table = newSchema[index]
      newSchema.splice(index, 1)
      newSchema.splice(index + 1, 0, table)
      newSchema.forEach((item, idx) => {
        item.ordinal = idx + 1
      })
      return newSchema
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setSchema(prevSchema => {
        const oldIndex = prevSchema.findIndex(item => item.name === active.id)
        const newIndex = prevSchema.findIndex(item => item.name === over.id)
        const draggedItem = prevSchema[oldIndex]

        if (draggedItem.active) {
          const firstInactiveIndex = prevSchema.findIndex(item => !item.active)
          
          if (firstInactiveIndex !== -1 && newIndex >= firstInactiveIndex) {
            return prevSchema
          }
        }

        const newSchema = arrayMove(prevSchema, oldIndex, newIndex)
        
        newSchema.forEach((item: Table, idx: number) => {
          item.ordinal = idx + 1
        })

        return newSchema
      })
    }
  }

  const handleColumnOrderChange = (tableIndex: number, newColumns: Column[]) => {
    setSchema(prevSchema => {
      const newSchema = [...prevSchema]
      newSchema[tableIndex] = {
        ...newSchema[tableIndex],
        columns: newColumns
      }
      return newSchema
    })
  }

  const handleSave = async () => {
    await onSave(schema)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button variant="outline" onClick={handleActivateAll}>Activate All</Button>
        <Button variant="outline" onClick={handleDeactivateAll}>Deactivate All</Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={schema.map(table => table.name)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {schema
              .sort((a, b) => a.ordinal - b.ordinal)
              .map((table, filteredIndex) => {
                const originalIndex = schema.findIndex(t => t.name === table.name)
                return (
                  <SortableTable
                    key={table.name}
                    table={table}
                    index={originalIndex}
                    onToggleActive={handleToggleActive}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    isLast={originalIndex === schema.length - 1}
                    onColumnOrderChange={handleColumnOrderChange}
                    sensors={sensors}
                  />
                )
              })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
} 