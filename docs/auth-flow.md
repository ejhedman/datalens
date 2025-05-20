# Authentication Flow

## Overview
The application uses Supabase Authentication for secure user management. The authentication flow is implemented using client-side components with server-side validation. Both email/password and OAuth (Google) authentication methods are supported.

## Authentication States

### 1. Unauthenticated State
- User sees login/register buttons in navigation
- Access to public pages only
- Automatic redirect to login for protected routes

### 2. Authenticated State
- User sees their email with dropdown in navigation
- Access to all pages including protected routes
- Session persistence across page refreshes

## Authentication Processes

### 1. Registration Flow
1. User navigates to `/register`
2. Fills out registration form:
   - Email address
   - Password
   - Full name
3. Form validation:
   - Email format check
   - Password strength requirements
   - Required fields validation
4. On submit:
   - Show loading state
   - Create user in Supabase
   - Store additional user data
   - Redirect to dashboard
   - Show success message

### 2. Login Flow
1. User navigates to `/login`
2. Options for authentication:
   a. Email/Password:
      - Fill out login form
      - Form validation
      - Submit credentials
   b. Google OAuth:
      - Click "Continue with Google" button
      - Redirect to Google consent screen
      - Handle OAuth callback
3. On successful authentication:
   - Store session
   - Redirect to dashboard
   - Show success message

### 3. OAuth Flow
1. User clicks "Continue with Google" button
2. Redirect to Google consent screen
3. User authorizes the application
4. Google redirects back to callback URL
5. Supabase handles the OAuth callback:
   - Validates the OAuth response
   - Creates or updates user account
   - Establishes session
   - Redirects to dashboard

### 4. Logout Flow
1. User clicks dropdown menu in navigation
2. Selects "Sign out" option
3. Process:
   - Clear session
   - Update UI state
   - Redirect to home page
   - Show success message

## Session Management

### 1. Session Storage
- JWT tokens stored securely
- Automatic token refresh
- Session persistence across tabs

### 2. Session Validation
- Middleware checks on protected routes
- Client-side session checks
- Automatic redirects based on auth state

### 3. Session Recovery
- Automatic session restoration
- Token refresh handling
- Error recovery

## Security Measures

### 1. Password Security
- Secure hashing (handled by Supabase)
- Password strength requirements
- Rate limiting on attempts

### 2. OAuth Security
- Secure OAuth flow
- State parameter validation
- PKCE support
- Secure token storage

### 3. Token Security
- JWT token management
- Secure storage
- Automatic refresh

### 4. Route Protection
- Middleware validation
- Client-side checks
- Automatic redirects

## Error Handling

### 1. Authentication Errors
- Invalid credentials
- Network errors
- Rate limiting
- Account locked
- OAuth errors

### 2. Session Errors
- Token expired
- Invalid token
- Network issues

### 3. User Feedback
- Clear error messages
- Loading states
- Success notifications

## Implementation Details

### 1. Client Components
```typescript
// Example of auth state management
const [isLoggedIn, setIsLoggedIn] = useState(false)
const [userEmail, setUserEmail] = useState<string | null>(null)

useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setIsLoggedIn(!!session)
    setUserEmail(session?.user?.email ?? null)
  })

  return () => subscription.unsubscribe()
}, [])
```

### 2. OAuth Implementation
```typescript
// Example of OAuth sign in
const handleGoogleSignIn = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  } catch (error) {
    console.error('Error signing in with Google:', error)
  }
}
```

### 3. Protected Routes
```typescript
// Example of route protection
export default function Dashboard() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      }
    }
    checkSession()
  }, [router, supabase])
}
```

### 4. Authentication Forms
```typescript
// Example of form handling
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    router.push('/dashboard')
  } catch (error) {
    setError(error.message)
  } finally {
    setIsLoading(false)
  }
}
``` 