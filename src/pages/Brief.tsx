import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AudioPlayer } from "@/components/AudioPlayer";
import { getBrief, GetBriefResponse } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Copy, Download, ChevronDown, History, ArrowLeft } from "lucide-react";

const statusMessages = {
  queued: "Your brief is in the queue...",
  summarizing: "AI is analyzing your topics...",
  tts: "Converting to speech...",
  music: "Adding background music...",
  mixing: "Creating the perfect mix...",
  uploading: "Finalizing your brief...",
  ready: "Your brief is ready!",
  error: "Something went wrong"
};

const getStatusProgress = (status: string) => {
  const statuses = ['queued', 'summarizing', 'tts', 'music', 'mixing', 'uploading', 'ready'];
  return ((statuses.indexOf(status) + 1) / statuses.length) * 100;
};

export default function Brief() {
  const { id } = useParams<{ id: string }>();
  const [brief, setBrief] = useState<GetBriefResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScriptOpen, setIsScriptOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    const pollBrief = async () => {
      try {
        const briefData = await getBrief(id);
        setBrief(briefData);
        
        if (briefData.status === 'ready') {
          toast({
            title: "Brief ready — opening player",
            description: "Your personalized audio brief is ready to play!"
          });
        } else if (briefData.status === 'error') {
          setError(briefData.error || 'An unknown error occurred');
          toast({
            title: "Generation failed",
            description: briefData.error || 'An unknown error occurred',
            variant: "destructive"
          });
        }
      } catch (err) {
        setError('Failed to load brief');
        toast({
          title: "Error loading brief",
          description: "Unable to retrieve brief information",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    pollBrief();
    
    // Poll every 3 seconds until ready or error
    const interval = setInterval(() => {
      if (brief?.status === 'ready' || brief?.status === 'error') {
        clearInterval(interval);
        return;
      }
      pollBrief();
    }, 3000);

    return () => clearInterval(interval);
  }, [id, brief?.status]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "Brief link copied to clipboard"
    });
  };

  const handleDownload = () => {
    if (brief?.audioUrl) {
      const link = document.createElement('a');
      link.href = brief.audioUrl;
      link.download = `sonicbrief-${id}.mp3`;
      link.click();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Card className="p-8 bg-card/80 border-border/20 backdrop-blur-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your brief...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Card className="p-8 bg-card/80 border-border/20 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-destructive mb-4">{error || 'Brief not found'}</p>
            <Link to="/generate">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Generator
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/generate">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Generator
              </Button>
            </Link>
            <Link to="/history">
              <Button variant="outline" size="sm">
                <History className="w-4 h-4 mr-2" />
                View History
              </Button>
            </Link>
          </div>

          {/* Brief Info Header */}
          <Card className="p-6 mb-8 bg-card/80 border-border/20 backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {brief.mood}
              </Badge>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {Math.floor(brief.durationSec / 60)}:{(brief.durationSec % 60).toString().padStart(2, '0')} minutes
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {brief.topics.map((topic, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Status or Audio Player */}
          {brief.status !== 'ready' ? (
            <Card className="p-8 mb-8 bg-card/80 border-border/20 backdrop-blur-sm text-center">
              <div className="space-y-6">
                <div>
                  <Badge 
                    variant={brief.status === 'error' ? 'destructive' : 'secondary'}
                    className="text-sm px-4 py-2 mb-4"
                  >
                    {brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}
                  </Badge>
                  <p className="text-lg text-muted-foreground">
                    {statusMessages[brief.status as keyof typeof statusMessages]}
                  </p>
                </div>
                
                {brief.status !== 'error' && (
                  <div className="space-y-2">
                    <Progress value={getStatusProgress(brief.status)} className="w-full max-w-md mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      This usually takes 8-12 seconds
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <>
              {/* Audio Player */}
              <div className="mb-8">
                <AudioPlayer />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mb-8 justify-center">
                <Button onClick={handleCopyLink} variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button onClick={handleDownload} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download MP3
                </Button>
                <Link to="/history">
                  <Button variant="secondary">
                    <History className="w-4 h-4 mr-2" />
                    Open in History
                  </Button>
                </Link>
              </div>

              {/* Script Panel */}
              {brief.script && (
                <Card className="bg-card/80 border-border/20 backdrop-blur-sm">
                  <Collapsible open={isScriptOpen} onOpenChange={setIsScriptOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-6">
                        <span className="text-lg font-semibold">View Script</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isScriptOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-6 pb-6">
                      <div className="prose prose-invert max-w-none">
                        <p className="text-muted-foreground leading-relaxed">
                          {brief.script}
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}