'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../providers'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    moods: 0,
    journals: 0,
    goals: 0,
    habits: 0,
    tasks: 0,
    completedTasks: 0,
    activeHabits: 0,
    currentStreaks: 0,
    avgMoodIntensity: 0,
    goalProgress: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      // Load comprehensive stats
      const [moods, journals, goals, habits, tasks, habitsData, moodsData] = await Promise.all([
        supabase.from('moods').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('habits').select('*').eq('user_id', user.id).eq('is_active', true),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('habits').select('current_streak').eq('user_id', user.id).eq('is_active', true),
        supabase.from('moods').select('intensity').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
      ])

      const completedTasks = tasks.data?.filter(t => t.status === 'completed').length || 0
      const activeHabits = habits.count || 0
      const currentStreaks = habitsData.data?.filter(h => (h.current_streak || 0) > 0).length || 0
      const avgMoodIntensity = moodsData.data?.length > 0 
        ? moodsData.data.reduce((sum, m) => sum + (m.intensity || 0), 0) / moodsData.data.length
        : 0
      const goalProgress = goals.data?.length > 0
        ? goals.data.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.data.length
        : 0

      setStats({
        moods: moods.count || 0,
        journals: journals.count || 0,
        goals: goals.count || 0,
        habits: habits.count || 0,
        tasks: tasks.count || 0,
        completedTasks,
        activeHabits,
        currentStreaks,
        avgMoodIntensity: Math.round(avgMoodIntensity * 10) / 10,
        goalProgress: Math.round(goalProgress)
      })

      // Load recent activity
      const today = new Date()
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      const [recentMoods, recentJournals, recentGoals] = await Promise.all([
        supabase.from('moods').select('*').eq('user_id', user.id).gte('created_at', weekAgo.toISOString()).order('created_at', { ascending: false }).limit(3),
        supabase.from('journal_entries').select('*').eq('user_id', user.id).gte('created_at', weekAgo.toISOString()).order('created_at', { ascending: false }).limit(3),
        supabase.from('goals').select('*').eq('user_id', user.id).gte('updated_at', weekAgo.toISOString()).order('updated_at', { ascending: false }).limit(3)
      ])

      const activities = [
        ...(recentMoods.data || []).map(m => ({ type: 'mood', data: m, icon: '😊' })),
        ...(recentJournals.data || []).map(j => ({ type: 'journal', data: j, icon: '📝' })),
        ...(recentGoals.data || []).map(g => ({ type: 'goal', data: g, icon: '🎯' }))
      ].sort((a, b) => new Date(b.data.created_at || b.data.updated_at).getTime() - new Date(a.data.created_at || a.data.updated_at).getTime())

      setRecentActivity(activities.slice(0, 5))

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
          Here's your productivity dashboard with intelligent insights
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-2xl mb-1">😊</div>
            <div className="text-sm font-medium">Mood: {stats.avgMoodIntensity}/10</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-sm font-medium">{stats.goalProgress}% Goals</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-sm font-medium">{stats.currentStreaks} Streaks</div>
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

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📱 Recent Activity</h2>
        
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{activity.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {activity.type === 'mood' && `Logged mood: ${activity.data.mood}`}
                    {activity.type === 'journal' && `Journal: ${activity.data.title}`}
                    {activity.type === 'goal' && `Goal update: ${activity.data.title}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(activity.data.created_at || activity.data.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🌟</div>
            <p>Start using AniGPT to see your activity here!</p>
          </div>
        )}
      </div>

      {/* Insights & Tips */}
      <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-3">🧠 AI Insights</h2>
        <div className="space-y-2 text-green-100">
          {stats.avgMoodIntensity >= 7 && (
            <p>😊 Your average mood is great ({stats.avgMoodIntensity}/10)! Keep up the positive energy!</p>
          )}
          {stats.currentStreaks >= 3 && (
            <p>🔥 Amazing! You have {stats.currentStreaks} active habit streaks. Consistency is paying off!</p>
          )}
          {stats.goalProgress >= 50 && (
            <p>🎯 Excellent progress on your goals ({stats.goalProgress}% average). You're on track!</p>
          )}
          {stats.journals >= 5 && (
            <p>📝 Great journaling habit! {stats.journals} entries show strong self-reflection skills.</p>
          )}
          {stats.completedTasks >= 10 && (
            <p>✅ Productivity master! {stats.completedTasks} completed tasks show excellent execution.</p>
          )}
          {stats.moods < 3 && stats.journals < 3 && (
            <p>🌟 Start tracking your mood and writing journal entries to unlock personalized insights!</p>
          )}
        </div>
      </div>
    </div>
  )
}
