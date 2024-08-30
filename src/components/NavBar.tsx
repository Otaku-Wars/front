import { useState } from 'react'
import { useLogin, usePrivy, useWallets } from '@privy-io/react-auth'
import { useNavigate } from 'react-router-dom'
import { Menu } from "lucide-react"

import { Button } from "../components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "../components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "../components/ui/dialog"
import { apiUrl } from '../main'

export const truncateWallet = (wallet: string) => {
  if (!wallet) {
    return ''
  }
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
}

export function NavBar() {
  const { wallets } = useWallets()
  const { authenticated } = usePrivy()
  const { login } = useLogin({
    onComplete: async (user, isNewUser, wasAlreadyAuthenticated, loginMethod, linkedAccount) => {
      //console.log(user, isNewUser, wasAlreadyAuthenticated, loginMethod, linkedAccount);
      // Any logic you'd like to execute if the user is/becomes authenticated while this
      // component is mounted
      //if new user request server to initiate pfp, username, and social
      try {
        const response = await fetch(`${apiUrl}/users/new/${address}`);
        return response.json();
      } catch (error) {
          console.error('Error fetching new user:', error);
          return undefined;
      }
    },
  })
  const address = wallets[0]?.address ?? ''
  const navigate = useNavigate()

  const [showHowToModal, setShowHowToModal] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center w-full pl-1 pr-1">
        <a href="/" className="mr-6 flex items-center space-x-2 xl">
          <img src="/logo.gif" alt="MemeClash.Tv Logo" className="h-6 w-auto" />
          {/* Uncomment if you want to include the text logo */}
          <span className="hidden text-3xl font-bold xl:inline-block">
            Meme<span className='text-blue'>Clash</span><span className="text-primary">.Tv</span>
          </span>
        </a>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Dialog open={showHowToModal} onOpenChange={setShowHowToModal}>
              <DialogTrigger asChild>
                <Button variant="ghost">How It Works</Button>
              </DialogTrigger>
              <DialogContent>
                {/* Add your HowToModal content here */}
                <h2>How It Works</h2>
                {/* ... */}
              </DialogContent>
            </Dialog>
            <a
              href="https://discord.gg/uUdQZXXBPf"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Chat
            </a>
          </nav>
          <div className="flex items-center space-x-2">
            {authenticated ? (
              <Button
                variant="outline"
                onClick={() => navigate(`/user/${address}`)}
              >
                {truncateWallet(address)}
              </Button>
            ) : (
              <Button onClick={login}>Log in / Sign up</Button>
            )}
          </div>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="ml-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <nav className="flex flex-col space-y-4">
              <Button variant="ghost" onClick={() => setShowHowToModal(true)}>How It Works</Button>
              <a
                href="https://discord.gg/uUdQZXXBPf"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Chat
              </a>
              {authenticated ? (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/user/${address}`)}
                >
                  {truncateWallet(address)}
                </Button>
              ) : (
                <Button onClick={login}>Log in / Sign up</Button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}