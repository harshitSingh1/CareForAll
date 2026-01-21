-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create doctor_profiles table for storing doctor/advisor specific information
CREATE TABLE public.doctor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  qualification TEXT NOT NULL,
  years_of_experience INTEGER NOT NULL DEFAULT 0,
  availability_status TEXT NOT NULL DEFAULT 'available',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add constraint for availability status
ALTER TABLE public.doctor_profiles
ADD CONSTRAINT doctor_profiles_availability_check 
CHECK (availability_status IN ('available', 'busy', 'offline'));

-- Enable Row Level Security
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

-- Doctors/Advisors can view and update their own profile
CREATE POLICY "Users can view their own doctor profile"
ON public.doctor_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own doctor profile"
ON public.doctor_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own doctor profile"
ON public.doctor_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can manage all doctor profiles
CREATE POLICY "Admins can manage all doctor profiles"
ON public.doctor_profiles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_doctor_profiles_updated_at
BEFORE UPDATE ON public.doctor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();