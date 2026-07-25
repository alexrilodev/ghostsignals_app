CREATE TABLE public.push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL DEFAULT 'android',
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push tokens"
  ON public.push_tokens
  FOR ALL
  USING (auth.uid() = user_id);

CREATE UNIQUE INDEX push_tokens_user_id_idx ON public.push_tokens (user_id);
CREATE UNIQUE INDEX push_tokens_token_idx ON public.push_tokens (token);
