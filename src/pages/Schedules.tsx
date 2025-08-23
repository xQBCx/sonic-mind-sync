import { Header } from "@/components/Header";
import { ScheduleManager } from "@/components/ScheduleManager";

const Schedules = () => {
  return (
    <div className="min-h-screen bg-gradient-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <ScheduleManager />
        </div>
      </main>
    </div>
  );
};

export default Schedules;