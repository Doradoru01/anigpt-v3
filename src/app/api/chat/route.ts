import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key exists
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' }, 
        { status: 500 }
      )
    }

    const { message, userId } = await request.json()
    
    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' }, 
        { status: 400 }
      )
    }

    // Create AI response using your API key
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are AniGPT, a helpful AI productivity and wellness assistant. Respond in a supportive, encouraging tone with a natural mix of English and Hindi (Hinglish) when appropriate. Keep responses concise but meaningful and actionable. Focus on productivity, mental wellness, goal achievement, and personal growth.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 300,
      temperature: 0.8,
    })

    const reply = completion.choices[0].message.content || 'Sorry, I could not generate a response.'

    return NextResponse.json({ reply })

  } catch (error: any) {
    console.error('OpenAI API error:', error)
    
    // Handle specific OpenAI errors
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key' }, 
        { status: 401 }
      )
    }
    
    if (error.status === 429) {
      return NextResponse.json(
        { error: 'OpenAI API rate limit exceeded. Please try again later.' }, 
        { status: 429 }
      )
    }

    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'OpenAI API quota exceeded. Please check your billing.' }, 
        { status: 402 }
      )
    }

    // Fallback response
    const fallbackResponses = [
      "�� Sorry, I'm having trouble right now. But remember - you're doing great! Keep pushing forward! 💪",
      "🌟 Technical hiccup on my end! But here's a quick tip: Take a deep breath and tackle one task at a time. You've got this! 🚀",
      "💡 I'm temporarily unavailable, but remember: Progress over perfection. Every small step counts! ✨"
    ]
    
    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
    
    return NextResponse.json({ reply: randomResponse })
  }
}
