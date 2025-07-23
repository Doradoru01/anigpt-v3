'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../providers'

interface MoodEntry {
  id: string
  mood: string
  reason: string | null
  intensity: number | null
  energy: number | null
  tags: string[] | null
  location: string | null
  created_at: string
}

export default function MoodPage() {
  const { user } = useAuth()
  const [moods, setMoods] = useState<MoodEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [selectedMood, setSelectedMood] = useState('😊 Happy')
  const [reason, setReason] = useState('')
  const [intensity, setIntensity] = useState(5)
  const [energy, setEnergy] = useState(5)
  const [tags, setTags] = useState('')
  const [location, setLocation] = useState('')

  const moodOptions = [
    '😊 Happy',
    '😢 Sad', 
    '😐 Neutral',
    '😤 Frustrated',
    '🤔 Thoughtful',
    '😴 Tired',
    '🥳 Excited',
    '😰 Anxious',
    '😌 Peaceful',
    '🔥 Motivated',
    '😕 Disappointed',
    '🤗 Grateful',
    '😎 Confident',
    '😬 Stressed'
  ]

  useEffect(() => {
    if (user) {
      loadMoods()
    }
  }, [user])

  const loadMoods = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('moods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setMoods(data || [])
    } catch (error) {
      console.error('Error loading moods:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveMood = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : null
      
      const { error } = await supabase
        .from('moods')
        .insert({
          user_id: user.id,
          mood: selectedMood,
          reason: reason || null,
          intensity,
          energy,
          tags: tagsArray,
          location: location || null
        })

      if (error) throw error
      
      // Reset form
      setReason('')
      setTags('')
      setLocation('')
      setIntensity(5)
      setEnergy(5)
      
      // Reload moods
      await loadMoods()
      alert('Mood saved successfully! 🎉')
    } catch (error: any) {
      alert('Error saving mood: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteMood = async (id: string) => {
    if (!confirm('Delete this mood entry?')) return
    
    try {
      const { error } = await supabase
        .from('moods')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadMoods()
    } catch (error: any) {
      alert('Error deleting mood: ' + error.message)
    }
  }

  const getIntensityColor = (intensity: number) => {
    if (intensity <= 3) return 'text-red-600'
    if (intensity <= 6) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getEnergyColor = (energy: number) => {
    if (energy <= 3) return 'text-gray-600'
    if (energy <= 6) return 'text-blue-600'
    return 'text-purple-600'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">😊 Mood Intelligence</h1>
        <p className="text-gray-600 mt-2">Track your emotions with advanced analytics and insights</p>
      </div>

      {/* Mood Entry Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">📝 Log Your Current Mood</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🌈 How are you feeling?
              </label>
              <select 
                value={selectedMood} 
                onChange={(e) => setSelectedMood(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {moodOptions.map((mood) => (
                  <option key={mood} value={mood}>{mood}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💭 What's happening? (optional)
              </label>
              <textarea
                placeholder="Describe what's influencing your mood today..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏷️ Tags
                </label>
                <input
                  type="text"
                  placeholder="work, family, health..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📍 Location
                </label>
                <input
                  type="text"
                  placeholder="home, office, cafe..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💫 Emotional Intensity: <span className={`font-bold ${getIntensityColor(intensity)}`}>{intensity}/10</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Very Low</span>
                <span>Moderate</span>
                <span>Very High</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⚡ Energy Level: <span className={`font-bold ${getEnergyColor(energy)}`}>{energy}/10</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={energy}
                onChange={(e) => setEnergy(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Exhausted</span>
                <span>Moderate</span>
                <span>Energized</span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">💡 Mood Insights</h4>
              {intensity >= 8 && energy >= 8 && (
                <p className="text-blue-700 text-sm">🚀 Peak state! Perfect time for challenging tasks and important decisions.</p>
              )}
              {intensity <= 3 && energy <= 3 && (
                <p className="text-blue-700 text-sm">🛌 Low energy detected. Consider rest, self-care, or gentle activities.</p>
              )}
              {intensity >= 7 && energy <= 4 && (
                <p className="text-blue-700 text-sm">🎭 High emotion but low energy. Good for reflection and planning.</p>
              )}
              {intensity <= 4 && energy >= 7 && (
                <p className="text-blue-700 text-sm">⚡ High energy with calm emotions. Great for routine tasks and learning.</p>
              )}
            </div>

            <button
              onClick={saveMood}
              disabled={saving || !selectedMood}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Saving...' : '💾 Save Mood Entry'}
            </button>
          </div>
        </div>
      </div>

      {/* Mood Analytics */}
      {moods.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">📊 Mood Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {moods.length}
              </div>
              <div className="text-sm text-blue-700">Total Entries</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {(moods.reduce((sum, m) => sum + (m.intensity || 0), 0) / moods.length).toFixed(1)}
              </div>
              <div className="text-sm text-green-700">Avg Intensity</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(moods.reduce((sum, m) => sum + (m.energy || 0), 0) / moods.length).toFixed(1)}
              </div>
              <div className="text-sm text-purple-700">Avg Energy</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {moods.filter(m => m.created_at >= new Date(Date.now() - 7*24*60*60*1000).toISOString()).length}
              </div>
              <div className="text-sm text-orange-700">This Week</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Moods */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">🕒 Recent Mood History</h2>
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : moods.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">😊</div>
            <p className="text-gray-500">No mood entries yet. Start by logging your first mood! 🌟</p>
          </div>
        ) : (
          <div className="space-y-4">
            {moods.map((mood) => (
              <div
                key={mood.id}
                className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{mood.mood.split(' ')[0]}</span>
                    <span className="font-medium text-gray-900">{mood.mood.split(' ').slice(1).join(' ')}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(mood.created_at).toLocaleDateString()} at{' '}
                      {new Date(mood.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  {mood.reason && (
                    <p className="text-gray-700 text-sm mb-2">{mood.reason}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`font-medium ${getIntensityColor(mood.intensity || 0)}`}>
                      Intensity: {mood.intensity}/10
                    </span>
                    <span className={`font-medium ${getEnergyColor(mood.energy || 0)}`}>
                      Energy: {mood.energy}/10
                    </span>
                    {mood.location && (
                      <span className="text-gray-500">📍 {mood.location}</span>
                    )}
                  </div>
                  
                  {mood.tags && mood.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {mood.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => deleteMood(mood.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                  title="Delete mood entry"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
