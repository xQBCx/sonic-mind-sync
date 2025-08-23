import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfileSetupProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const UserProfileSetup = ({ onComplete, onSkip }: UserProfileSetupProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    age: '',
    origin: '',
    interests: '',
    language_preference: '',
    learning_goals: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Create or update user profile using direct SQL
      const { error } = await supabase
        .from('profiles' as any)
        .upsert({
          user_id: user.id,
          age: profile.age ? parseInt(profile.age) : null,
          origin: profile.origin || null,
          interests: profile.interests || null,
          language_preference: profile.language_preference || null,
          learning_goals: profile.learning_goals || null,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Profile saved",
        description: "Your preferences will help us create better SonicBriefs for you!"
      });

      onComplete();
    } catch (error) {
      console.error('Profile setup error:', error);
      toast({
        title: "Error saving profile",
        description: "We'll ask again later. You can continue for now.",
        variant: "destructive"
      });
      onSkip();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8 bg-card/80 border-border/20 backdrop-blur-sm">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Help Us Personalize Your Experience</h2>
          <p className="text-muted-foreground">
            Your background helps us create SonicBriefs that resonate with you personally - 
            like your grandmother's response to Italian music and language.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="age">Age (optional)</Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                value={profile.age}
                onChange={(e) => setProfile(prev => ({ ...prev, age: e.target.value }))}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="origin">Cultural Background/Origin</Label>
              <Input
                id="origin"
                placeholder="Italy, USA, Japan, etc."
                value={profile.origin}
                onChange={(e) => setProfile(prev => ({ ...prev, origin: e.target.value }))}
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="language">Preferred Language</Label>
            <Select value={profile.language_preference} onValueChange={(value) => setProfile(prev => ({ ...prev, language_preference: value }))}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select your preferred language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="spanish">Spanish</SelectItem>
                <SelectItem value="french">French</SelectItem>
                <SelectItem value="german">German</SelectItem>
                <SelectItem value="italian">Italian</SelectItem>
                <SelectItem value="portuguese">Portuguese</SelectItem>
                <SelectItem value="mandarin">Mandarin Chinese</SelectItem>
                <SelectItem value="arabic">Arabic</SelectItem>
                <SelectItem value="japanese">Japanese</SelectItem>
                <SelectItem value="korean">Korean</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="interests">Your Interests & Topics</Label>
            <Textarea
              id="interests"
              placeholder="Technology, Health, Music, History, Business, Science, Art, Sports..."
              value={profile.interests}
              onChange={(e) => setProfile(prev => ({ ...prev, interests: e.target.value }))}
              className="mt-2"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="goals">Learning Goals</Label>
            <Textarea
              id="goals"
              placeholder="Stay updated on tech trends, learn Python development, improve health knowledge..."
              value={profile.learning_goals}
              onChange={(e) => setProfile(prev => ({ ...prev, learning_goals: e.target.value }))}
              className="mt-2"
              rows={3}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onSkip}
              className="flex-1"
              disabled={loading}
            >
              Skip for Now
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save & Continue"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};