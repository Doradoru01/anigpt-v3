import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting
export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Text utilities
export function getWordCount(text: string) {
  return text.trim().split(/\s+/).length
}

export function getReadingTime(text: string) {
  const wordsPerMinute = 200
  const words = getWordCount(text)
  return Math.ceil(words / wordsPerMinute)
}

// Mood utilities
export function getMoodEmoji(mood: string) {
  const moodMap: Record<string, string> = {
    'Happy': '😊',
    'Sad': '😢',
    'Neutral': '😐',
    'Excited': '🥳',
    'Anxious': '😰',
    'Motivated': '🔥',
    'Tired': '😴',
    'Angry': '😠',
    'Peaceful': '😌',
    'Confused': '🤔'
  }
  return moodMap[mood] || '😐'
}

export function getSentimentColor(sentiment: string | null) {
  switch (sentiment) {
    case 'Positive': return 'text-green-600 bg-green-100'
    case 'Negative': return 'text-red-600 bg-red-100'
    case 'Neutral': return 'text-gray-600 bg-gray-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}
