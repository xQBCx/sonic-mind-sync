import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Star } from "lucide-react";

export const TestimonialForm = () => {
  const [formData, setFormData] = useState({
    user_name: "",
    user_email: "",
    user_title: "",
    testimonial_text: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_email || !formData.testimonial_text) return;

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('testimonials')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Thank you for your testimonial! ⭐",
        description: "Your testimonial has been submitted and will be reviewed before being published.",
      });
      
      setFormData({
        user_name: "",
        user_email: "",
        user_title: "",
        testimonial_text: ""
      });
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      toast({
        title: "Error submitting testimonial",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card/80 backdrop-blur-sm border-primary/20">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-bold">Share Your Experience</h3>
        </div>
        <p className="text-muted-foreground">
          Help others discover SonicBrief by sharing your story
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Your name"
              value={formData.user_name}
              onChange={(e) => setFormData(prev => ({ ...prev, user_name: e.target.value }))}
              className="bg-input/50 border-primary/30 focus:border-primary"
            />
            <Input
              type="email"
              placeholder="Your email"
              required
              value={formData.user_email}
              onChange={(e) => setFormData(prev => ({ ...prev, user_email: e.target.value }))}
              className="bg-input/50 border-primary/30 focus:border-primary"
            />
          </div>
          
          <Input
            placeholder="Your title/role (optional)"
            value={formData.user_title}
            onChange={(e) => setFormData(prev => ({ ...prev, user_title: e.target.value }))}
            className="bg-input/50 border-primary/30 focus:border-primary"
          />
          
          <Textarea
            placeholder="Share your experience with SonicBrief - how has it helped you? What are you most excited about?"
            required
            value={formData.testimonial_text}
            onChange={(e) => setFormData(prev => ({ ...prev, testimonial_text: e.target.value }))}
            className="bg-input/50 border-primary/30 focus:border-primary min-h-[120px]"
          />
          
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            {isSubmitting ? "Submitting..." : (
              <>
                <Star className="h-4 w-4 mr-2" />
                Submit Testimonial
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};