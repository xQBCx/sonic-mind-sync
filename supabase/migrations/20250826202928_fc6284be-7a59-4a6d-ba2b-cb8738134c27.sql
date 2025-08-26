-- Fix testimonials security vulnerability
-- Change RLS policy to require authentication for testimonial submission

-- Drop the insecure policy that allows anyone to insert
DROP POLICY IF EXISTS "Anyone can insert testimonials" ON testimonials;

-- Create a secure policy that requires authentication
CREATE POLICY "Authenticated users can insert testimonials" 
ON testimonials 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Optional: Add a policy to let users view their own submitted testimonials
CREATE POLICY "Users can view their own testimonials" 
ON testimonials 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL AND user_email = (
  SELECT email FROM auth.users WHERE id = auth.uid()
));