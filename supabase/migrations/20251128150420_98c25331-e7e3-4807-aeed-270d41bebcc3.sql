-- Fix RLS policies to use auth.uid() directly instead of joining with auth.users

-- Drop existing policies for chat_messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.chat_messages;

-- Create correct policies for chat_messages
CREATE POLICY "Users can view their own messages" 
ON public.chat_messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Drop existing policies for check_ins
DROP POLICY IF EXISTS "Users can view their own check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Users can insert their own check-ins" ON public.check_ins;

-- Create correct policies for check_ins
CREATE POLICY "Users can view their own check-ins" 
ON public.check_ins 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own check-ins" 
ON public.check_ins 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Drop existing policies for doctor_reviews
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.doctor_reviews;
DROP POLICY IF EXISTS "Users can insert their own review requests" ON public.doctor_reviews;

-- Create correct policies for doctor_reviews
CREATE POLICY "Users can view their own reviews" 
ON public.doctor_reviews 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own review requests" 
ON public.doctor_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Drop existing policies for alerts
DROP POLICY IF EXISTS "Users can view their own alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can update their own alerts" ON public.alerts;

-- Create correct policies for alerts
CREATE POLICY "Users can view their own alerts" 
ON public.alerts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" 
ON public.alerts 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Drop existing policies for consultations
DROP POLICY IF EXISTS "Users can view their own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Users can insert their own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Users can update their own consultations" ON public.consultations;

-- Create correct policies for consultations
CREATE POLICY "Users can view their own consultations" 
ON public.consultations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consultations" 
ON public.consultations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consultations" 
ON public.consultations 
FOR UPDATE 
USING (auth.uid() = user_id);