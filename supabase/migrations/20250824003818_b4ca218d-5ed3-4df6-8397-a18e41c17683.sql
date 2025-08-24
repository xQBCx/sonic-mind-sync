-- Remove the overly permissive system policy
DROP POLICY IF EXISTS "System can manage personalization insights" ON public.personalization_insights;

-- Create proper restricted policies for personalization insights
-- Users can only view their own personalization insights
CREATE POLICY "Users can view their own personalization insights" 
ON public.personalization_insights 
FOR SELECT 
USING (auth.uid() = user_id);

-- Service role can insert/update personalization insights (for AI system)
CREATE POLICY "Service role can manage personalization insights" 
ON public.personalization_insights 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Users cannot directly modify personalization insights (only view)
-- This ensures only the AI system can update insights through the service role