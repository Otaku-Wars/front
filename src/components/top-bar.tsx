import { ArrowLeft, History, HelpCircle, X } from 'lucide-react'
import { Button } from './ui/button'
import { useLocation, useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { haptics } from '../utils/haptics'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "./ui/sheet"
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom';

export function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showHowTo, setShowHowTo] = useState(false)

  const isHomePage = location.pathname === '/'

  const handleBackClick = () => {
    haptics.medium()
    navigate(-1)
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between h-14 max-w-md mx-auto relative">
          {isHomePage ? (
            <></>
          ) : (
            <Button variant="ghost" size="icon" className="absolute left-2" onClick={handleBackClick}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Link to="/" className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
            <img
              src="https://memeclash.tv/logo.png"
              alt="MemeClash.TV Logo"
              className="h-8 w-8"
            />
            <img
              src="https://memeclash.tv/logo-text.png"
              alt="MemeClash.TV"
              className="h-7 mt-1"
            />
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2" 
            onClick={() => setShowHowTo(true)}
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {showHowTo && createPortal(
        <div className="fixed inset-0 z-[99999998]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80"
            onClick={() => setShowHowTo(false)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl z-[60] h-screen flex flex-col"
          >
            <div className="flex flex-col h-full pb-[env(safe-area-inset-bottom,16px)]">
              <div className="w-full flex justify-between items-center px-4 py-2 flex-shrink-0 relative">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-8 h-1 bg-muted rounded-full" />
                </div>
                <div className="w-8" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHowTo(false)}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="overflow-y-auto flex-1 px-4 py-3">
                <h2 className="text-2xl font-bold mb-4">
                  Welcome to MemeClash.TV
                </h2>
                <div className="space-y-4 text-base">
                  <p>
                    <span className="text-yellow-300 font-bold">
                      MemeClash.TV is a 24/7 livestream where AI characters battle for market share.
                    </span>
                  </p>
                  <div>
                    <span className="text-yellow-300 font-bold flashing-arbitrary">Deposit:</span>
                    <p className="mt-1">
                      Deposit ETH (only on Base Mainnet) to your embedded wallet. Withdraw ETH to an external wallet at any time.
                    </p>
                    <span className="text-gray-300 text-xs"> Your embedded wallet is created from your Telegram account. </span>
                  </div>
                  <div>
                    <span className="text-green-400 font-bold flashing-arbitrary">Buy Shares:</span>
                    <p className="mt-1">
                      Every character has its own token, and the price rises as more people buy along a simple bonding curve.
                    </p>
                    <div className="bg-muted/30 p-2 rounded-md mt-1 text-sm font-mono overflow-x-auto whitespace-nowrap">
                      P(x) = 0.05*((x-50000)/sqrt(10000000+(x-50000)^2)+1)
                    </div>
                  </div>

                  <div>
                    <span className="text-orange-400 font-bold flashing-arbitrary">Fight and Earn:</span>
                    <p className="mt-1">
                      When a character wins, they take 10% of their opponent's market cap, boosting the price of their token.
                    </p>
                  </div>

                  <div>
                    <span className="text-red-400 font-bold flashing-arbitrary">AI Logic:</span>
                    <p className="mt-1">
                      Each character is a fully open source fighting game bot with unique frame data, animations, and logic.
                    </p>
                  </div>

                  <div>
                    <span className="text-blue-400 font-bold flashing-arbitrary">Make Profit:</span>
                    <p className="mt-1">
                      Sell your tokens whenever you want to cash in your gains — just not during battles when shares are locked.
                    </p>
                  </div>

                  <div className="bg-yellow-300/10 p-4 rounded-lg mt-6">
                    <h2 className="text-xl text-center font-bold text-yellow-300 flashing-arbitrary">
                      BUY YOUR FAVORITE CHARACTER NOW !!!
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </>
  )
}

