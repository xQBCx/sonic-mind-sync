import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import logoIcon from '@/assets/logo-play-icon2.png'
import { supabase } from '@/integrations/supabase/client'

export function Header() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
        
        setIsAdmin(!!data);
      }
    };

    checkAdmin();
  }, [user]);

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img src={logoIcon} alt="SonicBrief" className="w-8 h-8" />
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            SonicBrief
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
            News
          </Link>
          {user && (
            <>
              <Link to="/history" className="text-muted-foreground hover:text-foreground transition-colors">
                History
              </Link>
              <Link to="/schedules" className="text-muted-foreground hover:text-foreground transition-colors">
                Schedules
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                  Admin
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {user ? (
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.email}
              </span>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="hidden md:block">
              <Link to={`/auth${location.pathname !== '/' ? `?redirectTo=${encodeURIComponent(location.pathname)}` : ''}`}>
                <Button>
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <Link 
              to="/" 
              className="block text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/blog" 
              className="block text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              News
            </Link>
            {user && (
              <>
                <Link 
                  to="/history" 
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  History
                </Link>
                <Link 
                  to="/schedules" 
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Schedules
                </Link>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="block text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
            
            <div className="pt-4 border-t border-border">
              {user ? (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {user.email}
                  </div>
                  <Button variant="outline" onClick={handleSignOut} className="w-full">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link 
                  to={`/auth${location.pathname !== '/' ? `?redirectTo=${encodeURIComponent(location.pathname)}` : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className="w-full">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}