import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Share, Users, TrendingUp, UserPlus, Zap, Shield, Copy } from 'lucide-react'
import { useAddress } from '../hooks/user'
import { useUser } from '../hooks/api'
import { useConvertEthToUsd } from '../EthPriceProvider'
import { formatNumber } from '../lib/utils'
import { SHARES_PER_POINT_BOUGHT, SHARES_PER_POINT_HELD, AFFILIATE_SHARES_PER_POINT } from '@memeclashtv/types'

export function Rewards() {
  const address = useAddress()
  const { data: user } = useUser(address)
  const convertEthToUsd = useConvertEthToUsd()

  const generateAffiliateLink = (address: string) => {
    return `${window.location.host}/#/?ref=${address}`
  }

  const copyAffiliateLink = () => {
    if (address) {
      navigator.clipboard.writeText(generateAffiliateLink(address))
      alert('Affiliate link copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-md mx-auto p-4 pt-16 space-y-6">
        {/* Points Overview Card */}
        <Card className="p-2 relative overflow-hidden bg-gradient-to-br from-purple-600/5 to-blue-600/5 border-primary/20">
          <CardContent className="p-4">
            <div className="text-center mb-6">
              <div className="rounded-full bg-primary/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Share className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Earn Points by Trading</h1>
              <p className="text-muted-foreground">
                Get 1 point for every {SHARES_PER_POINT_BOUGHT} shares traded!
              </p>
            </div>

            <div className="mb-6">
              <Card className="p-4 text-center bg-gradient-to-r from-yellow-400/20 to-orange-500/20">
                <div className="text-muted-foreground text-sm mb-1">Your Points</div>
                <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500">
                  {((user?.points?.total ?? 0) - (user?.points?.spent ?? 0))}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {user?.points?.total ?? 0} total earned - {user?.points?.spent ?? 0} spent
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="p-3 text-center bg-primary/5">
                <div className="text-muted-foreground text-xs mb-1">Trading Points</div>
                <div className="text-xl font-bold">{user?.points?.fromBuys ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">From trades</div>
              </Card>
              <Card className="p-3 text-center bg-primary/5">
                <div className="text-muted-foreground text-xs mb-1">Holding Points</div>
                <div className="text-xl font-bold">{user?.points?.fromHolding ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">From holding</div>
              </Card>
              <Card className="p-3 text-center bg-primary/5">
                <div className="text-muted-foreground text-xs mb-1">Affiliate Points</div>
                <div className="text-xl font-bold">{user?.points?.fromAffiliates ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">From referrals</div>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Affiliate Section */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Rewards Sharing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Earn 50% of trading fees from users who sign up with your referral link
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                <Users className="w-8 h-8 text-green-400 mb-2 mx-auto" />
                <span className="text-xl text-gray-400">Total Referrals</span>
                <span className="block text-2xl font-bold text-white">
                  {user?.referralCount ?? 0}
                </span>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                <Share className="w-8 h-8 text-blue-400 mb-2 mx-auto" />
                <span className="text-xl text-gray-400">Fees Earned</span>
                <span className="block text-2xl font-bold text-white">
                  ${formatNumber(convertEthToUsd(user?.rewards ?? 0))}
                </span>
              </div>
            </div>

            <Button 
              onClick={copyAffiliateLink}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Affiliate Link
            </Button>
          </CardContent>
        </Card>

        {/* Points Usage Info */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Power Up Your Characters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use your points to boost character stats before battles:
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium mb-1">Attack Boost</div>
                  <div className="text-sm text-muted-foreground">
                    Increase your character's attack power
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium mb-1">Defense Boost</div>
                  <div className="text-sm text-muted-foreground">
                    Enhance your character's defensive capabilities
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 