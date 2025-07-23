'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../providers'

export default function DebugPage() {
  const { user, session, loading } = useAuth()
  const [sessionData, setSessionData] = useState<any>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSessionData(data)
    }
    checkSession()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">🐛 Debug Information</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded">
            <h3 className="font-semibold">Auth Context</h3>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
            <p>User: {user ? user.email : 'Not logged in'}</p>
            <p>Session: {session ? 'Exists' : 'None'}</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded">
            <h3 className="font-semibold">Direct Session Check</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
              {JSON.stringify(sessionData, null, 2)}
            </pre>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded">
            <h3 className="font-semibold">Current URL</h3>
            <p className="text-sm break-all">{typeof window !== 'undefined' ? window.location.href : 'Server'}</p>
          </div>
        </div>
        
        <div className="mt-6 space-x-4">
          <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Go to Login
          </a>
          <a href="/dashboard" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
