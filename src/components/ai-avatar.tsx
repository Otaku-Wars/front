import { BotIcon as Robot } from 'lucide-react'
import { cn } from "../lib/utils"

interface AIAvatarProps {
  src: string
  alt: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function AIAvatar({ src, alt, size = "md", className }: AIAvatarProps) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  }

  const badgeSizeClasses = {
    sm: "h-4 px-1",
    md: "h-5 px-1.5",
    lg: "h-6 px-2"
  }

  const iconSizeClasses = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3"
  }

  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "rounded-full overflow-hidden border-2 border-primary/10",
        sizeClasses[size]
      )}>
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-full object-cover"
        />
      </div>
      <div className={cn(
        "absolute -top-1 -right-1 bg-blue-500 rounded-full flex items-center gap-0.5",
        badgeSizeClasses[size]
      )}>
        <Robot className={cn("text-white", iconSizeClasses[size])} />
        <span className={cn(
          "text-white font-medium",
          size === "sm" && "text-[8px]",
          size === "md" && "text-[10px]",
          size === "lg" && "text-xs"
        )}>
          AI
        </span>
      </div>
    </div>
  )
}

