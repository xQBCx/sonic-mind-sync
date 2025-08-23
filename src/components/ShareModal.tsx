import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, Twitter, Linkedin, MessageCircle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  briefTitle?: string;
  briefId?: string;
  shareType?: 'brief' | 'app' | 'waitlist';
}

export const ShareModal = ({ 
  open, 
  onOpenChange, 
  briefTitle, 
  briefId,
  shareType = 'app'
}: ShareModalProps) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const { toast } = useToast();

  const getShareContent = () => {
    switch (shareType) {
      case 'brief':
        return {
          title: `Check out my SonicBrief: "${briefTitle}"`,
          url: `${window.location.origin}/brief/${briefId}`,
          text: `I just created an amazing personalized audio brief with SonicBrief! Listen to "${briefTitle}" and experience the future of AI-powered learning.`
        };
      case 'waitlist':
        return {
          title: "Join me on the SonicBrief waitlist!",
          url: window.location.origin,
          text: "I just joined the SonicBrief waitlist - personalized audio frequencies for peak performance! Be part of the sound revolution that's changing how we learn and focus."
        };
      default:
        return {
          title: "Experience SonicBrief - AI Audio Revolution",
          url: window.location.origin,
          text: "Discover SonicBrief - personalized audio frequencies scientifically designed to boost focus, mood, and learning. Join thousands already experiencing the future of sound-enhanced performance!"
        };
    }
  };

  const { title, url, text } = getShareContent();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      setCopySuccess(true);
      toast({
        title: "Copied to clipboard!",
        description: "Share this with your network to spread the word.",
      });
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually.",
        variant: "destructive",
      });
    }
  };

  const shareOptions = [
    {
      name: "X (Twitter)",
      icon: Twitter,
      color: "hover:bg-blue-500/10 hover:border-blue-500/30",
      action: () => {
        const tweetText = `${text}\n\n${url} #SonicBrief #AIAudio #ProductivityHack`;
        window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank');
      }
    },
    {
      name: "Facebook",
      icon: Share2,
      color: "hover:bg-blue-600/10 hover:border-blue-600/30",
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
      }
    },
    {
      name: "Instagram",
      icon: Share2,
      color: "hover:bg-pink-500/10 hover:border-pink-500/30",
      action: () => {
        navigator.clipboard.writeText(`${text}\n\n${url}`);
        toast({
          title: "Link copied!",
          description: "Paste this in your Instagram story or bio.",
        });
      }
    },
    {
      name: "TikTok",
      icon: Share2,
      color: "hover:bg-black/10 hover:border-black/30",
      action: () => {
        navigator.clipboard.writeText(`${text}\n\n${url}`);
        toast({
          title: "Link copied!",
          description: "Share this on your TikTok profile or in comments.",
        });
      }
    },
    {
      name: "Snapchat",
      icon: Share2,
      color: "hover:bg-yellow-500/10 hover:border-yellow-500/30",
      action: () => {
        window.open(`https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}`, '_blank');
      }
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "hover:bg-blue-600/10 hover:border-blue-600/30",
      action: () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
      }
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "hover:bg-green-500/10 hover:border-green-500/30",
      action: () => {
        const whatsappText = `${text}\n\n${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank');
      }
    },
    {
      name: "Email",
      icon: Mail,
      color: "hover:bg-orange-500/10 hover:border-orange-500/30",
      action: () => {
        const subject = encodeURIComponent(title);
        const body = encodeURIComponent(`${text}\n\nCheck it out: ${url}`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
      }
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share SonicBrief
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <h3 className="font-semibold text-sm mb-2">{title}</h3>
            <p className="text-xs text-muted-foreground mb-2">{text}</p>
            <Badge variant="outline" className="text-xs">
              {url}
            </Badge>
          </div>

          {/* Copy URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share Link</label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={url}
                className="text-sm bg-muted/30"
              />
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className={`${copySuccess ? 'bg-green-500/10 border-green-500/30' : ''}`}
              >
                <Copy className="h-4 w-4" />
                {copySuccess ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share On</label>
            <div className="grid grid-cols-3 gap-2">
              {shareOptions.map((option) => (
                <Button
                  key={option.name}
                  variant="outline"
                  onClick={option.action}
                  className={`justify-start gap-2 ${option.color} transition-colors`}
                >
                  <option.icon className="h-4 w-4" />
                  {option.name}
                </Button>
              ))}
            </div>
          </div>

          {shareType === 'waitlist' && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-center">
                🚀 <strong>Bonus:</strong> Get 3 friends to join and unlock Founder status with lifetime perks!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};