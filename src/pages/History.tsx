import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getBriefHistory, BriefHistoryItem } from "@/lib/api";
import { ArrowLeft, Play, Clock } from "lucide-react";

export default function History() {
  const [history, setHistory] = useState<BriefHistoryItem[]>([]);

  useEffect(() => {
    setHistory(getBriefHistory());
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link to="/generate">
                <Button variant="ghost" size="sm" className="mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Generator
                </Button>
              </Link>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Your Brief History
              </h1>
              <p className="text-xl text-muted-foreground mt-2">
                Revisit your recent audio briefings
              </p>
            </div>
          </div>

          {/* History List */}
          {history.length === 0 ? (
            <Card className="p-12 bg-card/80 border-border/20 backdrop-blur-sm text-center">
              <div className="space-y-4">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">No briefs yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Generate your first SonicBrief to see it here
                  </p>
                  <Link to="/generate">
                    <Button variant="neural">
                      Create Your First Brief
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <Card key={item.id} className="p-6 bg-card/80 border-border/20 backdrop-blur-sm hover:shadow-neural transition-all">
                  <Link to={`/brief/${item.id}`} className="block">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant="secondary" className="text-sm">
                            {item.mood}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {Math.floor(item.durationSec / 60)}:{(item.durationSec % 60).toString().padStart(2, '0')} min
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.topics.slice(0, 4).map((topic, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                          {item.topics.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.topics.length - 4} more
                            </Badge>
                          )}
                        </div>

                        <Badge 
                          variant={item.status === 'ready' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {item.status}
                        </Badge>
                      </div>
                      
                      <Button variant="ghost" size="icon" className="ml-4">
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}