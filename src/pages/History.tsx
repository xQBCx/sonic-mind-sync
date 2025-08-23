import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Play, Clock, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";

type Brief = {
  id: string;
  mood: string;
  topics: string[] | null;
  duration_sec: number | null;
  status: string;
  created_at: string;
  audio_url: string | null;
  script: string | null;
  error_message: string | null;
  updated_at: string;
  user_id: string;
};

export default function History() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirectTo=/history');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadBriefs = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error: fetchError } = await supabase
          .from('briefs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (fetchError) {
          throw fetchError;
        }

        setBriefs(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadBriefs();
  }, [user]);

  const handleBriefClick = (id: string) => {
    navigate(`/brief/${id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case "focus": return "bg-blue-500/20 text-blue-300";
      case "energy": return "bg-orange-500/20 text-orange-300";
      case "calm": return "bg-purple-500/20 text-purple-300";
      default: return "bg-white/10 text-white/80";
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const minutes = Math.round(seconds / 60);
    return `${minutes}:00 min`;
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-background">
        <Header />
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <Card className="p-12 bg-card/80 border-border/20 backdrop-blur-sm text-center">
              <div className="space-y-4">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Please sign in to view your history</h3>
                  <p className="text-muted-foreground">
                    Your brief history will appear here once you're signed in
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <Header />
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Your Brief History
              </h1>
              <p className="text-xl text-muted-foreground mt-2">
                Revisit your recent audio briefings
              </p>
            </div>
          </div>

          {loading ? (
            <Card className="p-12 bg-card/80 border-border/20 backdrop-blur-sm text-center">
              <div className="opacity-80">Loading your briefs...</div>
            </Card>
          ) : error ? (
            <Card className="p-12 bg-card/80 border-border/20 backdrop-blur-sm text-center">
              <div className="text-red-300">Error: {error}</div>
            </Card>
          ) : briefs.length === 0 ? (
            <Card className="p-12 bg-card/80 border-border/20 backdrop-blur-sm text-center">
              <div className="space-y-4">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">No briefs yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Generate your first SonicBrief to see it here
                  </p>
                  <Button onClick={() => navigate("/")}>
                    Create Your First Brief
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {briefs.map((brief) => (
                <Card 
                  key={brief.id} 
                  className="p-6 bg-card/80 border-border/20 backdrop-blur-sm hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleBriefClick(brief.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={getMoodColor(brief.mood)}>
                          {brief.mood}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDuration(brief.duration_sec)}
                        </span>
                        <Badge variant="secondary">
                          {brief.status}
                        </Badge>
                      </div>
                      
                      {brief.topics && brief.topics.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {brief.topics.slice(0, 4).map((topic, index) => (
                            <Badge key={index} variant="outline" className="text-xs bg-white/10">
                              {topic}
                            </Badge>
                          ))}
                          {brief.topics.length > 4 && (
                            <Badge variant="outline" className="text-xs bg-white/10">
                              +{brief.topics.length - 4} more
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground">
                        {formatDate(brief.created_at)}
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="icon" className="ml-4">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}