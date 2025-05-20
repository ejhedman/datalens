# Architecture

## Application Structure

```
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── layout.tsx         # Root layout with NavBanner
│   │   ├── page.tsx           # Home page
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── datasources/  # Database configuration pages
│   │   └── datalens/   # Database lens pages
│   ├── components/
│   │   ├── auth/             # Authentication components
│   │   ├── datasources/ # Database configuration components
│   │   ├── datalens/  # Database lens components
│   │   ├── layout/           # Layout components
│   │   ├── organize/         # Schema organization components
│   │   └── ui/               # Reusable UI components
│   └── lib/                  # Utility functions and types
│       ├── utils.ts
│       ├── jdbc.ts          # JDBC connection utilities
│       └── database.types.ts # Database type definitions
├── docs/                     # Documentation
└── public/                   # Static assets
```

## Design Decisions

### 1. Next.js App Router
- Uses the new App Router for better performance and features
- Server components by default for better performance
- Client components where needed (marked with 'use client')

### 2. Authentication Flow
- Supabase Auth for secure authentication
- Client-side session management
- Protected routes using middleware
- Persistent sessions with automatic token refresh

### 3. Database Management
- Supabase for configuration storage
- JDBC for database connections
- DataLens-based schema organization
- Context-based current database selection

### 4. Component Architecture
- Atomic design principles
- Reusable UI components from shadcn/ui
- Feature-based directory organization
- Clear separation of concerns

### 5. State Management
- React hooks for local state
- Supabase client for auth state
- Database context for current database
- Event-based communication between components

### 6. Styling Approach
- Tailwind CSS for utility-first styling
- Consistent design system
- Responsive design patterns
- Dark mode support (prepared for)

## Key Features

### 1. Database Configuration
- JDBC connection management
- Connection testing
- Secure credential storage
- Database selection persistence

### 2. Database DataLenses
- Schema organization
- Custom views
- DataLens sharing
- Default lens configuration

### 3. Navigation and Layout
- Persistent database selector
- Dynamic navigation based on context
- Responsive design
- User action menus

### 4. Protected Routes
- Middleware-based protection
- Automatic redirects
- Session validation
- Database context validation

## Security Considerations

### 1. Authentication
- Secure password hashing (handled by Supabase)
- JWT token management
- Session persistence
- CSRF protection

### 2. Database Security
- Encrypted credential storage
- Secure JDBC connections
- Connection pooling
- Access control per user

### 3. Data Protection
- Environment variables for sensitive data
- Secure API routes
- Input validation
- XSS prevention

## Performance Optimizations

### 1. Code Splitting
- Automatic by Next.js
- Route-based splitting
- Component-level splitting
- Dynamic imports for heavy features

### 2. Caching
- Static page generation where possible
- Client-side caching
- Database schema caching
- API response caching

### 3. Loading States
- Skeleton loading
- Progress indicators
- Optimistic updates
- Connection state management 