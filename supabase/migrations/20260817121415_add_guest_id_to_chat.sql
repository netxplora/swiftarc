ALTER TABLE public.chat_conversations
ALTER COLUMN user_id DROP NOT NULL,
ADD COLUMN guest_id UUID DEFAULT NULL;