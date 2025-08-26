import { Header } from "@/components/Header";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ViralWaitlist } from "@/components/ViralWaitlist";
import { CalendarDays, Play, FileText, Users } from "lucide-react";

const Blog = () => {
  return (
    <div className="min-h-screen bg-gradient-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              SonicBrief News & Updates
            </h1>
            <p className="text-xl text-muted-foreground">
              Latest research, company updates, and success stories from the sound revolution
            </p>
          </div>

          <div className="grid gap-8">
            {/* Featured Video */}
            <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    <Play className="h-3 w-3 mr-1" />
                    Featured Video
                  </Badge>
                  <Badge variant="outline">Patent-Pending</Badge>
                </div>
                <h2 className="text-2xl font-semibold">SonicBrief AI: The Future of Personalized Audio</h2>
                <p className="text-muted-foreground">
                  Watch our revolutionary approach to personalized audio frequencies designed for peak performance.
                </p>
              </CardHeader>
              <CardContent>
                <div className="aspect-video mb-4">
                  <iframe
                    src="https://www.youtube.com/embed/JBgx7Y_3sXM"
                    title="SonicBrief AI Promo Video"
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                  />
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    December 2024
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Company Update
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Updates */}
            <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-500">
                    <FileText className="h-3 w-3 mr-1" />
                    Company Update
                  </Badge>
                </div>
                <h2 className="text-2xl font-semibold">Patent Application Filed for Revolutionary Audio Technology</h2>
                <p className="text-muted-foreground">
                  SonicBrief has officially filed a provisional patent for our groundbreaking personalized audio frequency technology.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-foreground">
                    We're excited to announce that our provisional patent application has been submitted, with the non-provisional 
                    filing scheduled for this month. This patent-pending technology represents a major breakthrough in personalized 
                    audio experiences for cognitive enhancement.
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      December 2024
                    </div>
                    <Badge variant="outline" className="text-xs">🔬 Patent-Pending</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mission Statement */}
            <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-500">
                    <Users className="h-3 w-3 mr-1" />
                    Mission
                  </Badge>
                </div>
                <h2 className="text-2xl font-semibold">Public Benefit Corporation: Our Commitment to Humanity</h2>
                <p className="text-muted-foreground">
                  Learn about our mission-driven approach and commitment to advancing human potential through sound.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-foreground">
                    As a Public Benefit Corporation, SonicBrief is legally committed to creating positive impact for society, 
                    not just shareholders. Our mission is to democratize access to personalized audio technology that enhances 
                    human cognitive performance, wellness, and potential.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="text-center p-4 rounded-lg bg-primary/10">
                      <div className="text-2xl font-bold text-primary mb-2">🧠</div>
                      <div className="font-semibold">Science-First</div>
                      <div className="text-sm text-muted-foreground">Evidence-based approach</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-primary/10">
                      <div className="text-2xl font-bold text-primary mb-2">🌍</div>
                      <div className="font-semibold">Global Impact</div>
                      <div className="text-sm text-muted-foreground">Accessible worldwide</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-primary/10">
                      <div className="text-2xl font-bold text-primary mb-2">🚀</div>
                      <div className="font-semibold">Mission-Driven</div>
                      <div className="text-sm text-muted-foreground">Purpose over profit</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <ViralWaitlist />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Blog;