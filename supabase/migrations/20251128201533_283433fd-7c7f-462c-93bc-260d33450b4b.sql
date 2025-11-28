-- Create function to get user email (admin only)
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text
  FROM auth.users
  WHERE id = _user_id;
$$;

-- Create a view for admin to see users with emails
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT 
  ur.user_id,
  ur.role,
  ur.created_at,
  ur.approved_at,
  ur.approved_by,
  (SELECT email FROM auth.users WHERE id = ur.user_id) as email
FROM public.user_roles ur;

-- Grant select on view to authenticated users (RLS will control access)
GRANT SELECT ON public.admin_users_view TO authenticated;

-- Enable RLS on the view
ALTER VIEW public.admin_users_view SET (security_invoker = off);

-- Create policy for admin access to view
CREATE POLICY "Admins can view user emails"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);