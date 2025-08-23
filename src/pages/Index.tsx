import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { MoodProfiler } from "@/components/MoodProfiler";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <Header />
      <Hero />
      <HowItWorks />
      <MoodProfiler />
      
      {/* Call to Action Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to enhance your learning?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of learners using AI-powered neuroadaptive audio to boost focus, 
            energy, and comprehension.
          </p>
          
          {user ? (
            <Link to="/generate">
              <Button size="lg" className="text-lg px-8 py-4">
                Generate Your First Brief
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-4">
                Get Started Free
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
