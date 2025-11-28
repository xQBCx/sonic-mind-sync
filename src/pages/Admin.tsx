import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface UserWithRole {
  user_id: string;
  email: string;
  role: 'admin' | 'user' | 'pending';
  created_at: string;
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      toast.error('Access denied: Admin only');
      navigate('/');
      return;
    }

    setIsAdmin(true);
    loadUsers();
  };

  const loadUsers = async () => {
    setLoading(true);
    
    // Call the secure admin function to get users with emails
    const { data: usersData, error } = await supabase
      .rpc('admin_get_users_with_roles');

    if (error) {
      toast.error('Failed to load users');
      console.error(error);
      setLoading(false);
      return;
    }

    // Map to component format
    const usersWithRoles = usersData.map((user: any) => ({
      user_id: user.user_id,
      email: user.email || `User ${user.user_id.slice(0, 8)}...`,
      role: user.role as 'admin' | 'user' | 'pending',
      created_at: user.created_at
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const approveUser = async (userId: string) => {
    setProcessing(userId);
    
    // Delete pending role
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'pending');

    if (deleteError) {
      toast.error('Failed to approve user');
      setProcessing(null);
      return;
    }

    // Add user role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'user',
        approved_at: new Date().toISOString(),
        approved_by: user!.id
      });

    if (insertError) {
      toast.error('Failed to approve user');
      setProcessing(null);
      return;
    }

    toast.success('User approved');
    setProcessing(null);
    loadUsers();
  };

  const rejectUser = async (userId: string) => {
    setProcessing(userId);
    
    // Just delete the role entry - they can re-register if needed
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (error) {
      toast.error('Failed to reject user');
      setProcessing(null);
      return;
    }

    toast.success('User rejected');
    setProcessing(null);
    loadUsers();
  };

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const pendingUsers = users.filter(u => u.role === 'pending');
  const approvedUsers = users.filter(u => u.role === 'user');
  const admins = users.filter(u => u.role === 'admin');

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Pending Approvals */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pending Approvals ({pendingUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <p className="text-muted-foreground">No pending approvals</p>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map(user => (
                <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Registered: {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => approveUser(user.user_id)}
                      disabled={processing === user.user_id}
                      size="sm"
                      variant="default"
                    >
                      {processing === user.user_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => rejectUser(user.user_id)}
                      disabled={processing === user.user_id}
                      size="sm"
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approved Users */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Approved Users ({approvedUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {approvedUsers.length === 0 ? (
            <p className="text-muted-foreground">No approved users yet</p>
          ) : (
            <div className="space-y-2">
              {approvedUsers.map(user => (
                <div key={user.user_id} className="flex items-center justify-between p-3 border rounded">
                  <p className="font-medium">{user.email}</p>
                  <Badge variant="secondary">User</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admins */}
      <Card>
        <CardHeader>
          <CardTitle>Administrators ({admins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {admins.map(user => (
              <div key={user.user_id} className="flex items-center justify-between p-3 border rounded">
                <p className="font-medium">{user.email}</p>
                <Badge>Admin</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
