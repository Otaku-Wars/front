import { FaTwitter, FaTelegram, FaQuestionCircle } from 'react-icons/fa'
import { cn } from '../../lib/utils'
import { User } from '@memeclashtv/types'

interface UserAvatarProps {
  user: User
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  return (
    <div className={cn("relative", className)}>
      <div className={cn("rounded-full overflow-hidden", sizeClasses[size])}>
        {user.pfp ? (
          <img 
            src={user.pfp} 
            alt={user.username || user.address} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={cn("bg-muted flex items-center justify-center", sizeClasses[size])}>
            <span className="text-muted-foreground">
              {(user.username?.[0] || user.address[0]).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      
      <div className="absolute -top-1 -right-1 rounded-full bg-background p-0.5">
        {user.social === 'Twitter' && (
          <FaTwitter className="w-4 h-4 text-blue-400" />
        )}
        {user.social === 'Telegram' && (
          <FaTelegram className="w-4 h-4 text-blue-500" />
        )}
        {!user.social && (
          <FaQuestionCircle className="w-4 h-4 text-gray-500" />
        )}
      </div>
    </div>
  )
} 