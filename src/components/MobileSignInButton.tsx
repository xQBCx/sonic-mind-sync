import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { LogIn } from "lucide-react";

export const MobileSignInButton = () => {
  const location = useLocation();

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
      <Link to={`/auth${location.pathname !== '/' ? `?redirectTo=${encodeURIComponent(location.pathname)}` : ''}`}>
        <Button 
          size="lg" 
          className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300 text-lg py-4"
        >
          <LogIn className="w-5 h-5 mr-2" />
          Sign In / Create Account
        </Button>
      </Link>
    </div>
  );
};