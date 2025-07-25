'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../components/AuthProvider'
import { Mail, Brain, Target, TrendingUp, Sparkles, ArrowRight } from 'lucide-react'

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
      setMessage('❌ Authentication failed. Please try again.')
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
    } catch (error: any) {
      console.error('Sign in error:', error)
      setMessage(`❌ Error: ${error.message}`)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-pink-500/10 rounded-full blur-xl animate-pulse delay-500" />
      </div>
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full mb-6 shadow-2xl">
              <Brain className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-6xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                AniGPT V3
              </span>
            </h1>
            <p className="text-white/90 text-xl mb-3">
              Your AI-Powered Productivity Platform
            </p>
            <p className="text-white/70">
              🚀 Advanced • 🧠 Intelligent • ☁️ Cloud-Native • 🔒 Secure
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-12">
            {[
              { icon: Target, text: "Smart Goals", desc: "AI-driven tracking" },
              { icon: TrendingUp, text: "Mood Analytics", desc: "Emotional insights" },
              { icon: Brain, text: "GPT-4 Chat", desc: "Real AI conversations" },
              { icon: Sparkles, text: "Auto Insights", desc: "Pattern recognition" }
            ].map(({ icon: Icon, text, desc }) => (
              <div key={text} className="group bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <Icon className="w-8 h-8 text-white mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-white font-semibold text-sm mb-1">{text}</p>
                <p className="text-white/60 text-xs">{desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Get Started</h2>
              <p className="text-white/70">Enter your email to receive a magic link</p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <label className="block text-white/90 text-sm font-medium mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent backdrop-blur-sm"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Sending Magic Link...
                  </>
                ) : (
                  <>
                    Send Magic Link
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
            
            {message && (
              <div className={`mt-6 p-4 rounded-xl text-sm text-center ${
                message.includes('Error') 
                  ? 'bg-red-500/20 text-red-100 border border-red-500/30' 
                  : 'bg-green-500/20 text-green-100 border border-green-500/30'
              }`}>
                {message}
              </div>
            )}
          </div>

          <div className="text-center mt-8">
            <p className="text-white/60 text-sm mb-2">
              ✨ No password required - secure magic link authentication
            </p>
            <p className="text-white/40 text-xs">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
