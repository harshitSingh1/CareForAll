-- Create table to store user-selected remedies from AI responses
CREATE TABLE public.selected_remedies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message_id UUID NOT NULL,
  remedy_text TEXT NOT NULL,
  selected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.selected_remedies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own selections" 
ON public.selected_remedies 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own selections" 
ON public.selected_remedies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own selections" 
ON public.selected_remedies 
FOR DELETE 
USING (auth.uid() = user_id);