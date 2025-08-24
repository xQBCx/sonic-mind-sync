import { Button } from "@/components/ui/button";
import { PlayIcon } from "lucide-react";
import { Link } from "react-router-dom";

export const Hero = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-background overflow-hidden">
      {/* Neural background animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-neural-flow"></div>
        <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-primary-glow rounded-full animate-neural-flow delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-primary rounded-full animate-neural-flow delay-2000"></div>
      </div>

      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow animate-pulse-glow">
              <div className="flex space-x-1">
                <div className="w-2 h-6 bg-foreground rounded-full animate-audio-wave"></div>
                <div className="w-2 h-4 bg-foreground rounded-full animate-audio-wave delay-100"></div>
              </div>
              <PlayIcon className="w-8 h-8 text-foreground ml-2" />
            </div>
          </div>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          SONICBRIEF
        </h1>
        
        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-3 sm:mb-4">
          AI-Powered Neuroadaptive Learning
        </p>
        
        <p className="text-base sm:text-lg text-foreground/80 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
          Transform news, education, and content into immersive melodic experiences. 
          Boost learning, focus, and retention through neuroscience-backed audio modulation.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/auth">
            <Button variant="neural" size="lg" className="px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto">
              <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Start Learning
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="lg" 
            className="px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto"
            onClick={() => {
              const howItWorksSection = document.getElementById('how-it-works');
              howItWorksSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            How It Works
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-12 sm:mt-16 pt-8 sm:pt-16 border-t border-border/20">
          <div className="text-center">
            <div className="text-xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">95%</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Retention Rate</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">3x</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Faster Learning</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">12k+</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Neural Sessions</div>
          </div>
        </div>
      </div>
    </div>
  );
};