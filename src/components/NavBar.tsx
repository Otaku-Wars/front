import { useState } from 'react'
import { useLogin, usePrivy, useWallets } from '@privy-io/react-auth'
import { Link, useNavigate } from 'react-router-dom'
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog"
import { apiUrl } from '../main'
import { useAccount } from 'wagmi'
import { useSetActiveWallet } from '@privy-io/wagmi'
import { useBattleState, useUser } from '../hooks/api'

export const truncateWallet = (wallet: string) => {
  if (!wallet) {
    return ''
  }
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
}

// Custom Button Component
const CustomButton = ({ children, onClick, shouldBreathDefault = false }) => (
  <button
    id='CustomButtonNavBar'
    onClick={onClick}
    className={`text-black font-bold px-8 py-3 rounded-md shadow-md focus:outline-none h-73 w-308 transition-all duration-300 ease-in-out transform hover:scale-105 ${shouldBreathDefault ? 'breathing' : ''}`}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      color: 'black',
      backgroundColor: '#F6E359',
      borderRadius: '1px',
      textShadow: `
        2px 2px 0 #FFFFFF, 
        2px 2px 0 #FFFFFF, 
        2px 2px 0 #FFFFFF, 
        2px 2px 0 #FFFFFF
      `,
    }}
  >
    {children}
    <style>{`
      #CustomButtonNavBar:hover {
        background-color: #FFFB3B; /* Brighter color */
        background: linear-gradient(to right, #FFFB3B, #FFEB3B); /* Gradient effect */
        text-shadow: 4px 4px 0 #FFFFFF, 4px 4px 0 #FFFFFF, 4px 4px 0 #FFFFFF, 4px 4px 0 #FFFFFF; /* Shadow moves */
        transform: scale(1.1); /* Button gets slightly bigger */
      }
        .breathing {
        animation: breathing 2s ease-in-out infinite;
      }
      @keyframes breathing {
        0%, 100% {
          transform: scale(1);
          background-color: #F8DE7E;
          
        }
        50% {
          transform: scale(1.05);
          background-color: #FFF200;
          box-shadow: 0 0 10px #FFF200;

        }
      }
    `}</style>
  </button>
)

export function NavBar() {
  const { authenticated, user } = usePrivy()
  const { data: battleState } = useBattleState()
  const address = user?.wallet?.address;
  const {setActiveWallet} = useSetActiveWallet()
  const { login } = useLogin({
    onComplete: async (user, isNewUser, wasAlreadyAuthenticated, loginMethod, linkedAccount) => {
      try {
        const response = await fetch(`${apiUrl}/users/new/${address}`);
        return response.json();
      } catch (error) {
          console.error('Error fetching new user:', error);
          return undefined;
      }
    },
  })
  const {address: mainAddress} = useAccount()
  console.log("mainAddress", mainAddress)
  console.log("mainAddress2", address)

  if(authenticated){
    //setActiveWallet(wallets[0])
  }

  const currentSong = (battleState as any)?.currentSong;

  const navigate = useNavigate()

  const [showHowToModal, setShowHowToModal] = useState(false)

  const userApi = useUser(address)
  const pfp = (userApi as any)?.pfp;
  const username = (userApi as any)?.username;
  const displayName = username ? 
    "@" + username:
    address ?
      truncateWallet(address):
      "Loading..."
    "Loading.."


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[#151519] backdrop-blur supports-[backdrop-filter]:bg-background">
      <div className="flex h-20 items-center w-full pl-5 pr-5">
        <Link to="/" className="mr-6 flex items-center space-x-2 xl:flex-row">
          <img src="/logo.png" alt="MemeClash.Tv Logo" className="h-10 w-auto" />
          <span className="hidden text-3xl font-bold xl:inline-block mt-1">
            <img src="/logo-text.png" alt="MemeClash.Tv" className="h-10 w-auto" />
          </span>
          {currentSong && (
            <span className="text-sm text-foreground/60 w-10" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', animation: 'scroll 10s linear infinite' }}>
              Now Playing: {currentSong}
            </span>
          )}
        </Link>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="hidden md:flex items-center text-sm font-medium gap-4">
            <Dialog open={showHowToModal} onOpenChange={setShowHowToModal}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="font-bold" style={{color: '#F6E359'}}>How it works</Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 text-white p-6">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold mb-4">How it works</DialogTitle>
                  <DialogDescription>
                    <p className="mb-4">
                      <span className="text-yellow-300">MemeClash.TV is a non-stop livestream of AI characters fight. Each character has unique skills and fight each others 24/7.</span>
                    </p>
                    <p className="mb-4">
                      <span className="text-orange-400">Fight and Earn:</span> Characters take 10% of the opponent's money (market cap) when they win.
                    </p>
                    <p className="mb-4">
                      <span className="text-green-400">Buy Shares:</span> Every character has its own shares. The more people buy, the higher the price.
                    </p>
                    <p className="mb-4">
                      <span className="text-yellow-300">Power Ups:</span> Lock your shares to power up your character.
                    </p>
                    <p className="mb-4">
                      <span className="text-blue-400">Make Profit:</span> Sell your shares anytime and secure your profit/loss.
                    </p>
                  </DialogDescription>
                </DialogHeader>
                
              </DialogContent>
            </Dialog>
            <a
              href="https://x.com/MemeClashTv"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground/80 px-4 font-bold text-center"
              style={{color: '#F6E359'}}
            >
              Twitter
            </a>
            {authenticated ? (
              <CustomButton onClick={() => navigate(`/user/${address}`)}>
                {displayName}
              </CustomButton>
            ) : (
              <CustomButton shouldBreathDefault={true} onClick={login}>Log in / Sign up</CustomButton>
            )}
          </nav>
          
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
              <Button variant="ghost" className="font-bold" style={{color: '#F6E359'}} onClick={() => setShowHowToModal(true)}>How It Works</Button>
              <a
              href="https://x.com/MemeClashTv"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground/80 px-4 font-bold text-center"
              style={{color: '#F6E359'}}
            >
              Twitter
            </a>
              {authenticated ? (
                <CustomButton onClick={() => navigate(`/user/${address}`)}>
                  {displayName}
                </CustomButton>
              ) : (
                <CustomButton shouldBreathDefault={true} onClick={login}>Log in / Sign up</CustomButton>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}