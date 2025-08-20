import { supabase } from '@/lib/supabase'

interface CreateBriefParams {
  mood: 'focus' | 'energy' | 'calm'
  topics: string[]
  duration_sec: number
}

export async function createBrief(params: CreateBriefParams) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User must be authenticated')
  }

  const { data, error } = await supabase
    .from('briefs')
    .insert({
      user_id: user.id,
      mood: params.mood,
      topics: params.topics,
      duration_sec: params.duration_sec,
      status: 'queued'
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create brief: ${error.message}`)
  }

  return data
}