-- Performance Optimization Indexes
-- Speeds up listing a user's conversations and auth.users cascades
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);

-- Speeds up loading messages for a conversation and chat_conversations cascades
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);

-- Speeds up sorting messages (since chat queries usually order by time)
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(conversation_id, created_at DESC);

-- Speeds up open conversation counts for admin dashboard
CREATE INDEX IF NOT EXISTS idx_chat_open ON public.chat_conversations(status) WHERE status = 'open';
