import { supabase } from '@/lib/supabase/client'
import type { AIConversation, AIMessage } from '@/types/database'

// ── Conversations ──

export async function getConversations(): Promise<AIConversation[]> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createConversation(title: string): Promise<AIConversation> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({ user_id: user.id, title })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  const { error } = await supabase
    .from('ai_conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase
    .from('ai_conversations')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function deleteConversations(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('ai_conversations')
    .delete()
    .in('id', ids)
  if (error) throw error
}

// ── Messages ──

export async function getMessages(conversationId: string): Promise<AIMessage[]> {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<AIMessage> {
  const { data, error } = await supabase
    .from('ai_messages')
    .insert({ conversation_id: conversationId, role, content })
    .select()
    .single()
  if (error) throw error
  // Touch conversation updated_at
  await supabase
    .from('ai_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)
  return data
}

// ── AI Query (calls Supabase Edge Function) ──

export async function askQuestion(
  conversationId: string,
  question: string
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const response = await supabase.functions.invoke('ask-ai', {
    body: { conversation_id: conversationId, question },
  })

  if (response.error) {
    throw new Error(response.error.message || 'Failed to get AI response')
  }

  return response.data?.answer || 'Sorry, I could not generate a response.'
}
