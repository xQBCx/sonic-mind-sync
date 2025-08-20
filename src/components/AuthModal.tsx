import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return toast({ title: "Login failed", description: error.message, variant: "destructive" })
    toast({ title: "Logged in" })
    onOpenChange(false)
    setEmail('')
    setPassword('')
  }

  const onForgot = async () => {
    if (!email) return toast({ title: "Enter your email first" })
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`,
    })
    if (error) return toast({ title: "Reset failed", description: error.message, variant: "destructive" })
    toast({ title: "Check your email", description: "Password reset link sent." })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Sign in to SonicBrief
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={onLogin} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="button" variant="secondary" onClick={() => setShowPw((v) => !v)}>
                {showPw ? "Hide" : "Show"}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Button type="button" variant="link" className="px-0" onClick={onForgot}>
              Forgot password?
            </Button>
            <Button type="submit" disabled={loading}>{loading ? "Logging in…" : "Login"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}