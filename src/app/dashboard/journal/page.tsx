'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../providers'

interface JournalEntry {
  id: string
  title: string
  content: string
  category: string | null
  tags: string[] | null
  sentiment: string | null
  word_count: number | null
  reading_time: number | null
  is_favorite: boolean | null
  created_at: string
  updated_at: string
}

export default function JournalPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('Personal Growth')
  const [tags, setTags] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const categories = [
    'Personal Growth',
    'Work & Career', 
    'Family & Relationships',
    'Learning Journey',
    'Health & Wellness',
    'Creative Expression',
    'Travel & Adventures',
    'Financial Goals',
    'Spiritual & Mindfulness',
    'Random Thoughts',
    'Gratitude & Appreciation'
  ]

  useEffect(() => {
    if (user) {
      loadEntries()
    }
  }, [user])

  const loadEntries = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error loading journal entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeSentiment = (text: string): string => {
    const positive = ['happy', 'good', 'great', 'amazing', 'wonderful', 'excellent', 'love', 'excited', 'proud', 'grateful', 'blessed', 'successful', 'accomplished', 'peaceful', 'joy', 'fantastic', 'awesome', 'brilliant']
    const negative = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'disappointed', 'worried', 'stressed', 'depressed', 'anxious', 'overwhelmed', 'exhausted', 'upset', 'annoyed', 'difficult', 'challenging']
    
    const words = text.toLowerCase().split(/\s+/)
    const positiveCount = words.filter(word => positive.includes(word)).length
    const negativeCount = words.filter(word => negative.includes(word)).length
    
    if (positiveCount > negativeCount) return 'Positive'
    if (negativeCount > positiveCount) return 'Negative' 
    return 'Neutral'
  }

  const saveEntry = async () => {
    if (!user || !title.trim() || !content.trim()) return
    
    setSaving(true)
    try {
      const wordCount = content.trim().split(/\s+/).length
      const readingTime = Math.ceil(wordCount / 200) // 200 words per minute
      const sentiment = analyzeSentiment(content)
      const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : null
      
      const entryData = {
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        category,
        tags: tagsArray,
        sentiment,
        word_count: wordCount,
        reading_time: readingTime
      }

      if (editingId) {
        const { error } = await supabase
          .from('journal_entries')
          .update({ ...entryData, updated_at: new Date().toISOString() })
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('journal_entries')
          .insert(entryData)
        if (error) throw error
      }
      
      // Reset form
      setTitle('')
      setContent('')
      setTags('')
      setCategory('Personal Growth')
      setEditingId(null)
      
      await loadEntries()
      alert(editingId ? 'Journal entry updated! ✏️' : 'Journal entry saved! 📝')
    } catch (error: any) {
      alert('Error saving entry: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const editEntry = (entry: JournalEntry) => {
    setEditingId(entry.id)
    setTitle(entry.title)
    setContent(entry.content)
    setCategory(entry.category || 'Personal Growth')
    setTags(entry.tags ? entry.tags.join(', ') : '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this journal entry?')) return
    
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadEntries()
    } catch (error: any) {
      alert('Error deleting entry: ' + error.message)
    }
  }

  const toggleFavorite = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .update({ is_favorite: !currentStatus })
        .eq('id', id)

      if (error) throw error
      await loadEntries()
    } catch (error: any) {
      alert('Error updating favorite: ' + error.message)
    }
  }

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case 'Positive': return 'text-green-600 bg-green-100'
      case 'Negative': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSentimentEmoji = (sentiment: string | null) => {
    switch (sentiment) {
      case 'Positive': return '😊'
      case 'Negative': return '😔'
      default: return '😐'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📝 Smart Journal</h1>
        <p className="text-gray-600 mt-2">Capture your thoughts with AI-powered sentiment analysis</p>
      </div>

      {/* Journal Entry Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {editingId ? '✏️ Edit Journal Entry' : '📝 Create New Entry'}
        </h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📖 Entry Title
              </label>
              <input
                type="text"
                placeholder="Today's Reflection, Weekly Review, Random Thoughts..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💭 Your thoughts and reflections
            </label>
            <textarea
              placeholder="Write about your day, thoughts, feelings, learnings, challenges, achievements...

Tips for meaningful journaling:
• Be authentic and honest
• Include specific details and examples  
• Reflect on what you learned
• Note your emotions and reactions
• Think about future actions or goals"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏷️ Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="reflection, growth, work, family, goals, insights..."
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {content && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">📊 Real-time Analysis</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Words:</span> {content.trim().split(/\s+/).length}
                </div>
                <div>
                  <span className="font-medium">Reading time:</span> {Math.ceil(content.trim().split(/\s+/).length / 200)} min
                </div>
                <div>
                  <span className="font-medium">Sentiment:</span> 
                  <span className={`ml-1 px-2 py-1 rounded text-xs ${getSentimentColor(analyzeSentiment(content))}`}>
                    {getSentimentEmoji(analyzeSentiment(content))} {analyzeSentiment(content)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={saveEntry}
              disabled={saving || !title.trim() || !content.trim()}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Saving...' : editingId ? '✏️ Update Entry' : '📝 Save Entry'}
            </button>
            
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null)
                  setTitle('')
                  setContent('')
                  setTags('')
                  setCategory('Personal Growth')
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Journal Analytics */}
      {entries.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">📊 Writing Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{entries.length}</div>
              <div className="text-sm text-blue-700">Total Entries</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {entries.reduce((sum, e) => sum + (e.word_count || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-green-700">Total Words</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(entries.reduce((sum, e) => sum + (e.word_count || 0), 0) / entries.length)}
              </div>
              <div className="text-sm text-purple-700">Avg Words/Entry</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {entries.filter(e => e.created_at >= new Date(Date.now() - 7*24*60*60*1000).toISOString()).length}
              </div>
              <div className="text-sm text-orange-700">This Week</div>
            </div>
          </div>
        </div>
      )}

      {/* Journal Entries */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">📚 Your Journal Archive</h2>
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-500">No journal entries yet. Start writing to see your thoughts here! 🌟</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{entry.title}</h3>
                      {entry.is_favorite && <span className="text-yellow-500">⭐</span>}
                      <span className={`px-2 py-1 rounded text-xs ${getSentimentColor(entry.sentiment)}`}>
                        {getSentimentEmoji(entry.sentiment)} {entry.sentiment}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                      <span>📁 {entry.category}</span>
                      <span>📊 {entry.word_count} words</span>
                      <span>⏱️ {entry.reading_time} min read</span>
                      <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <p className="text-gray-700 text-sm line-clamp-2">
                      {entry.content.substring(0, 150)}...
                    </p>
                    
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.tags.map((tag, index) => (
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
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleFavorite(entry.id, entry.is_favorite || false)}
                      className="text-yellow-500 hover:text-yellow-600 p-1"
                      title={entry.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {entry.is_favorite ? '⭐' : '☆'}
                    </button>
                    <button
                      onClick={() => editEntry(entry)}
                      className="text-blue-500 hover:text-blue-700 p-1"
                      title="Edit entry"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete entry"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
