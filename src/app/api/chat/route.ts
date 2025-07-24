import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Check if environment variables exist
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error - missing database credentials' }, 
        { status: 500 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable - please try again later' }, 
        { status: 503 }
      )
    }

    const { message, userId } = await request.json()
    
    if (!userId || !message?.trim()) {
      return NextResponse.json(
        { error: 'Message and user ID are required' }, 
        { status: 400 }
      )
    }

    // Dynamic imports to avoid build-time issues
    const { createClient } = await import('@supabase/supabase-js')
    const { default: OpenAI } = await import('openai')

    // Create clients inside function
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Simple AI response without complex context (to avoid build issues)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are AniGPT, a helpful AI productivity assistant. Respond in a supportive, encouraging tone with a mix of English and Hindi (Hinglish). Keep responses concise but meaningful.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 200,
      temperature: 0.8,
    })

    const reply = completion.choices[0].message.content || 'Sorry, I could not generate a response.'

    // Save to database
    try {
      await Promise.all([
        supabase.from('chat_messages').insert({
          user_id: userId,
          role: 'user',
          content: message
        }),
        supabase.from('chat_messages').insert({
          user_id: userId,
          role: 'assistant',
          content: reply
        })
      ])
    } catch (dbError) {
      console.error('Database save error:', dbError)
      // Continue even if DB save fails
    }

    return NextResponse.json({ reply })

  } catch (error) {
    console.error('Chat API error:', error)
    
    // Fallback response
    const fallbackResponses = [
      "🤖 Sorry, I'm having trouble right now. But remember - you're doing great! Keep pushing forward! 💪",
      "🌟 Technical hiccup on my end! But here's a quick tip: Take a deep breath and tackle one task at a time. You've got this! 🚀",
      "💡 I'm temporarily unavailable, but remember: Progress over perfection. Every small step counts! ✨"
    ]
    
    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
    
    return NextResponse.json({ reply: randomResponse })
  }
}
