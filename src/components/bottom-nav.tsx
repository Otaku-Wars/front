import { Link } from "react-router-dom"
import { useLocation } from "react-router-dom"
import { Home, Gift, Wallet } from 'lucide-react'
import { cn } from "../lib/utils"

export function BottomNav() {
  const location = useLocation()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t">
      <nav className="flex h-16 max-w-md mx-auto">
        <Link
          to="/"
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-200",
            location.pathname === "/" ? "text-primary scale-110" : "text-muted-foreground hover:text-primary"
          )}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs">Home</span>
        </Link>
        <Link
          to="/wallet"
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-200",
            location.pathname === "/wallet" ? "text-primary scale-110" : "text-muted-foreground hover:text-primary"
          )}
        >
          <Wallet className="h-6 w-6" />
          <span className="text-xs">Wallet</span>
        </Link>
        <Link
          to="/rewards"
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-200",
            location.pathname === "/rewards" ? "text-primary scale-110" : "text-muted-foreground hover:text-primary"
          )}
        >
          <Gift className="h-6 w-6" />
          <span className="text-xs">Points</span>
        </Link>
      </nav>
    </div>
  )
}

