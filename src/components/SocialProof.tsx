import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Zap, Award } from "lucide-react";

export const SocialProof = () => {
  const stats = [
    {
      icon: Users,
      value: "1,247",
      label: "Early Adopters",
      trend: "+127 today"
    },
    {
      icon: Zap,
      value: "94%",
      label: "Report Better Focus",
      trend: "Within 30 seconds"
    },
    {
      icon: TrendingUp,
      value: "3.2x",
      label: "Learning Speed",
      trend: "Peer-reviewed studies"
    },
    {
      icon: Award,
      value: "500",
      label: "Founding Members",
      trend: "Spots remaining"
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">
          Join the Neural Performance Revolution
        </h2>
        <p className="text-muted-foreground">
          Thousands are already experiencing the future of audio-enhanced learning
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 group">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-2xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-foreground">
                  {stat.label}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {stat.trend}
                </Badge>
              </div>

              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Testimonial ticker */}
      <div className="mt-8 overflow-hidden">
        <div className="flex animate-scroll space-x-8">
          {[
            '"Game-changer for my productivity" - Sarah K.',
            '"Finally, audio that actually works" - Michael R.',
            '"My focus improved instantly" - Dr. Lisa M.',
            '"Revolutionary approach to learning" - James T.',
            '"This is the future of wellness" - Emma S.'
          ].map((quote, index) => (
            <div key={index} className="whitespace-nowrap text-sm text-muted-foreground">
              {quote}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};