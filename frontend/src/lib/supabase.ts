import { createClient } from '@supabase/supabase-js'

// Vite exposes variables prefixed with VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')

// A lightweight anonymous user id so each device has its own data until auth is added
export function getLocalUserId() {
  const key = 'unisync_user_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export type EventCategory = 'class' | 'assignment' | 'exam' | 'work' | 'personal'

export interface EventRow {
  id: string
  user_id: string
  title: string
  category: EventCategory
  start_ts: string // ISO string
  end_ts: string // ISO string
  all_day: boolean | null
  location: string | null
  description: string | null
  is_done: boolean | null
  priority: number | null
  created_at?: string
  updated_at?: string
}

export interface NewEvent {
  title: string
  category: EventCategory
  start_ts: string
  end_ts: string
  location?: string | null
  description?: string | null
  is_done?: boolean | null
  priority?: number | null
}

export async function listEventsBetween(startISO: string, endISO: string) {
  const userId = getLocalUserId()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_ts', startISO)
    .lt('start_ts', endISO)
    .order('start_ts', { ascending: true })
  if (error) throw error
  return data
}

export async function listUpcoming(limit = 10) {
  const userId = getLocalUserId()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_ts', now)
    .order('start_ts', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data
}

export async function createEvent(input: NewEvent) {
  const userId = getLocalUserId()
  const { data, error } = await supabase
    .from('events')
    .insert({ ...input, user_id: userId, all_day: false })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateEvent(id: string, patch: Partial<NewEvent>) {
  const userId = getLocalUserId()
  const { data, error } = await supabase
    .from('events')
    .update({ ...patch })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteEvent(id: string) {
  const userId = getLocalUserId()
  const { error } = await supabase.from('events').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}
