import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VoiceInterface: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversation, setConversation] = useState<string[]>([]);
  const chatRef = useRef<RealtimeChat | null>(null);

  const handleMessage = (event: any) => {
    console.log('Received message:', event);
    
    if (event.type === 'response.audio.delta') {
      setIsSpeaking(true);
    } else if (event.type === 'response.audio.done') {
      setIsSpeaking(false);
    } else if (event.type === 'response.audio_transcript.delta') {
      // Handle AI speech transcription
      setConversation(prev => {
        const newConv = [...prev];
        if (newConv[newConv.length - 1]?.startsWith('AI: ')) {
          newConv[newConv.length - 1] += event.delta;
        } else {
          newConv.push('AI: ' + event.delta);
        }
        return newConv;
      });
    } else if (event.type === 'conversation.item.input_audio_transcription.completed') {
      // Handle user speech transcription
      setConversation(prev => [...prev, 'You: ' + event.transcript]);
    } else if (event.type === 'brief_created') {
      // Navigate to the created brief
      if (event.data?.briefId) {
        toast({
          title: "Audio Brief Created!",
          description: "Your personalized audio content is ready",
        });
        navigate(`/brief/${event.data.briefId}`);
      }
    }
  };

  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
    if (!connected) {
      setIsSpeaking(false);
      setIsListening(false);
    }
  };

  const startConversation = async () => {
    try {
      // First check if we have microphone permission
      let permissionGranted = false;
      
      try {
        // Request microphone permission first
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop the stream immediately - we just needed to check permission
        stream.getTracks().forEach(track => track.stop());
        permissionGranted = true;
      } catch (permissionError) {
        console.error('Microphone permission error:', permissionError);
        
        let errorMessage = 'Microphone access denied';
        if (permissionError instanceof Error) {
          if (permissionError.name === 'NotAllowedError') {
            errorMessage = 'Microphone permission denied. Please allow microphone access and try again.';
          } else if (permissionError.name === 'NotFoundError') {
            errorMessage = 'No microphone found. Please connect a microphone and try again.';
          } else if (permissionError.name === 'NotSupportedError') {
            errorMessage = 'Microphone not supported in this browser.';
          } else {
            errorMessage = `Microphone error: ${permissionError.message}`;
          }
        }
        
        toast({
          title: "Microphone Access Required",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
      
      if (!permissionGranted) {
        toast({
          title: "Microphone Access Required",
          description: "Please allow microphone access to use voice features.",
          variant: "destructive",
        });
        return;
      }
      
      // Now start the realtime chat
      chatRef.current = new RealtimeChat(handleMessage, handleConnectionChange);
      await chatRef.current.connect();
      setIsListening(true);
      
      toast({
        title: "Voice Interface Active",
        description: "Start speaking! Tell me what you'd like to learn or how you're feeling.",
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : 'Failed to connect to voice service',
        variant: "destructive",
      });
    }
  };

  const endConversation = () => {
    chatRef.current?.disconnect();
    setIsListening(false);
    setIsSpeaking(false);
    setConversation([]);
  };

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Main Voice Interface */}
        <Card className="p-8 text-center bg-card/50 backdrop-blur-sm border-2">
          <div className="space-y-6">
            {/* Voice Indicator */}
            <div className="flex justify-center">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                isSpeaking 
                  ? 'bg-accent animate-pulse scale-110' 
                  : isListening 
                    ? 'bg-primary animate-pulse' 
                    : 'bg-muted'
              }`}>
                {isSpeaking ? (
                  <Volume2 className="w-12 h-12 text-accent-foreground" />
                ) : isListening ? (
                  <Mic className="w-12 h-12 text-primary-foreground" />
                ) : (
                  <MicOff className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Status Text */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">SonicBrief Voice</h1>
              <p className="text-muted-foreground">
                {isSpeaking 
                  ? 'AI is speaking...' 
                  : isListening 
                    ? 'Listening... speak naturally about what you want to learn or how you feel'
                    : 'Press start to begin your voice conversation'
                }
              </p>
            </div>

            {/* Example Prompts */}
            {!isConnected && (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="font-medium">Try saying something like:</p>
                <div className="grid gap-2">
                  <p className="p-2 bg-muted/50 rounded text-left">"I'm stressed about work and want to learn meditation with calming sounds"</p>
                  <p className="p-2 bg-muted/50 rounded text-left">"I want to learn Python while listening to heavy metal beats"</p>
                  <p className="p-2 bg-muted/50 rounded text-left">"What would Tony Robbins say about my business situation?"</p>
                </div>
              </div>
            )}

            {/* Control Button */}
            <Button 
              onClick={isConnected ? endConversation : startConversation}
              size="lg"
              className={`px-8 py-4 text-lg ${
                isConnected 
                  ? 'bg-destructive hover:bg-destructive/90' 
                  : 'bg-primary hover:bg-primary/90'
              }`}
              disabled={false}
            >
              {isConnected ? 'End Conversation' : 'Start Voice Chat'}
            </Button>
          </div>
        </Card>

        {/* Conversation Log */}
        {conversation.length > 0 && (
          <Card className="p-4 bg-card/30 backdrop-blur-sm">
            <h3 className="font-medium mb-3">Conversation:</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {conversation.map((message, index) => (
                <p 
                  key={index} 
                  className={`text-sm p-2 rounded ${
                    message.startsWith('You: ') 
                      ? 'bg-primary/10 text-primary-foreground/80 ml-4' 
                      : 'bg-muted/50 mr-4'
                  }`}
                >
                  {message}
                </p>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VoiceInterface;