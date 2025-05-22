import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Exchange the code for a session
    const { data: { session }, error: signInError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (signInError) {
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(signInError.message)}`)
    }

    // Check if this is a new user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(userError?.message || 'User not found')}`)
    }

    // Get the user's identities to check the OAuth provider
    const { data: identities, error: identitiesError } = await supabase
      .from('identities')
      .select('provider')
      .eq('user_id', user.id)

    if (identitiesError) {
      console.error('Error fetching identities:', identitiesError)
    } else {
      console.log('User authentication providers:', identities)
    }

    // Check if the user exists in the lenses table
    const { data: lens, error: lensError } = await supabase
      .from('lenses')
      .select('id')
      .eq('id', user.id)
      .single()

    if (lensError) {
      // If there's an error checking the lens, create it
      const { error: insertError } = await supabase
        .from('lenses')
        .insert([
          {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata.full_name || user.email?.split('@')[0] || 'User',
            updated_at: new Date().toISOString(),
            auth_provider: identities?.[0]?.provider || 'email' // Store the auth provider
          }
        ])

      if (insertError) {
        console.error('Error creating lens:', insertError)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent('Error creating user lens')}`)
      }
    }

    // If we get here, either the lens exists or was just created
    return NextResponse.redirect(`${requestUrl.origin}/`)
  }

  // If no code is present, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`)
} 