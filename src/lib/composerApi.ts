// Composer API - handles audio rendering
import { supabase } from '@/integrations/supabase/client';

export async function composeBrief(briefId: string): Promise<{ success: boolean; audioUrl?: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("composer", {
      body: { briefId },
    });

    if (error) {
      console.error('Composer error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, audioUrl: data.audioUrl };
  } catch (err: any) {
    console.error('Composer call failed:', err);
    return { success: false, error: err.message };
  }
}

export async function composeSegment(briefId: string, segmentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("composer", {
      body: { briefId, segmentId },
    });

    if (error) {
      console.error('Composer segment error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Composer segment call failed:', err);
    return { success: false, error: err.message };
  }
}
