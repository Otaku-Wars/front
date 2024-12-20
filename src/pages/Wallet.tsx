import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { ArrowUp, ArrowDown, Copy, DollarSign, Check, ArrowUpIcon, ArrowDownIcon } from 'lucide-react'
import { Separator } from "../components/ui/separator"
import { Input } from "../components/ui/input"
import { AIAvatar } from "../components/ai-avatar"
import { cn, formatPercentage } from "../lib/utils"
import { useAddress, useBalance, useWithdraw } from '../hooks/user'
import { useFundWallet, useLogout } from '@privy-io/react-auth'
import { currentChain } from '../main'
import { useConvertEthToUsd } from '../EthPriceProvider'
import { formatEther, formatNumber } from '../lib/utils'
import { useGetSellPricesWithoutFee } from '../hooks/contract'
import { useCharacters, useUser, calculatePnL } from '../hooks/api'
import { formatEther as viemFormatEther } from 'viem'
import { ModalWithdraw } from "../components/ModalWithdraw"
import { useNavigate } from 'react-router-dom'

export function Wallet() {
  const navigate = useNavigate()
  const [isCopied, setIsCopied] = useState(false)
  const address = useAddress()
  const { balance: userBalance } = useBalance(address as `0x${string}`)
  const { data: user } = useUser(address)
  const { data: characters } = useCharacters()
  const { fundWallet } = useFundWallet()
  const { withdraw } = useWithdraw()
  const convertEthToUsd = useConvertEthToUsd()
  const { logout } = useLogout()
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  // Get holdings data
  const characterIds = user?.balances?.map(balance => balance.character) || []
  const balanceAmounts = user?.balances?.map(balance => balance.balance) || []
  const { data: sellPrices } = useGetSellPricesWithoutFee(
    characterIds.map((characterId, index) => ({
      characterId,
      amount: balanceAmounts[index]
    }))
  )

  // Calculate net worth
  const netWorth = useMemo(() => {
    return sellPrices?.reduce((acc, price) => {
      const value = viemFormatEther(price?.result ?? 0 as any)
      return acc + Number(value)
    }, 0) ?? 0
  }, [sellPrices])

  // Calculate total PnL
  const totalSpent = user?.pnl?.costBasis ?? 0
  const { totalPnl, totalPercentageChange } = useMemo(() => {
    let totalPnl = 0
    let totalPercentageChange = 0
    if (netWorth && totalSpent) {
      const { absoluteChange, percentageChange } = calculatePnL(totalSpent, netWorth)
      totalPnl = absoluteChange
      totalPercentageChange = percentageChange
    }
    return { totalPnl, totalPercentageChange }
  }, [netWorth, totalSpent])

  const copyToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address).then(() => {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      })
    }
  }

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-md mx-auto p-4 pt-16 space-y-6">
        <Card className="p-2 relative overflow-hidden bg-gradient-to-br from-purple-600/5 to-blue-600/5 border-primary/20">
          <CardContent className="p-4">
            <div className="text-center mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Portfolio Value</h3>
              <p className="text-4xl font-bold text-primary">
                {formatNumber(convertEthToUsd(netWorth) ?? 0)}
              </p>
              <div className={cn(
                "text-sm mt-2 flex items-center justify-center gap-1 font-bold",
                totalPnl >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {totalPnl >= 0 ? (
                  <ArrowUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4" />
                )}
                <span>
                  {formatNumber(convertEthToUsd(Math.abs(totalPnl)))} ({formatPercentage(totalPercentageChange)})
                </span>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex flex-col gap-1 items-center">
              <div className="flex-1 min-w-[200px] text-center">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Wallet Balance</h3>
                <p className="text-2xl font-bold">{formatNumber(convertEthToUsd(parseFloat(userBalance ?? "0")) ?? 0)}</p>
                <p className="text-sm text-muted-foreground">{formatEther(parseFloat(userBalance ?? "0"))}</p>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Wallet Address</h3>
                <div className="flex items-center space-x-2">
                  <Input 
                    value={address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''} 
                    readOnly 
                    className="flex-1 text-sm bg-white/50"
                  />
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={copyToClipboard}
                    className="bg-white/50 hover:bg-white/70"
                  >
                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Button
            size="lg"
            className="h-24 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black relative overflow-hidden group text-sm font-bold uppercase tracking-wider animate-aggressive-pulse"
            onClick={() => fundWallet(address, { chain: currentChain })}
          >
            <span className="relative z-10 text-shadow-glow animate-text-pulse text-outline flex flex-col items-center">
              <DollarSign className="h-6 w-6 mb-2" />
              Deposit
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 opacity-75 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></span>
          </Button>
          <Button
            size="lg"
            onClick={() => setShowWithdrawModal(true)}
            className="h-24 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 relative overflow-hidden group text-sm font-bold uppercase tracking-wider"
          >
            <span className="relative z-10 flex flex-col items-center">
              <ArrowUp className="h-6 w-6 mb-2" />
              Withdraw
            </span>
          </Button>
        </div>

        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Holdings</CardTitle>
            <div className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
              {user?.balances?.length ?? 0} Characters
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {user?.balances?.map((balance, index) => {
              const character = characters?.find(c => c.id === balance.character)
              const trueValue = sellPrices ? sellPrices[index]?.result : 0
              const value = viemFormatEther(trueValue as any ?? 0)
              const valueSpent = balance?.pnl?.costBasis ?? 0
              const changeValue = Number(value) - valueSpent
              const changePercentage = ((Number(value) - valueSpent) / valueSpent) 

              return (
                <div key={balance.character}
                  className="cursor-pointer"
                  onClick={() => {
                    navigate(`/character/${balance.character}`)
                  }}
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <AIAvatar
                        src={character?.pfp}
                        alt={character?.name}
                        size="sm"
                        className="h-10 w-10"
                      />
                      <div>
                        <div className="font-medium">{character?.name}</div>
                        <div className="text-sm text-muted-foreground">{balance.balance} Shares owned</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatNumber(convertEthToUsd(Number(value)))}</div>
                      <div className={cn(
                        "text-sm mt-1 flex items-center justify-end gap-1 font-bold",
                        changeValue > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {changeValue > 0 ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )}
                        {formatNumber(convertEthToUsd(Math.abs(changeValue)))}
                      </div>                        
                      <div className={cn(
                        "text-sm mt-1 flex items-center justify-end gap-1",
                        changePercentage > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {/* {changePercentage > 0 ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )} */}
                        ({formatPercentage(Math.abs(changePercentage))})
                      </div>
                    </div>
                  </div>
                  {index < user.balances.length - 1 && <Separator />}
                </div>
              )
            })}
          </CardContent>
        </Card>

        <ModalWithdraw 
          show={showWithdrawModal} 
          handleClose={() => setShowWithdrawModal(false)} 
        />
      </div>
    </div>
  )
} 