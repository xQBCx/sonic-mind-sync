-- Remove the overly permissive system policy
DROP POLICY IF EXISTS "System can manage personalization insights" ON public.personalization_insights;

-- Service role can insert/update personalization insights (for AI system)
CREATE POLICY "Service role can manage personalization insights" 
ON public.personalization_insights 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');