'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../providers'

interface Task {
  id: string
  title: string
  description: string | null
  priority: string | null
  due_date: string | null
  category: string | null
  status: string | null
  estimated_duration: number | null
  actual_duration: number | null
  completed_at: string | null
  created_at: string
}

export default function TasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [category, setCategory] = useState('Personal')
  const [estimatedDuration, setEstimatedDuration] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const priorities = [
    { value: 'low', label: '🟢 Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: '🟡 Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: '🔴 High', color: 'bg-red-100 text-red-800' }
  ]

  const categories = [
    'Personal',
    'Work',
    'Shopping',
    'Health',
    'Learning',
    'Social',
    'Finance',
    'Goals',
    'Household',
    'Other'
  ]

  const statuses = [
    { value: 'pending', label: '⏳ Pending', color: 'bg-gray-100 text-gray-800' },
    { value: 'in_progress', label: '🔄 In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: '✅ Completed', color: 'bg-green-100 text-green-800' }
  ]

  useEffect(() => {
    if (user) {
      loadTasks()
    }
  }, [user])

  const loadTasks = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveTask = async () => {
    if (!user || !title.trim()) return
    
    setSaving(true)
    try {
      const taskData = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        priority,
        due_date: dueDate || null,
        category,
        estimated_duration: estimatedDuration ? parseInt(estimatedDuration) : null,
        status: 'pending'
      }

      if (editingId) {
        const { error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert(taskData)
        if (error) throw error
      }
      
      // Reset form
      setTitle('')
      setDescription('')
      setPriority('medium')
      setDueDate('')
      setCategory('Personal')
      setEstimatedDuration('')
      setEditingId(null)
      
      await loadTasks()
      alert(editingId ? 'Task updated! 📋' : 'Task created! 📋')
    } catch (error: any) {
      alert('Error saving task: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const updateData: any = { 
        status: newStatus 
      }
      
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString()
      } else if (newStatus === 'pending' || newStatus === 'in_progress') {
        updateData.completed_at = null
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

      if (error) throw error
      await loadTasks()
      
      if (newStatus === 'completed') {
        alert('🎉 Task completed! Great job!')
      }
    } catch (error: any) {
      alert('Error updating task: ' + error.message)
    }
  }

  const editTask = (task: Task) => {
    setEditingId(task.id)
    setTitle(task.title)
    setDescription(task.description || '')
    setPriority(task.priority || 'medium')
    setDueDate(task.due_date || '')
    setCategory(task.category || 'Personal')
    setEstimatedDuration(task.estimated_duration ? task.estimated_duration.toString() : '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadTasks()
    } catch (error: any) {
      alert('Error deleting task: ' + error.message)
    }
  }

  const getPriorityInfo = (priority: string | null) => {
    return priorities.find(p => p.value === priority) || priorities[1]
  }

  const getStatusInfo = (status: string | null) => {
    return statuses.find(s => s.value === status) || statuses[0]
  }

  const getDueDateStatus = (dueDate: string | null) => {
    if (!dueDate) return null
    
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { text: `${Math.abs(diffDays)} days overdue`, color: 'text-red-600' }
    if (diffDays === 0) return { text: 'Due today', color: 'text-orange-600' }
    if (diffDays === 1) return { text: 'Due tomorrow', color: 'text-yellow-600' }
    if (diffDays <= 7) return { text: `Due in ${diffDays} days`, color: 'text-blue-600' }
    return { text: `Due in ${diffDays} days`, color: 'text-gray-600' }
  }

  const sortTasksByPriority = (tasks: Task[]) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return [...tasks].sort((a, b) => {
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1
      return bPriority - aPriority
    })
  }

  const pendingTasks = sortTasksByPriority(tasks.filter(t => t.status === 'pending'))
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📋 Task Command Center</h1>
        <p className="text-gray-600 mt-2">Organize and prioritize your tasks with intelligent workflow management</p>
      </div>

      {/* Task Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {editingId ? '✏️ Edit Task' : '➕ Add New Task'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📋 Task Title
            </label>
            <input
              type="text"
              placeholder="Complete presentation, Call dentist, Buy groceries..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Task Details (optional)
            </label>
            <textarea
              placeholder="Additional context, requirements, or notes for this task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🚨 Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {priorities.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

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
                ⏱️ Est. Duration (min)
              </label>
              <input
                type="number"
                placeholder="30"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                min="1"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveTask}
              disabled={saving || !title.trim()}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Saving...' : editingId ? '✏️ Update Task' : '📋 Add Task'}
            </button>
            
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null)
                  setTitle('')
                  setDescription('')
                  setPriority('medium')
                  setDueDate('')
                  setCategory('Personal')
                  setEstimatedDuration('')
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tasks Analytics */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">📊 Task Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
              <div className="text-sm text-blue-700">Total Tasks</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingTasks.length}</div>
              <div className="text-sm text-yellow-700">Pending</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{inProgressTasks.length}</div>
              <div className="text-sm text-orange-700">In Progress</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
              <div className="text-sm text-green-700">Completed</div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">⏳ Pending Tasks ({pendingTasks.length})</h2>
          
          <div className="space-y-3">
            {pendingTasks.map((task) => {
              const priorityInfo = getPriorityInfo(task.priority)
              const dueDateStatus = getDueDateStatus(task.due_date)
              
              return (
                <div
                  key={task.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {task.category}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {dueDateStatus && (
                          <span className={dueDateStatus.color}>
                            📅 {dueDateStatus.text}
                          </span>
                        )}
                        {task.estimated_duration && (
                          <span>⏱️ {task.estimated_duration} min</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <select
                        value={task.status || 'pending'}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        {statuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      
                      <button
                        onClick={() => editTask(task)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="Edit task"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete task"
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

      {/* In Progress Tasks */}
      {inProgressTasks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">🔄 In Progress ({inProgressTasks.length})</h2>
          
          <div className="space-y-3">
            {inProgressTasks.map((task) => {
              const dueDateStatus = getDueDateStatus(task.due_date)
              
              return (
                <div
                  key={task.id}
                  className="border border-blue-200 bg-blue-50 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🔄</span>
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                      </div>
                      
                      {task.description && (
                        <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {dueDateStatus && (
                          <span className={dueDateStatus.color}>
                            📅 {dueDateStatus.text}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => updateTaskStatus(task.id, 'completed')}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        ✅ Complete
                      </button>
                      
                      <button
                        onClick={() => updateTaskStatus(task.id, 'pending')}
                        className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50"
                      >
                        ⏳ Pending
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">✅ Completed Tasks ({completedTasks.length})</h2>
          
          <div className="space-y-3">
            {completedTasks.slice(0, 10).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">✅</span>
                  <div>
                    <h3 className="font-medium text-green-900 line-through">{task.title}</h3>
                    <p className="text-sm text-green-700">
                      Completed on {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete task"
                >
                  🗑️
                </button>
              </div>
            ))}
            
            {completedTasks.length > 10 && (
              <p className="text-center text-gray-500 text-sm">
                And {completedTasks.length - 10} more completed tasks...
              </p>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && tasks.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-500 mb-4">No tasks yet. Add your first task and start organizing! 🌟</p>
          <p className="text-sm text-gray-400">
            Tip: Break large projects into smaller, actionable tasks for better productivity
          </p>
        </div>
      )}

      {/* Productivity Tips */}
      {tasks.length > 0 && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-3">🧠 Productivity Insights</h3>
          <div className="space-y-2 text-purple-100">
            {pendingTasks.filter(t => t.priority === 'high').length > 0 && (
              <p>🔴 You have {pendingTasks.filter(t => t.priority === 'high').length} high-priority tasks. Focus on these first!</p>
            )}
            {tasks.filter(t => getDueDateStatus(t.due_date)?.color === 'text-red-600').length > 0 && (
              <p>⚠️ Some tasks are overdue. Consider rescheduling or breaking them into smaller parts.</p>
            )}
            {completedTasks.length >= 5 && (
              <p>🎉 Great progress! You've completed {completedTasks.length} tasks. Keep the momentum going!</p>
            )}
            {inProgressTasks.length > 3 && (
              <p>💡 You have many tasks in progress. Consider focusing on 1-2 tasks at a time for better results.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
