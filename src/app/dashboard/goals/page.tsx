'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../providers'

interface Goal {
  id: string
  title: string
  description: string | null
  category: string | null
  priority: string | null
  target_date: string | null
  progress: number | null
  status: string | null
  milestones: any | null
  created_at: string
  updated_at: string
}

export default function GoalsPage() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Personal')
  const [priority, setPriority] = useState('medium')
  const [targetDate, setTargetDate] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const categories = [
    'Personal',
    'Career',
    'Health & Fitness',
    'Education',
    'Financial',
    'Relationships',
    'Travel',
    'Creative',
    'Spiritual',
    'Other'
  ]

  useEffect(() => {
    if (user) {
      loadGoals()
    }
  }, [user])

  const loadGoals = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setGoals(data || [])
    } catch (error) {
      console.error('Error loading goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveGoal = async () => {
    if (!user || !title.trim()) return
    
    setSaving(true)
    try {
      const goalData = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        category,
        priority,
        target_date: targetDate || null,
        progress: 0,
        status: 'active'
      }

      if (editingId) {
        const { error } = await supabase
          .from('goals')
          .update({ ...goalData, updated_at: new Date().toISOString() })
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('goals')
          .insert(goalData)
        if (error) throw error
      }
      
      // Reset form
      setTitle('')
      setDescription('')
      setCategory('Personal')
      setPriority('medium')
      setTargetDate('')
      setEditingId(null)
      
      await loadGoals()
      alert(editingId ? 'Goal updated! 🎯' : 'Goal created! 🎯')
    } catch (error: any) {
      alert('Error saving goal: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const updateProgress = async (id: string, newProgress: number) => {
    try {
      const status = newProgress >= 100 ? 'completed' : 'active'
      const { error } = await supabase
        .from('goals')
        .update({ 
          progress: newProgress, 
          status,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)

      if (error) throw error
      await loadGoals()
      
      if (newProgress >= 100) {
        alert('🎉 Congratulations! Goal completed!')
      }
    } catch (error: any) {
      alert('Error updating progress: ' + error.message)
    }
  }

  const editGoal = (goal: Goal) => {
    setEditingId(goal.id)
    setTitle(goal.title)
    setDescription(goal.description || '')
    setCategory(goal.category || 'Personal')
    setPriority(goal.priority || 'medium')
    setTargetDate(goal.target_date || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteGoal = async (id: string) => {
    if (!confirm('Delete this goal?')) return
    
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadGoals()
    } catch (error: any) {
      alert('Error deleting goal: ' + error.message)
    }
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 75) return 'bg-blue-500'
    if (progress >= 50) return 'bg-yellow-500'
    if (progress >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getDaysUntilTarget = (targetDate: string | null) => {
    if (!targetDate) return null
    const today = new Date()
    const target = new Date(targetDate)
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🎯 Goal Mastery</h1>
        <p className="text-gray-600 mt-2">Set, track, and achieve your dreams with intelligent progress monitoring</p>
      </div>

      {/* Goal Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {editingId ? '✏️ Edit Goal' : '➕ Create New Goal'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🎯 Goal Title
            </label>
            <input
              type="text"
              placeholder="Learn Python, Run a Marathon, Start a Business..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Description & Action Plan
            </label>
            <textarea
              placeholder="Describe your goal in detail. What specific steps will you take? What does success look like?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                ⭐ Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Target Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveGoal}
              disabled={saving || !title.trim()}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Saving...' : editingId ? '✏️ Update Goal' : '🎯 Create Goal'}
            </button>
            
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null)
                  setTitle('')
                  setDescription('')
                  setCategory('Personal')
                  setPriority('medium')
                  setTargetDate('')
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Goals Analytics */}
      {goals.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">📊 Goals Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{goals.length}</div>
              <div className="text-sm text-blue-700">Total Goals</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{completedGoals.length}</div>
              <div className="text-sm text-green-700">Completed</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{activeGoals.length}</div>
              <div className="text-sm text-orange-700">Active</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%
              </div>
              <div className="text-sm text-purple-700">Success Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">🎯 Active Goals</h2>
          
          <div className="space-y-4">
            {activeGoals.map((goal) => {
              const daysUntilTarget = getDaysUntilTarget(goal.target_date)
              return (
                <div
                  key={goal.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{goal.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                          {goal.priority?.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <span>📁 {goal.category}</span>
                        {goal.target_date && (
                          <span className={`${daysUntilTarget !== null && daysUntilTarget < 0 ? 'text-red-600 font-medium' : daysUntilTarget !== null && daysUntilTarget <= 7 ? 'text-orange-600 font-medium' : ''}`}>
                            📅 {daysUntilTarget !== null ? (
                              daysUntilTarget < 0 ? `${Math.abs(daysUntilTarget)} days overdue` :
                              daysUntilTarget === 0 ? 'Due today!' :
                              `${daysUntilTarget} days left`
                            ) : new Date(goal.target_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      {goal.description && (
                        <p className="text-gray-700 text-sm mb-3">{goal.description}</p>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress: {goal.progress || 0}%</span>
                          <span className="text-gray-500">
                            {goal.progress || 0}/100%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(goal.progress || 0)}`}
                            style={{ width: `${goal.progress || 0}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={goal.progress || 0}
                            onChange={(e) => updateProgress(goal.id, parseInt(e.target.value))}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => editGoal(goal)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="Edit goal"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete goal"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">✅ Completed Goals</h2>
          
          <div className="space-y-3">
            {completedGoals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <h3 className="font-medium text-green-900">{goal.title}</h3>
                    <p className="text-sm text-green-700">
                      Completed on {new Date(goal.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete goal"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && goals.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-gray-500 mb-4">No goals yet. Set your first goal and start achieving! 🌟</p>
          <p className="text-sm text-gray-400">
            Tip: Start with SMART goals - Specific, Measurable, Achievable, Relevant, Time-bound
          </p>
        </div>
      )}
    </div>
  )
}
