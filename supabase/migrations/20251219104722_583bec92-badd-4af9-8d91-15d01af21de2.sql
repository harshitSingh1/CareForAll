-- Create table for submitted cases pending expert review
CREATE TABLE public.submitted_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message_id UUID NOT NULL,
  user_issue TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  selected_remedies TEXT[] NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('medical', 'mental')),
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'in_review', 'approved', 'rejected', 'completed')),
  reviewer_id UUID,
  reviewer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.submitted_cases ENABLE ROW LEVEL SECURITY;

-- Users can view their own cases
CREATE POLICY "Users can view their own cases" 
ON public.submitted_cases 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own cases
CREATE POLICY "Users can insert their own cases" 
ON public.submitted_cases 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Doctors can view medical cases for review
CREATE POLICY "Doctors can view medical cases" 
ON public.submitted_cases 
FOR SELECT 
USING (
  category = 'medical' AND 
  has_role(auth.uid(), 'doctor')
);

-- Doctors can update medical cases they review
CREATE POLICY "Doctors can update medical cases" 
ON public.submitted_cases 
FOR UPDATE 
USING (
  category = 'medical' AND 
  has_role(auth.uid(), 'doctor')
);

-- Admins can view and manage all cases
CREATE POLICY "Admins can manage all cases" 
ON public.submitted_cases 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));