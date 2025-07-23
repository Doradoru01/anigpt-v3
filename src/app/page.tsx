'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from './providers'

export default function HomePage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      setMessage('❌ Login failed. Please try again.')
    }

    if (user && !authLoading) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router, searchParams])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) throw error
      setMessage('🚀 Check your email for the magic link!')
    } catch (error) {
      setMessage('❌ Error sending magic link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">🤖 AniGPT V3</h1>
          <p className="text-white/90 text-xl">Your AI Productivity Companion</p>
          <p className="text-white/70 text-sm mt-2">✨ Cloud-Native • 🧠 Intelligent • 🔒 Secure</p>
        </div>
        
        <form onSubmit={handleSignIn} className="space-y-6">
          <div>
            <label className="block text-white/90 text-sm font-medium mb-3">
              Email Address
            </label>
            <input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-pink-400 backdrop-blur-sm"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 p-4 rounded-xl text-white font-semibold hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Sending Magic Link...
              </div>
            ) : (
              'Send Magic Link 🚀'
            )}
          </button>
        </form>
        
        {message && (
          <div className={`mt-6 p-4 rounded-xl text-sm text-center backdrop-blur-sm ${
            message.includes('Error') || message.includes('❌')
              ? 'bg-red-500/20 text-red-100 border border-red-500/30' 
              : 'bg-green-500/20 text-green-100 border border-green-500/30'
          }`}>
            {message}
          </div>
        )}
        
        <div className="text-center mt-6">
          <p className="text-white/60 text-xs">
            No password required - secure magic link authentication
          </p>
        </div>
      </div>
    </div>
  )
}
