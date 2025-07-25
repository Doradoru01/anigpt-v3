export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          username: string | null
          bio: string | null
          preferences: any | null
          timezone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          bio?: string | null
          preferences?: any | null
          timezone?: string | null
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          bio?: string | null
          preferences?: any | null
          timezone?: string | null
          updated_at?: string
        }
      }
      moods: {
        Row: {
          id: string
          user_id: string
          mood: string
          emoji: string | null
          reason: string | null
          intensity: number | null
          energy: number | null
          tags: string[] | null
          location: string | null
          weather: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          mood: string
          emoji?: string | null
          reason?: string | null
          intensity?: number | null
          energy?: number | null
          tags?: string[] | null
          location?: string | null
          weather?: string | null
        }
        Update: {
          mood?: string
          emoji?: string | null
          reason?: string | null
          intensity?: number | null
          energy?: number | null
          tags?: string[] | null
          location?: string | null
          weather?: string | null
        }
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          category: string | null
          tags: string[] | null
          sentiment: string | null
          word_count: number | null
          reading_time: number | null
          is_favorite: boolean | null
          is_public: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          title: string
          content: string
          category?: string | null
          tags?: string[] | null
          sentiment?: string | null
          word_count?: number | null
          reading_time?: number | null
          is_favorite?: boolean | null
          is_public?: boolean | null
        }
        Update: {
          title?: string
          content?: string
          category?: string | null
          tags?: string[] | null
          sentiment?: string | null
          word_count?: number | null
          reading_time?: number | null
          is_favorite?: boolean | null
          is_public?: boolean | null
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
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
        Insert: {
          user_id: string
          title: string
          description?: string | null
          category?: string | null
          priority?: string | null
          target_date?: string | null
          progress?: number | null
          status?: string | null
          milestones?: any | null
        }
        Update: {
          title?: string
          description?: string | null
          category?: string | null
          priority?: string | null
          target_date?: string | null
          progress?: number | null
          status?: string | null
          milestones?: any | null
          updated_at?: string
        }
      }
    }
  }
}
