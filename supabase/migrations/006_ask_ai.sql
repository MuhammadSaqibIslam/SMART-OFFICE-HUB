-- ============================================
-- Migration 006: Ask AI — Conversations & Messages
-- ============================================

-- Conversations table
create table if not exists ai_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'New Conversation',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Messages table
create table if not exists ai_messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references ai_conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now() not null
);

-- Indexes
create index if not exists idx_ai_conversations_user_id on ai_conversations(user_id);
create index if not exists idx_ai_conversations_updated_at on ai_conversations(updated_at desc);
create index if not exists idx_ai_messages_conversation_id on ai_messages(conversation_id);
create index if not exists idx_ai_messages_created_at on ai_messages(created_at);

-- RLS: ai_conversations
alter table ai_conversations enable row level security;

create policy "Users can view own conversations"
  on ai_conversations for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create own conversations"
  on ai_conversations for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on ai_conversations for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on ai_conversations for delete
  to authenticated
  using (auth.uid() = user_id);

-- RLS: ai_messages
alter table ai_messages enable row level security;

create policy "Users can view messages of own conversations"
  on ai_messages for select
  to authenticated
  using (
    exists (
      select 1 from ai_conversations
      where ai_conversations.id = ai_messages.conversation_id
      and ai_conversations.user_id = auth.uid()
    )
  );

create policy "Users can insert messages into own conversations"
  on ai_messages for insert
  to authenticated
  with check (
    exists (
      select 1 from ai_conversations
      where ai_conversations.id = ai_messages.conversation_id
      and ai_conversations.user_id = auth.uid()
    )
  );

create policy "Users can delete messages of own conversations"
  on ai_messages for delete
  to authenticated
  using (
    exists (
      select 1 from ai_conversations
      where ai_conversations.id = ai_messages.conversation_id
      and ai_conversations.user_id = auth.uid()
    )
  );
