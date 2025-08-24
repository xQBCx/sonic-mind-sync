import { useState } from 'react'
import stimmyLight from '@/assets/stimmy-light3d.png'
import stimmyAvatar from '@/assets/stimmy-avatar3d.png'

interface StimmyAvatarProps {
  isSpeaking?: boolean
  isListening?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  onClick?: () => void
}

export function StimmyAvatar({ 
  isSpeaking = false, 
  isListening = false, 
  size = 'md',
  onClick 
}: StimmyAvatarProps) {
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const getAnimationClasses = () => {
    if (isSpeaking) return 'animate-pulse-glow scale-110'
    if (isListening) return 'animate-pulse scale-105'
    return 'hover:scale-105'
  }

  if (imageError) {
    // Fallback to a simple avatar if images fail to load
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full bg-gradient-primary flex items-center justify-center transition-all duration-300 ${getAnimationClasses()} ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        <div className="w-6 h-6 bg-primary-foreground rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`${sizeClasses[size]} relative transition-all duration-300 ${getAnimationClasses()} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <img 
        src={isSpeaking || isListening ? stimmyAvatar : stimmyLight}
        alt="Stimmy - Your AI Learning Companion"
        className="w-full h-full object-contain"
        style={{ background: 'transparent' }}
        onError={handleImageError}
      />
      
      {/* Audio visualization overlay when speaking */}
      {isSpeaking && (
        <div className="absolute inset-0 rounded-full">
          <div className="w-full h-full rounded-full bg-gradient-primary/20 animate-ping" />
        </div>
      )}
      
      {/* Listening indicator */}
      {isListening && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse" />
      )}
    </div>
  )
}