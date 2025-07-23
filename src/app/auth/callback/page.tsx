'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('processing')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('processing')
        
        // Check if we have the required parameters
        const code = searchParams.get('code')
        
        if (!code) {
          console.error('No auth code found in URL')
          setStatus('error')
          setTimeout(() => router.push('/?error=no_code'), 2000)
          return
        }

        console.log('Processing auth code:', code.substring(0, 10) + '...')

        // Exchange code for session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
          console.error('Auth exchange error:', error)
          setStatus('error')
          setTimeout(() => router.push('/?error=exchange_failed'), 2000)
          return
        }

        if (data?.session) {
          console.log('Session created successfully')
          setStatus('success')
          
          // Small delay to ensure session is set
          setTimeout(() => {
            router.push('/dashboard')
          }, 1000)
        } else {
          console.error('No session created')
          setStatus('error')
          setTimeout(() => router.push('/?error=no_session'), 2000)
        }
        
      } catch (error) {
        console.error('Callback processing error:', error)
        setStatus('error')
        setTimeout(() => router.push('/?error=callback_failed'), 2000)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center max-w-md w-full">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Signing you in...</h2>
            <p className="text-white/80">Processing your authentication</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
            <p className="text-white/80">Redirecting to dashboard...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-white mb-2">Authentication Failed</h2>
            <p className="text-white/80">Redirecting back to login...</p>
          </>
        )}
      </div>
    </div>
  )
}
