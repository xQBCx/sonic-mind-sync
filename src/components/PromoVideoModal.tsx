import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';

export const PromoVideoModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Check if user has opted out of the promo video
    const hasOptedOut = localStorage.getItem('sonicbrief-promo-opted-out');
    const lastShown = localStorage.getItem('sonicbrief-promo-last-shown');
    const today = new Date().toDateString();

    if (!hasOptedOut && lastShown !== today) {
      // Show modal after a short delay
      const timer = setTimeout(() => {
        setShowModal(true);
        localStorage.setItem('sonicbrief-promo-last-shown', today);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('sonicbrief-promo-opted-out', 'true');
    }
    setShowModal(false);
  };

  const handleOptOut = () => {
    localStorage.setItem('sonicbrief-promo-opted-out', 'true');
    setShowModal(false);
  };

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl sm:text-2xl font-bold">
              Welcome to SonicBrief! 🎵
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6">
          <p className="text-sm sm:text-lg text-muted-foreground">
            Discover how our patent-pending AI technology creates personalized audio experiences that sync with your brain's natural learning patterns.
          </p>
          
          <div className="aspect-video w-full max-w-full">
            <iframe
              src="https://www.youtube.com/embed/JBgx7Y_3sXM"
              title="SonicBrief AI Promo Video"
              className="w-full h-full rounded-lg"
              allowFullScreen
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dont-show-again"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(!!checked)}
              />
              <label 
                htmlFor="dont-show-again" 
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Don't show this again
              </label>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button variant="outline" onClick={handleOptOut} className="w-full sm:w-auto">
                No thanks
              </Button>
              <Button onClick={handleClose} className="w-full sm:w-auto">
                Get Started
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p className="font-medium mb-1">Cookie Notice:</p>
            <p>
              We use local storage to remember your preference about promotional content. 
              This helps improve your experience by not showing the same content repeatedly. 
              No personal data is collected or shared with third parties.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};