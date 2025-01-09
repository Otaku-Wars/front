import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Share, Users, TrendingUp, UserPlus, Zap, Shield, Copy, Wallet2Icon } from 'lucide-react'
import { useAddress } from '../hooks/user'
import { useUser } from '../hooks/api'
import { useConvertEthToUsd } from '../EthPriceProvider'
import { formatNumber } from '../lib/utils'
import { SHARES_PER_POINT_BOUGHT, SHARES_PER_POINT_HELD, AFFILIATE_SHARES_PER_POINT } from '@memeclashtv/types'
import { RotatingCoin, SmallRotatingCoin } from "../components/ui/rotating-coin"
const BOT_USERNAME = 'memeclashtv_bot'

export function Rewards() {
  const address = useAddress()
  const { data: user } = useUser(address)
  const convertEthToUsd = useConvertEthToUsd()

  const generateAffiliateLink = (userId?: string) => {
    if (!userId) return ''
    const botLink = `https://t.me/${BOT_USERNAME}?start=${userId}`
    return `https://t.me/share/url?url=${encodeURIComponent(botLink)}&text=${encodeURIComponent('Join me on MemeClash TV! 🎮')}`
  }

  const shareAffiliateLink = () => {
    console.log("WebApp available:", !!window.Telegram?.WebApp);
    if (window.Telegram?.WebApp) {
      const tgWebApp = window.Telegram.WebApp;
      console.log("Init data:", tgWebApp.initData);
      const initData = tgWebApp.initData;
      const initDataParsed = Object.fromEntries(new URLSearchParams(initData));
      console.log("Parsed data:", initDataParsed);
      
      try {
        const user = JSON.parse(initDataParsed.user);
        console.log("User:", user);
        const userId = user.id;
        window.open(generateAffiliateLink(userId.toString()), '_blank')
      } catch (e) {
        console.error("Parse error:", e);
        alert('Could not parse Telegram user data!')
      }
    } else {
      alert('Please open this app in Telegram!')
    }
  }

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-md mx-auto p-2 space-y-6">
        {/* Points Overview Card */}
        <div className="p-2 relative overflow-hidden bg-gradient-to-br from-purple-600/5 to-blue-600/5 border-primary/20">
          <div className="p-4">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex items-center justify-center">
                <RotatingCoin />
              </div>
              <h1 className="text-2xl font-bold mb-2">Earn Points by Trading</h1>
              <p className="text-muted-foreground">
                Get 1 point for every time {SHARES_PER_POINT_BOUGHT} shares are traded by you or any of your invites!
              </p>
            </div>

            <div className="mb-6">
              <Card className="p-4 text-center bg-gradient-to-r from-yellow-400/20 to-orange-500/20">
                <div className="text-muted-foreground text-sm mb-1">Your Points</div>
                <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 flex items-center justify-center">
                  {((user?.points?.total ?? 0) - (user?.points?.spent ?? 0))} <SmallRotatingCoin />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {user?.points?.total ?? 0} total earned - {user?.points?.spent ?? 0} spent
                </div>
              </Card>
            </div>

            <div className="px-2 mb-4">
            <Button 
              onClick={shareAffiliateLink}
              className="h-14 w-full rounded-lg relative overflow-visible group text-sm font-bold uppercase tracking-wider animate-aggressive-pulse bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400"
            >
              <div className="sparkle-container absolute inset-0 z-20">
                <div className="sparkle s1">✦</div>
                <div className="sparkle s2">✦</div>
                <div className="sparkle s3">✦</div>
                <div className="sparkle s4">✦</div>
              </div>
              <span className="relative z-10 animate-text-pulse flex flex-row items-center justify-center">
                <Share className="h-5 w-5 mr-2" />
                Share Affiliate Link
              </span>
              <style>{`
                .sparkle-container {
                  position: absolute;
                  width: 100%;
                  height: 100%;
                  pointer-events: none;
                  border-radius: 10px;
                }

                .sparkle {
                  position: absolute;
                  color: #ffffff;
                  font-size: 14px;
                  opacity: 0;
                  text-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
                  z-index: 30;
                }

                .s1 {
                  top: -8px;
                  left: 25%;
                  animation: button-sparkle 2s ease-in-out infinite;
                }

                .s2 {
                  top: 50%;
                  right: -8px;
                  animation: button-sparkle 2s ease-in-out infinite 0.5s;
                }

                .s3 {
                  bottom: -8px;
                  right: 25%;
                  animation: button-sparkle 2s ease-in-out infinite 1s;
                }

                .s4 {
                  top: 50%;
                  left: -8px;
                  animation: button-sparkle 2s ease-in-out infinite 1.5s;
                }

                @keyframes button-sparkle {
                  0%, 100% { 
                    opacity: 0;
                    transform: scale(0.5) rotate(0deg);
                  }
                  50% { 
                    opacity: 1;
                    transform: scale(1.2) rotate(180deg);
                  }
                }

                @media (prefers-reduced-motion) {
                  .sparkle {
                    animation: none !important;
                    opacity: 0;
                  }
                }
              `}</style>
            </Button>
          </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="p-3 text-center bg-primary/5">
                <div className="text-muted-foreground text-xs mb-1">Trading Points</div>
                <div className="text-xl font-bold">{user?.points?.fromBuys ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">From trades</div>
              </Card>
              <Card className="p-3 text-center bg-primary/5">
                <div className="text-muted-foreground text-xs mb-1">Affiliate Points</div>
                <div className="text-xl font-bold">{user?.points?.fromAffiliates ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">From referrals</div>
              </Card>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
} 