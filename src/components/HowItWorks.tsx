import { MessageSquare, Radio, Music, Volume2 } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Set your news preferences",
    description: "Choose topics, mood, and learning goals. Our AI personalizes your experience."
  },
  {
    icon: Radio,
    title: "SonicBrief curates key headlines", 
    description: "Advanced algorithms select and structure content for optimal neural absorption."
  },
  {
    icon: Music,
    title: "Listen with a melodic audio stream",
    description: "Voice, music, and frequencies sync to enhance focus and memory encoding."
  },
  {
    icon: Volume2,
    title: "Experience neuroadaptive learning",
    description: "Your brain's natural rhythms align with content for maximum retention."
  }
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-12 sm:py-24 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            HOW IT WORKS
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Science-backed neuromodulation meets personalized content delivery
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow group-hover:shadow-neural transition-all duration-500">
                  <step.icon className="w-10 h-10 text-primary-foreground" />
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent"></div>
                )}
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Neural visualization */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-4 p-6 bg-card/50 rounded-2xl border border-border/20 backdrop-blur-sm">
            <div className="flex space-x-1">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i}
                  className="w-1 bg-primary rounded-full animate-audio-wave"
                  style={{ 
                    height: Math.random() * 20 + 10 + 'px',
                    animationDelay: i * 0.1 + 's'
                  }}
                ></div>
              ))}
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SONICBRIEF
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};