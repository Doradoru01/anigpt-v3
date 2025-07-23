import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get user context for personalized responses
    const [userProfile, recentMoods, activeGoals, recentJournal, activeHabits] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('full_name, preferences')
        .eq('id', userId)
        .single(),
      supabase
        .from('moods')
        .select('mood, intensity, energy, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('goals')
        .select('title, progress, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(3),
      supabase
        .from('journal_entries')
        .select('title, sentiment, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(2),
      supabase
        .from('habits')
        .select('name, current_streak')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(3)
    ])

    // Build context for AI
    let systemContext = `You are AniGPT, a caring AI productivity and wellness assistant. 
    Respond in a supportive, encouraging tone with a natural mix of English and Hindi (Hinglish) when appropriate.
    Keep responses concise (2-3 sentences) but meaningful and actionable.
    Focus on productivity, mental wellness, goal achievement, and personal growth.`
    
    if (userProfile.data?.full_name) {
      systemContext += `\n\nUser's name: ${userProfile.data.full_name}`
    }

    // Add mood context
    if (recentMoods.data && recentMoods.data.length > 0) {
      const moodContext = recentMoods.data
        .map(m => `${m.mood} (intensity: ${m.intensity}/10, energy: ${m.energy}/10)`)
        .join(', ')
      systemContext += `\n\nUser's recent moods: ${moodContext}. Use this to provide empathetic and contextual advice.`
    }

    // Add goals context
    if (activeGoals.data && activeGoals.data.length > 0) {
      const goalContext = activeGoals.data
        .map(g => `${g.title} (${g.progress}% complete)`)
        .join(', ')
      systemContext += `\n\nUser's active goals: ${goalContext}. Provide encouragement and specific tips for achieving these goals.`
    }

    // Add journal context
    if (recentJournal.data && recentJournal.data.length > 0) {
      const journalContext = recentJournal.data
        .map(j => `"${j.title}" (sentiment: ${j.sentiment})`)
        .join(', ')
      systemContext += `\n\nUser's recent journal entries: ${journalContext}. Consider their writing patterns and emotional state.`
    }

    // Add habits context
    if (activeHabits.data && activeHabits.data.length > 0) {
      const habitContext = activeHabits.data
        .map(h => `${h.name} (${h.current_streak} day streak)`)
        .join(', ')
      systemContext += `\n\nUser's active habits: ${habitContext}. Provide encouragement for habit building and streak maintenance.`
    }

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemContext },
        { role: 'user', content: message }
      ],
      max_tokens: 300,
      temperature: 0.8,
      presence_penalty: 0.2,
      frequency_penalty: 0.1
    })

    const reply = completion.choices[0].message.content

    // Save chat to database
    await Promise.all([
      supabase.from('chat_messages').insert({
        user_id: userId,
        role: 'user',
        content: message
      }),
      supabase.from('chat_messages').insert({
        user_id: userId,
        role: 'assistant',
        content: reply || 'Sorry, I could not generate a response. Please try again.'
      })
    ])

    return NextResponse.json({ reply })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response. Please try again.' }, 
      { status: 500 }
    )
  }
}
