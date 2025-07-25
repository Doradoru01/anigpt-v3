'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../components/AuthProvider'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    moods: 0,
    journals: 0,
    goals: 0,
    habits: 0,
    tasks: 0,
    completedTasks: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      // For now using dummy data, later we'll connect to Supabase
      setStats({
        moods: 5,
        journals: 3,
        goals: 7,
        habits: 4,
        tasks: 12,
        completedTasks: 8
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-blue-100 text-lg mb-4">
          Here is your productivity dashboard with intelligent insights
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-sm font-medium">{stats.moods} Moods</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-sm font-medium">{stats.goals} Goals</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-2xl mb-1">✅</div>
            <div className="text-sm font-medium">{stats.completedTasks} Done</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            title: 'Mood Entries', 
            value: stats.moods, 
            icon: '😊', 
            color: 'blue',
            description: 'Emotional intelligence tracking',
            link: '/dashboard/mood'
          },
          { 
            title: 'Journal Entries', 
            value: stats.journals, 
            icon: '📝', 
            color: 'green',
            description: 'Thoughts and reflections',
            link: '/dashboard/journal'
          },
          { 
            title: 'Active Goals', 
            value: stats.goals, 
            icon: '🎯', 
            color: 'purple',
            description: 'Dreams in progress',
            link: '/dashboard/goals'
          },
          { 
            title: 'Habits Tracked', 
            value: stats.habits, 
            icon: '💪', 
            color: 'orange',
            description: 'Building consistency',
            link: '/dashboard/habits'
          }
        ].map((stat) => (
          <Link
            key={stat.title}
            href={stat.link}
            className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 hover:border-gray-200"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-${stat.color}-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                  {stat.icon}
                </div>
                <div className={`text-3xl font-bold text-${stat.color}-600`}>
                  {stat.value}
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{stat.title}</h3>
              <p className="text-sm text-gray-500">{stat.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'Log Mood', href: '/dashboard/mood', icon: '😊', color: 'bg-blue-500' },
            { title: 'Write Journal', href: '/dashboard/journal', icon: '📝', color: 'bg-green-500' },
            { title: 'Add Goal', href: '/dashboard/goals', icon: '🎯', color: 'bg-purple-500' },
            { title: 'AI Chat', href: '/dashboard/chat', icon: '🤖', color: 'bg-pink-500' }
          ].map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`${action.color} hover:opacity-90 text-white p-4 rounded-lg text-center transition-all duration-200 hover:scale-105 shadow-lg`}
            >
              <div className="text-3xl mb-2">{action.icon}</div>
              <div className="font-medium">{action.title}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🚀 Getting Started</h2>
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">1</span>
            </div>
            <span className="text-gray-700">Track your first mood to understand emotional patterns</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">2</span>
            </div>
            <span className="text-gray-700">Write a journal entry to capture your thoughts</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">3</span>
            </div>
            <span className="text-gray-700">Set your first goal and start achieving it</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-pink-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">4</span>
            </div>
            <span className="text-gray-700">Chat with AI for personalized guidance</span>
          </div>
        </div>
      </div>
    </div>
  )
}
