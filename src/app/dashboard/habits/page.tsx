'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../providers'

interface Habit {
  id: string
  name: string
  description: string | null
  category: string | null
  target_frequency: string | null
  current_streak: number | null
  best_streak: number | null
  total_completions: number | null
  is_active: boolean | null
  created_at: string
}

interface HabitCompletion {
  id: string
  habit_id: string
  completed_date: string
  notes: string | null
  rating: number | null
}

export default function HabitsPage() {
  const { user } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<HabitCompletion[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Health & Fitness')
  const [targetFrequency, setTargetFrequency] = useState('Daily')
  const [editingId, setEditingId] = useState<string | null>(null)

  const categories = [
    'Health & Fitness',
    'Learning & Education',
    'Productivity',
    'Wellness & Mindfulness',
    'Creative & Hobbies',
    'Financial',
    'Social & Relationships',
    'Personal Development',
    'Spiritual',
    'Other'
  ]

  const frequencies = [
    'Daily',
    'Weekdays (5x/week)',
    '3x per week',
    'Weekly',
    'Monthly'
  ]

  useEffect(() => {
    if (user) {
      loadHabits()
      loadCompletions()
    }
  }, [user])

  const loadHabits = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setHabits(data || [])
    } catch (error) {
      console.error('Error loading habits:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCompletions = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_date', { ascending: false })

      if (error) throw error
      setCompletions(data || [])
    } catch (error) {
      console.error('Error loading completions:', error)
    }
  }

  const saveHabit = async () => {
    if (!user || !name.trim()) return
    
    setSaving(true)
    try {
      const habitData = {
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        category,
        target_frequency: targetFrequency,
        current_streak: 0,
        best_streak: 0,
        total_completions: 0,
        is_active: true
      }

      if (editingId) {
        const { error } = await supabase
          .from('habits')
          .update(habitData)
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('habits')
          .insert(habitData)
        if (error) throw error
      }
      
      // Reset form
      setName('')
      setDescription('')
      setCategory('Health & Fitness')
      setTargetFrequency('Daily')
      setEditingId(null)
      
      await loadHabits()
      alert(editingId ? 'Habit updated! 💪' : 'Habit created! 💪')
    } catch (error: any) {
      alert('Error saving habit: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const completeHabit = async (habitId: string, rating: number = 5, notes: string = '') => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Check if already completed today
      const existingCompletion = completions.find(
        c => c.habit_id === habitId && c.completed_date === today
      )
      
      if (existingCompletion) {
        alert('Habit already completed today! 🎉')
        return
      }

      // Add completion
      const { error: completionError } = await supabase
        .from('habit_completions')
        .insert({
          habit_id: habitId,
          user_id: user.id,
          completed_date: today,
          notes: notes || null,
          rating
        })

      if (completionError) throw completionError

      // Update habit streaks and counts
      const habit = habits.find(h => h.id === habitId)
      if (habit) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]
        
        const wasCompletedYesterday = completions.some(
          c => c.habit_id === habitId && c.completed_date === yesterdayStr
        )

        const newStreak = wasCompletedYesterday ? (habit.current_streak || 0) + 1 : 1
        const newBestStreak = Math.max(habit.best_streak || 0, newStreak)
        const newTotalCompletions = (habit.total_completions || 0) + 1

        const { error: habitError } = await supabase
          .from('habits')
          .update({
            current_streak: newStreak,
            best_streak: newBestStreak,
            total_completions: newTotalCompletions
          })
          .eq('id', habitId)

        if (habitError) throw habitError
      }

      await loadHabits()
      await loadCompletions()
      alert(`🔥 Great job! Streak: ${habit?.current_streak ? (habit.current_streak + 1) : 1} days!`)
    } catch (error: any) {
      alert('Error completing habit: ' + error.message)
    }
  }

  const editHabit = (habit: Habit) => {
    setEditingId(habit.id)
    setName(habit.name)
    setDescription(habit.description || '')
    setCategory(habit.category || 'Health & Fitness')
    setTargetFrequency(habit.target_frequency || 'Daily')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteHabit = async (id: string) => {
    if (!confirm('Delete this habit? This will also delete all completion records.')) return
    
    try {
      // Delete completions first
      await supabase
        .from('habit_completions')
        .delete()
        .eq('habit_id', id)

      // Delete habit
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadHabits()
      await loadCompletions()
    } catch (error: any) {
      alert('Error deleting habit: ' + error.message)
    }
  }

  const getStreakEmoji = (streak: number) => {
    if (streak >= 100) return '🏆'
    if (streak >= 50) return '🥇'
    if (streak >= 30) return '🌟'
    if (streak >= 14) return '🔥'
    if (streak >= 7) return '⚡'
    if (streak >= 3) return '💪'
    return '🌱'
  }

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-600'
    if (streak >= 14) return 'text-red-600'
    if (streak >= 7) return 'text-orange-600'
    if (streak >= 3) return 'text-blue-600'
    return 'text-gray-600'
  }

  const isCompletedToday = (habitId: string) => {
    const today = new Date().toISOString().split('T')[0]
    return completions.some(c => c.habit_id === habitId && c.completed_date === today)
  }

  const getSuccessRate = (habit: Habit) => {
    const daysSinceCreated = Math.max(1, Math.floor((Date.now() - new Date(habit.created_at).getTime()) / (1000 * 60 * 60 * 24)))
    return Math.round(((habit.total_completions || 0) / daysSinceCreated) * 100)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">💪 Habit Builder</h1>
        <p className="text-gray-600 mt-2">Build powerful habits with streak tracking and smart analytics</p>
      </div>

      {/* Habit Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {editingId ? '✏️ Edit Habit' : '➕ Create New Habit'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💪 Habit Name
            </label>
            <input
              type="text"
              placeholder="Daily Exercise, Read 20 Pages, Meditate 10 Minutes..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Description & Why It Matters
            </label>
            <textarea
              placeholder="Describe your habit and why it's important to you. What benefits do you expect?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📁 Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔄 Target Frequency
              </label>
              <select
                value={targetFrequency}
                onChange={(e) => setTargetFrequency(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {frequencies.map((freq) => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Habit Success Tips</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Start small (2-minute rule) - make it so easy you can't say no</li>
              <li>• Be consistent over perfect - progress beats perfection</li>
              <li>• Stack habits - attach new habit to existing routine</li>
              <li>• Track daily - what gets measured gets managed</li>
              <li>• Celebrate wins - acknowledge every completion</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveHabit}
              disabled={saving || !name.trim()}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Saving...' : editingId ? '✏️ Update Habit' : '💪 Create Habit'}
            </button>
            
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null)
                  setName('')
                  setDescription('')
                  setCategory('Health & Fitness')
                  setTargetFrequency('Daily')
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Habits Analytics */}
      {habits.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">📊 Habits Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{habits.length}</div>
              <div className="text-sm text-blue-700">Active Habits</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {habits.reduce((sum, h) => sum + (h.total_completions || 0), 0)}
              </div>
              <div className="text-sm text-green-700">Total Completions</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.max(...habits.map(h => h.current_streak || 0), 0)}
              </div>
              <div className="text-sm text-orange-700">Longest Current Streak</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {habits.filter(h => isCompletedToday(h.id)).length}
              </div>
              <div className="text-sm text-purple-700">Completed Today</div>
            </div>
          </div>
        </div>
      )}

      {/* Habits List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">🔥 Your Habit Dashboard</h2>
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : habits.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">💪</div>
            <p className="text-gray-500 mb-4">No habits yet. Create your first habit and start building! 🌟</p>
            <p className="text-sm text-gray-400">
              Tip: Start with just one small habit. Research shows it takes 66 days on average to form a new habit.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {habits.map((habit) => {
              const completedToday = isCompletedToday(habit.id)
              const successRate = getSuccessRate(habit)
              
              return (
                <div
                  key={habit.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    completedToday ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">{habit.name}</h3>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {habit.category}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                          {habit.target_frequency}
                        </span>
                      </div>
                      
                      {habit.description && (
                        <p className="text-gray-600 text-sm mb-3">{habit.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <div className={`text-xl font-bold ${getStreakColor(habit.current_streak || 0)}`}>
                            {getStreakEmoji(habit.current_streak || 0)} {habit.current_streak || 0}
                          </div>
                          <div className="text-xs text-gray-500">Current Streak</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-xl font-bold text-purple-600">
                            🏆 {habit.best_streak || 0}
                          </div>
                          <div className="text-xs text-gray-500">Best Streak</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-600">
                            ✅ {habit.total_completions || 0}
                          </div>
                          <div className="text-xs text-gray-500">Total Done</div>
                        </div>
                        
                        <div className="text-center">
                          <div className={`text-xl font-bold ${successRate >= 70 ? 'text-green-600' : successRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                            �� {successRate}%
                          </div>
                          <div className="text-xs text-gray-500">Success Rate</div>
                        </div>
                      </div>

                      {/* Streak Visualization */}
                      <div className="mb-3">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-xs text-gray-500">Last 14 days:</span>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: 14 }, (_, i) => {
                            const date = new Date()
                            date.setDate(date.getDate() - (13 - i))
                            const dateStr = date.toISOString().split('T')[0]
                            const completed = completions.some(c => c.habit_id === habit.id && c.completed_date === dateStr)
                            
                            return (
                              <div
                                key={i}
                                className={`w-4 h-4 rounded-sm ${
                                  completed ? 'bg-green-500' : 'bg-gray-200'
                                }`}
                                title={`${dateStr}: ${completed ? 'Completed' : 'Not completed'}`}
                              />
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {completedToday ? (
                        <div className="text-center">
                          <div className="text-2xl">✅</div>
                          <div className="text-xs text-green-600 font-medium">Done Today!</div>
                        </div>
                      ) : (
                        <button
                          onClick={() => completeHabit(habit.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm"
                        >
                          ✅ Mark Done
                        </button>
                      )}
                      
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => editHabit(habit)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title="Edit habit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteHabit(habit.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete habit"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Motivational Section */}
      {habits.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-3">🌟 Habit Insights</h3>
          <div className="space-y-2 text-blue-100">
            {habits.some(h => (h.current_streak || 0) >= 21) && (
              <p>🎉 Amazing! You have habits with 21+ day streaks. That's when habits become automatic!</p>
            )}
            {habits.some(h => (h.current_streak || 0) >= 7) && (
              <p>🔥 Great job on your week-long streaks! Consistency is building.</p>
            )}
            {habits.filter(h => isCompletedToday(h.id)).length === habits.length && habits.length > 0 && (
              <p>🏆 Perfect day! All habits completed. You're unstoppable!</p>
            )}
            {habits.length >= 3 && (
              <p>💪 You're tracking {habits.length} habits. Remember: quality over quantity for lasting change.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
