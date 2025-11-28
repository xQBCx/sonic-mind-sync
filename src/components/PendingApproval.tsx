import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Mail } from 'lucide-react';

export function PendingApproval() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Clock className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Pending Approval</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your account is awaiting admin approval. You'll be able to create briefs once an administrator approves your account.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span>You'll receive an email notification once approved</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
