import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Clock, Brain, Sun, Moon, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Schedule {
  id: string;
  label: string;
  schedule_time: string;
  timezone: string;
  mood: string;
  duration_sec: number;
  topics: string[];
  is_active: boolean;
}

export const ScheduleManager = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state for new schedule
  const [newSchedule, setNewSchedule] = useState({
    label: "",
    schedule_time: "07:00",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    mood: "energizing",
    duration_sec: 300,
    topics: [] as string[],
    is_active: true
  });

  const presetSchedules = [
    {
      label: "Morning Boost",
      schedule_time: "07:00",
      mood: "energizing",
      duration_sec: 300,
      topics: ["productivity", "motivation"],
      icon: Sun
    },
    {
      label: "Midday Focus",
      schedule_time: "12:00", 
      mood: "focused",
      duration_sec: 240,
      topics: ["work", "concentration"],
      icon: Target
    },
    {
      label: "Evening Wind-down",
      schedule_time: "21:00",
      mood: "calming",
      duration_sec: 480,
      topics: ["relaxation", "meditation"],
      icon: Moon
    }
  ];

  const moodOptions = [
    { value: "energizing", label: "Energizing ⚡", color: "bg-orange-500/20" },
    { value: "focused", label: "Focused 🎯", color: "bg-blue-500/20" },
    { value: "calming", label: "Calming 🧘", color: "bg-green-500/20" },
    { value: "creative", label: "Creative ✨", color: "bg-purple-500/20" },
    { value: "motivational", label: "Motivational 🚀", color: "bg-red-500/20" }
  ];

  const topicOptions = [
    "productivity", "motivation", "work", "concentration", "relaxation", 
    "meditation", "learning", "creativity", "wellness", "mindfulness",
    "AI", "technology", "business", "health", "personal growth"
  ];

  useEffect(() => {
    fetchSchedules();
  }, [user]);

  const fetchSchedules = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('schedule_time');
      
      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: "Error loading schedules",
        description: "Please refresh to try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createSchedule = async () => {
    if (!user || !newSchedule.label.trim()) return;

    try {
      const { error } = await supabase
        .from('schedules')
        .insert([{
          user_id: user.id,
          ...newSchedule
        }]);

      if (error) throw error;

      toast({
        title: "Schedule created!",
        description: `Your ${newSchedule.label} schedule is now active.`
      });

      // Reset form
      setNewSchedule({
        label: "",
        schedule_time: "07:00",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        mood: "energizing",
        duration_sec: 300,
        topics: [],
        is_active: true
      });
      
      setIsCreating(false);
      fetchSchedules();
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast({
        title: "Error creating schedule",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleSchedule = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      
      fetchSchedules();
      toast({
        title: isActive ? "Schedule enabled" : "Schedule disabled",
        description: isActive ? "You'll receive notifications at the scheduled time." : "No more notifications for this schedule."
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: "Error updating schedule",
        variant: "destructive"
      });
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      fetchSchedules();
      toast({
        title: "Schedule deleted",
        description: "The schedule has been removed."
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: "Error deleting schedule",
        variant: "destructive"
      });
    }
  };

  const createPresetSchedule = (preset: typeof presetSchedules[0]) => {
    setNewSchedule({
      ...preset,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      is_active: true
    });
    setIsCreating(true);
  };

  const toggleTopic = (topic: string) => {
    setNewSchedule(prev => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter(t => t !== topic)
        : [...prev.topics, topic]
    }));
  };

  if (!user) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Sign in to create schedules</h3>
          <p className="text-muted-foreground">
            Create personalized daily schedules for your SonicBrief sessions.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your schedules...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-2xl">Daily Schedule Manager</CardTitle>
              <p className="text-muted-foreground">
                Create personalized daily routines that adapt to your lifestyle and goals.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Presets */}
      {schedules.length === 0 && (
        <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Quick Start Templates</CardTitle>
            <p className="text-sm text-muted-foreground">
              Get started with these proven daily schedules
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {presetSchedules.map((preset, index) => {
                const IconComponent = preset.icon;
                return (
                  <Card key={index} className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors cursor-pointer" 
                        onClick={() => createPresetSchedule(preset)}>
                    <CardContent className="p-4 text-center">
                      <IconComponent className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold mb-1">{preset.label}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{preset.schedule_time}</p>
                      <Badge variant="outline" className="text-xs">{preset.mood}</Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Schedules */}
      {schedules.length > 0 && (
        <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Your Active Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedules.map((schedule) => {
                const moodOption = moodOptions.find(m => m.value === schedule.mood);
                return (
                  <div key={schedule.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-mono text-primary">
                        {schedule.schedule_time}
                      </div>
                      <div>
                        <h3 className="font-semibold">{schedule.label}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={moodOption?.color}>
                            {moodOption?.label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {Math.floor(schedule.duration_sec / 60)}min
                          </span>
                        </div>
                        {schedule.topics.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {schedule.topics.slice(0, 3).map(topic => (
                              <Badge key={topic} variant="outline" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                            {schedule.topics.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{schedule.topics.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={schedule.is_active}
                        onCheckedChange={(checked) => toggleSchedule(schedule.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSchedule(schedule.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create New Schedule */}
      <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {isCreating ? "Create New Schedule" : "Add Custom Schedule"}
            </CardTitle>
            {!isCreating && (
              <Button onClick={() => setIsCreating(true)} className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Schedule
              </Button>
            )}
          </div>
        </CardHeader>
        {isCreating && (
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="label">Schedule Name</Label>
                <Input
                  id="label"
                  value={newSchedule.label}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g., Morning Motivation"
                />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={newSchedule.schedule_time}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, schedule_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Mood & Tone</Label>
                <Select 
                  value={newSchedule.mood} 
                  onValueChange={(value) => setNewSchedule(prev => ({ ...prev, mood: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {moodOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="60"
                  value={Math.floor(newSchedule.duration_sec / 60)}
                  onChange={(e) => setNewSchedule(prev => ({ 
                    ...prev, 
                    duration_sec: parseInt(e.target.value) * 60 
                  }))}
                />
              </div>
            </div>

            <div>
              <Label>Topics & Interests</Label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-2">
                {topicOptions.map(topic => (
                  <Badge
                    key={topic}
                    variant={newSchedule.topics.includes(topic) ? "default" : "outline"}
                    className="cursor-pointer justify-center py-1"
                    onClick={() => toggleTopic(topic)}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button onClick={createSchedule} className="bg-gradient-primary">
                Create Schedule
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Analytics Preview */}
      <Card className="bg-card/80 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Your Audio Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{schedules.filter(s => s.is_active).length}</div>
              <div className="text-sm text-muted-foreground">Active Schedules</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {schedules.reduce((acc, s) => acc + (s.is_active ? s.duration_sec : 0), 0) / 60}
              </div>
              <div className="text-sm text-muted-foreground">Daily Minutes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">🚀</div>
              <div className="text-sm text-muted-foreground">Habit Building</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">🧠</div>
              <div className="text-sm text-muted-foreground">Neural Adaptation</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
