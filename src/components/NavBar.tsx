import { useEffect, useState } from 'react'
import { ConnectedWallet, useLogin, usePrivy, useWallets } from '@privy-io/react-auth'
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

      .breathing-green {
        animation: breathing-green 2s ease-in-out infinite;
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

      @keyframes breathing-green {
        0%, 100% {
          transform: scale(1);
          background-color: #10B981;
          
        }
        50% {
          transform: scale(1.05);
          background-color: #00ff00;
          box-shadow: 0 0 10px #00ff00;
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
  const { wallets } = useWallets()
  const { login } = useLogin({
    onComplete: async (user, isNewUser, wasAlreadyAuthenticated, loginMethod, linkedAccount) => {
      try {
        console.log("loginMethod", loginMethod)
        const userAddress = user?.wallet?.address;
        if(isNewUser && loginMethod == 'twitter'){
          const response = await fetch(`${apiUrl}/users/new/${userAddress}`);
          return response.json();
        } else {
          // Get user from API
          const response = await fetch(`${apiUrl}/users/${userAddress}`);
          const userFromApi = await response.json();
          if(!userFromApi?.username || !userFromApi?.pfp){
            // Create new user
            const response = await fetch(`${apiUrl}/users/new/${userAddress}`);
            return response.json();
          }
        }
      } catch (error) {
        console.error('Error fetching new user:', error);
        return undefined;
      }
    },
  })
  const {address: mainAddress} = useAccount()
  console.log("mainAddress", mainAddress)
  console.log("mainAddress2", address)


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

  useEffect(() => {
    if(authenticated && address){
      const wallet = wallets.find((wallet: ConnectedWallet) => wallet.address === address)
      if(wallet){
        console.log("setting active wallet", wallet)
        setActiveWallet(wallet)
      }
    }
  }, [authenticated, wallets, address, setActiveWallet])
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gray-900 text-gray-300 rounded-lg shadow-lg w-full overflow-y-auto custom-scrollbar">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #4b5563 #1f2937;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;
        }
      `}</style>
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
                <Button variant="ghost" className="text-2xl font-bold" style={{color: '#F6E359'}}>How it works</Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 text-white p-6">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold mb-4">How it works</DialogTitle>
                  <DialogDescription className="text-lg">
                    <p className="mb-4">
                      <span className="text-yellow-300">MemeClash.TV is a 24/7 livestream where AI characters battle for market share.</span>
                    </p>
                    <p className="mb-4">
                      <span className="text-green-400">Buy Shares:</span> Every character has its own token, and the price rises as more people buy along a simple bonding curve. (y = x/100,000)
                    </p>
                    <p className="mb-4">
                      <span className="text-orange-400">Fight and Earn:</span> When a character wins, they take 10% of opponent's market cap, boosting their token's value. The more they win, the higher their token price.
                    </p>
                  
                    {/* <p className="mb-4">
                      <span className="text-yellow-300">Power Ups:</span> Lock your shares to power up your character.
                    </p> */}
                    <p className="mb-4">
                      <span className="text-blue-400">Make Profit:</span> Sell your tokens whenever you want to cash in your gains — just not during battles when shares are locked.
                    </p>
                  </DialogDescription>
                </DialogHeader>
                
              </DialogContent>
            </Dialog>
            <a
              href="https://x.com/MemeClashTv"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground/80 px-4 font-bold text-center text-2xl"
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
              <Button variant="ghost" className="text-2xl font-bold" style={{color: '#F6E359'}} onClick={() => setShowHowToModal(true)}>How It Works</Button>
              <a
              href="https://x.com/MemeClashTv"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground/80 px-4 font-bold text-center text-2xl"
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