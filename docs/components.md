# Components

## Overview
The application uses a combination of custom components and shadcn/ui components to create a consistent and maintainable UI.

## Database Management Components

### DatabaseList
List component for database configurations.

**Location**: `src/components/datasources/database-list.tsx`

**Features**:
- Displays list of database configurations
- Selection functionality
- New database creation button
- Configure lens button for each database
- Responsive design

**Usage**:
```tsx
<DatabaseList
  databases={databaseConfigs}
  selectedDatabaseId={selectedId}
  onDatabaseSelect={handleSelect}
  onNewDatabase={handleNew}
  onOrganize={handleOrganize}
/>
```

**Props**:
- `databases`: DatabaseConfig[]
- `selectedDatabaseId`: string | null
- `onDatabaseSelect`: (database: DatabaseConfig) => void
- `onNewDatabase`: () => void
- `onOrganize`: (database: DatabaseConfig) => void

### DatabaseSelector
Component for selecting the current working database.

**Location**: `src/components/layout/database-selector.tsx`

**Features**:
- Dropdown selection of databases
- Context provider for database state
- Persistent selection in localStorage
- Event dispatching for database changes

**Usage**:
```tsx
<DatabaseProvider>
  <DatabaseSelector />
</DatabaseProvider>
```

### LensSelector
Component for managing database lenses.

**Location**: `src/components/datalenses/lens-selector.tsx`

**Features**:
- List of database lenses
- DataLens selection
- New lens creation
- DataLens configuration
- Loading states

**Usage**:
```tsx
<LensSelector
  selectedLensId={selectedId}
  onLensSelect={handleSelect}
  onNewLens={handleNew}
  onLensesFetched={handleFetch}
  onFetchLenses={setFetchFn}
  onOrganize={handleOrganize}
/>
```

**Props**:
- `selectedLensId`: string | null
- `onLensSelect`: (lens: DataLens) => void
- `onNewLens`: () => void
- `onLensesFetched?`: (lenses: DataLens[]) => void
- `onFetchLenses?`: (fetchFn: (projectId: string | null) => Promise<void>) => void
- `onOrganize?`: (lens: DataLens) => void

## Layout Components

### NavBanner
The persistent navigation banner that appears on all pages.

**Location**: `src/components/layout/nav-banner.tsx`

**Features**:
- Responsive design
- Dynamic based on auth state
- Dropdown menu for user actions
- Logo/brand display

**Usage**:
```tsx
<NavBanner />
```

**Props**: None (uses Supabase client internally)

## Authentication Components

### LoginForm
Form component for user login.

**Location**: `src/components/auth/login-form.tsx`

**Features**:
- Email/password fields
- Form validation
- Loading states
- Error handling
- Redirect after success

**Usage**:
```tsx
<LoginForm />
```

### RegisterForm
Form component for user registration.

**Location**: `src/components/auth/register-form.tsx`

**Features**:
- Email/password/full name fields
- Form validation
- Loading states
- Error handling
- Redirect after success

**Usage**:
```tsx
<RegisterForm />
```

## UI Components

### Button
Reusable button component from shadcn/ui.

**Location**: `src/components/ui/button.tsx`

**Features**:
- Multiple variants (default, outline, ghost)
- Loading state
- Disabled state
- Icon support

**Usage**:
```tsx
<Button variant="default">Click me</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
```

**Props**:
- `variant`: 'default' | 'outline' | 'ghost'
- `size`: 'default' | 'sm' | 'lg'
- `disabled`: boolean
- `isLoading`: boolean

### DropdownMenu
Dropdown menu component from shadcn/ui.

**Location**: `src/components/ui/dropdown-menu.tsx`

**Features**:
- Accessible dropdown menu
- Keyboard navigation
- Custom positioning
- Animation support

**Usage**:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item 1</DropdownMenuItem>
    <DropdownMenuItem>Item 2</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Components**:
- `DropdownMenu`: Root component
- `DropdownMenuTrigger`: Button that opens the menu
- `DropdownMenuContent`: Content container
- `DropdownMenuItem`: Menu items

## Page Components

### Home Page
**Location**: `src/app/page.tsx`

**Features**:
- Welcome message
- Call-to-action buttons
- Responsive layout

### Login Page
**Location**: `src/app/login/page.tsx`

**Features**:
- Login form
- Link to registration
- Session check
- Redirect if authenticated

### Register Page
**Location**: `src/app/register/page.tsx`

**Features**:
- Registration form
- Link to login
- Session check
- Redirect if authenticated

### Dashboard Page
**Location**: `src/app/dashboard/page.tsx`

**Features**:
- Protected route
- User greeting
- Session check
- Redirect if not authenticated

## Component Guidelines

### 1. Naming Conventions
- Use PascalCase for component names
- Use kebab-case for file names
- Prefix UI components with appropriate category

### 2. File Organization
- Group related components in directories
- Keep components focused and single-responsibility
- Use index files for clean exports

### 3. Props
- Use TypeScript interfaces for props
- Document required and optional props
- Provide default values where appropriate

### 4. Styling
- Use Tailwind CSS classes
- Follow consistent spacing and sizing
- Maintain responsive design
- Use design tokens for colors and typography

### 5. Accessibility
- Include proper ARIA labels
- Ensure keyboard navigation
- Maintain proper heading hierarchy
- Use semantic HTML elements

## Best Practices

### 1. Component Structure
```tsx
// Example component structure
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface MyComponentProps {
  title: string
  onClick?: () => void
}

export function MyComponent({ title, onClick }: MyComponentProps) {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">{title}</h2>
      <Button onClick={onClick} isLoading={isLoading}>
        Click me
      </Button>
    </div>
  )
}
```

### 2. Error Handling
```tsx
// Example error handling
const [error, setError] = useState<string | null>(null)

try {
  // Operation
} catch (err) {
  setError(err.message)
} finally {
  setIsLoading(false)
}

{error && (
  <div className="text-red-500 mt-2">
    {error}
  </div>
)}
```

### 3. Loading States
```tsx
// Example loading state
<Button isLoading={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</Button>
```

### 4. Form Handling
```tsx
// Example form handling
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  try {
    // Form submission
  } catch (err) {
    setError(err.message)
  } finally {
    setIsLoading(false)
  }
}
```

## Component Organization

### Directory Structure
```
src/components/
├── auth/                    # Authentication components
├── datasources/        # Database configuration components
├── datalens/         # Database lens components
├── layout/                  # Layout components
├── ui/                      # Reusable UI components
└── organize/               # Schema organization components
```

### Component Categories
1. **Auth Components**: Handle user authentication and registration
2. **Database Components**: Manage database configurations and lenses
3. **Layout Components**: Structure the application layout
4. **UI Components**: Reusable UI elements
5. **Organization Components**: Handle schema and lens organization

// ... rest of existing documentation ... 