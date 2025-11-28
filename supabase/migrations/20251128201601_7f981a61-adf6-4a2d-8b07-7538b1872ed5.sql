-- Drop the problematic view
DROP VIEW IF EXISTS public.admin_users_view;

-- Drop the get_user_email function
DROP FUNCTION IF EXISTS public.get_user_email;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view user emails" ON public.user_roles;

-- Create a secure function that only admins can use to get user list with emails
CREATE OR REPLACE FUNCTION public.admin_get_users_with_roles()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  role app_role,
  created_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  -- Return user roles with emails from auth.users
  RETURN QUERY
  SELECT 
    ur.user_id,
    au.email::text,
    ur.role,
    ur.created_at,
    ur.approved_at,
    ur.approved_by
  FROM public.user_roles ur
  LEFT JOIN auth.users au ON au.id = ur.user_id
  ORDER BY ur.created_at DESC;
END;
$$;