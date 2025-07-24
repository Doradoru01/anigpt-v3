'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../providers'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export default function ChatPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const quickPrompts = [
    "💪 Give me motivation for today",
    "🎯 Help me be more productive", 
    "😊 I need some encouragement",
    "📋 How to organize my tasks better?"
  ]

  useEffect(() => {
    if (user) {
      loadChatHistory()
    }
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadChatHistory = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(20)

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading chat:', error)
    }
  }

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || !user || loading) return
    
    setLoading(true)
    setInput('')
    
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userId: user.id
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }
      
      // Add AI response
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, aiMessage])
      
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again! 🤖',
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900">🤖 AI Companion</h1>
        <p className="text-gray-600">Your personal AI coach for motivation and guidance</p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Welcome to your AI Companion!
              </h3>
              <p className="text-gray-500 mb-6">
                Ask me anything or try one of these suggestions:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-lg mx-auto">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(prompt)}
                    disabled={loading}
                    className="p-3 text-left text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">
                        {message.role === 'user' ? '👤' : '🤖'}
                      </span>
                      <div className="flex-1">
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        <div
                          className={`text-xs mt-1 ${
                            message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                          }`}
                        >
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 max-w-xs px-4 py-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🤖</span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              disabled={loading}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? '⏳' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
