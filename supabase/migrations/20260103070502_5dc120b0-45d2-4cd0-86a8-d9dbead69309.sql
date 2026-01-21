-- Update new-user handler to assign roles based on signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  acct_type text := COALESCE(new.raw_user_meta_data ->> 'account_type', 'user');
  pro_role text := COALESCE(new.raw_user_meta_data ->> 'professional_role', 'doctor');
BEGIN
  -- Create basic profile row
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');

  -- Assign role
  IF acct_type = 'professional' THEN
    IF pro_role NOT IN ('doctor', 'advisor') THEN
      pro_role := 'doctor';
    END IF;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, pro_role::public.app_role);
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'user');
  END IF;

  RETURN new;
END;
$$;