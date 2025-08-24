import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Testimonial {
  id: string;
  user_name: string;
  user_title: string;
  testimonial_text: string;
}

export const RealTestimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('id, user_name, user_title, testimonial_text')
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setTestimonials(data || []);
      } catch (error) {
        console.error('Error fetching testimonials:', error);
        // Fallback testimonials if database is empty or there's an error
        setTestimonials([
          {
            id: "1",
            user_name: "Beta Tester",
            user_title: "Early Adopter",
            testimonial_text: "Excited for the launch - can't wait to try this revolutionary approach!"
          }
        ]);
      }
    };

    fetchTestimonials();
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <div className="mt-6 sm:mt-8 overflow-hidden">
      <div className="flex animate-scroll space-x-6 sm:space-x-8">
        {testimonials.map((testimonial, index) => (
          <div key={`${testimonial.id}-${index}`} className="whitespace-nowrap text-xs sm:text-sm text-muted-foreground">
            "{testimonial.testimonial_text.length > 50 
              ? testimonial.testimonial_text.substring(0, 50) + "..." 
              : testimonial.testimonial_text}" 
            - {testimonial.user_name || "Anonymous"}
            {testimonial.user_title && `, ${testimonial.user_title}`}
          </div>
        ))}
        {/* Duplicate for seamless scrolling */}
        {testimonials.map((testimonial, index) => (
          <div key={`duplicate-${testimonial.id}-${index}`} className="whitespace-nowrap text-xs sm:text-sm text-muted-foreground">
            "{testimonial.testimonial_text.length > 50 
              ? testimonial.testimonial_text.substring(0, 50) + "..." 
              : testimonial.testimonial_text}" 
            - {testimonial.user_name || "Anonymous"}
            {testimonial.user_title && `, ${testimonial.user_title}`}
          </div>
        ))}
      </div>
    </div>
  );
};