import { Link } from "react-router-dom"
import { useLocation } from "react-router-dom"
import { Home, Gift, Wallet, Trophy } from 'lucide-react'
import { cn } from "../lib/utils"
import { usePrivy } from "@privy-io/react-auth"

export function BottomNav() {
  const location = useLocation()
  const {authenticated, login} = usePrivy()
  const isTelegramWebView = (
    typeof window !== "undefined" &&
    typeof window.Telegram !== "undefined" &&
    navigator?.userAgent?.includes("Telegram")
  );

  // Handler for wallet click
  const handleWalletClick = (e: React.MouseEvent) => {
    if (!authenticated && !isTelegramWebView) {
      e.preventDefault();
      login();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-xl border-t pb-5 pt-2">
      <nav className="flex h-16 max-w-md mx-auto pb-3 pt-2">
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
          onClick={handleWalletClick}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-200",
            location.pathname === "/wallet" ? "text-primary scale-110" : "text-muted-foreground hover:text-primary"
          )}
        >
          <Wallet className="h-6 w-6" />
          <span className="text-xs">Wallet</span>
        </Link>
        <Link
          to="/rankings"
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-200",
            location.pathname === "/rankings" ? "text-primary scale-110" : "text-muted-foreground hover:text-primary"
          )}
        >
          <Trophy className="h-6 w-6" />
          <span className="text-xs">Rankings</span>
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

