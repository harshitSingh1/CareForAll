-- Create tables for CareForAll platform

-- Chat messages table (for both health and wellness chats)
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('health', 'wellness')),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON public.chat_messages FOR SELECT
  USING (user_id::text = (SELECT id::text FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (user_id::text = (SELECT id::text FROM auth.users WHERE id = auth.uid()));

-- Check-ins table (for daily wellness tracking)
CREATE TABLE public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mood TEXT NOT NULL CHECK (mood IN ('great', 'good', 'okay', 'sad', 'angry')),
  journal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own check-ins"
  ON public.check_ins FOR SELECT
  USING (user_id::text = (SELECT id::text FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own check-ins"
  ON public.check_ins FOR INSERT
  WITH CHECK (user_id::text = (SELECT id::text FROM auth.users WHERE id = auth.uid()));

-- Doctor reviews table (for AI suggestion verification)
CREATE TABLE public.doctor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  problem TEXT NOT NULL,
  ai_suggestion TEXT NOT NULL,
  doctor_reply TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'refined', 'warned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reviews"
  ON public.doctor_reviews FOR SELECT
  USING (user_id::text = (SELECT id::text FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own review requests"
  ON public.doctor_reviews FOR INSERT
  WITH CHECK (user_id::text = (SELECT id::text FROM auth.users WHERE id = auth.uid()));

-- Alerts table (for pattern detection alerts)
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('mood', 'health', 'stress')),
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts"
  ON public.alerts FOR SELECT
  USING (user_id::text = (SELECT id::text FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own alerts"
  ON public.alerts FOR UPDATE
  USING (user_id::text = (SELECT id::text FROM auth.users WHERE id = auth.uid()));

-- Consultations table (for booking appointments)
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  specialty TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consultations"
  ON public.consultations FOR SELECT
  USING (user_id::text = (SELECT id::text FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own consultations"
  ON public.consultations FOR INSERT
  WITH CHECK (user_id::text = (SELECT id::text FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own consultations"
  ON public.consultations FOR UPDATE
  USING (user_id::text = (SELECT id::text FROM auth.users WHERE id = auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX idx_check_ins_user_id ON public.check_ins(user_id);
CREATE INDEX idx_check_ins_created_at ON public.check_ins(created_at DESC);
CREATE INDEX idx_doctor_reviews_user_id ON public.doctor_reviews(user_id);
CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX idx_consultations_user_id ON public.consultations(user_id);