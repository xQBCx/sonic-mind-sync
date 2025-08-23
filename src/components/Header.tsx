import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { Link, useLocation } from 'react-router-dom'

export function Header() {
  const { user, signOut } = useAuth()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">SB</span>
          </div>
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            SonicBrief
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          {user && (
            <>
              <Link to="/generate" className="text-muted-foreground hover:text-foreground transition-colors">
                Generate
              </Link>
              <Link to="/history" className="text-muted-foreground hover:text-foreground transition-colors">
                History
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.email}
              </span>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          ) : (
            <Link to={`/auth${location.pathname !== '/' ? `?redirectTo=${encodeURIComponent(location.pathname)}` : ''}`}>
              <Button>
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}