import { ArrowLeft, History, Settings } from 'lucide-react'
import { Button } from './ui/button'
import { useLocation, useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'

export function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()

  const isHomePage = location.pathname === '/'

  const handleBackClick = () => {
    navigate(-1)
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-background/80 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between h-14 px-4 max-w-md mx-auto relative">
          {isHomePage ? (
            <Button variant="ghost" size="icon" className="absolute left-4">
              <History className="h-5 w-5" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="absolute left-4" onClick={handleBackClick}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Link to="/" className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src="https://memeclash.tv/logo.png"
                alt="MemeClash.TV Logo"
              />
              <AvatarFallback>MC</AvatarFallback>
            </Avatar>
            <img
              src="https://memeclash.tv/logo-text.png"
              alt="MemeClash.TV"
              className="h-4 mt-1"
            />
          </Link>
          <Button variant="ghost" size="icon" className="absolute right-4">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="bg-yellow-400/90 backdrop-blur-sm overflow-hidden">
        <div className="max-w-md mx-auto py-1.5">
          <div className="whitespace-nowrap animate-scroll">
            <span className="text-xs font-medium text-black inline-block">
              Welcome to MemeClash.TV! Fund your wallet and start trading meme characters now!
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

