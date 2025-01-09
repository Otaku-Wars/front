import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { ArrowUp, ArrowDown, Copy, DollarSign, Check, ArrowUpIcon, ArrowDownIcon, Wallet2Icon, Sparkles } from 'lucide-react'
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
import { MobileModalWithdraw } from '../components/MobileModalWithdraw'
import { useNavigate } from "react-router-dom"

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

  // Filter out zero balances
  const nonZeroBalances = user?.balances?.filter(balance => balance.balance > 0) || []

  // Update characterIds and balanceAmounts to use filtered balances
  const characterIds = nonZeroBalances.map(balance => balance.character)
  const balanceAmounts = nonZeroBalances.map(balance => balance.balance)

  // Get holdings data
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
    <div className="min-h-screen p-2">
      <div className="max-w-md mx-auto space-y-2">
        <div className="p-2 relative overflow-hidden bg-gradient-to-br from-purple-600/5 to-blue-600/5 border-primary/20">
          <div className="p-4">
            <div className="text-center mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Portfolio Value</h3>
              <p className="text-4xl font-bold text-primary">
                {formatNumber(convertEthToUsd(netWorth) ?? 0)}
              </p>
              <div className={cn(
                "text-md mt-2 flex items-center justify-center gap-1 font-bold",
                totalPnl >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {totalPnl >= 0 ? (
                  <span className="text-md">&#x25B2;</span>
                ) : (
                  <span className="text-md">&#x25BC;</span>
                )}
                <span className="text-md">
                  {formatNumber(convertEthToUsd(Math.abs(totalPnl)))} 
                  <span className={cn(
                    "font-bold px-1.5 py-0.5 rounded-[5px]",
                    totalPercentageChange >= 0 ? "bg-green-400/10" : "bg-red-400/10"
                  )}>
                    ({formatPercentage(totalPercentageChange)})
                  </span>
                </span>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex flex-row gap-2 items-center mb-3 ">
              
              <div className="flex-1 items-center">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Wallet Address</h3>
                <div className="flex items-center space-x-2">
                  <div 
                    className="flex-1 text-xs border-2 rounded-md px-2 py-2"
                  >
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                  </div>
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={copyToClipboard}
                    className="opacity-90 hover:opacity-100 border-2 px-2 py-1"
                  >
                    {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              <Separator orientation="vertical" className="h-full" />
              <div className="flex-1 text-end">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Wallet Balance</h3>
                <p className="text-md font-bold">{formatNumber(convertEthToUsd(parseFloat(userBalance ?? "0")) ?? 0)}</p>
                <p className="text-xs text-muted-foreground">{formatEther(parseFloat(userBalance ?? "0"))}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 px-2">
          <Button
            size="lg"
            className="h-14 rounded-xl relative overflow-visible group text-sm font-bold uppercase tracking-wider animate-aggressive-pulse border"
            onClick={() => {
              fundWallet(address, { chain: currentChain });
            }}
          >
            <div className="absolute inset-0 z-20">
              <div className="sparkle-container">
                <div className="sparkle s1">✦</div>
                <div className="sparkle s2">✦</div>
                <div className="sparkle s3">✦</div>
                <div className="sparkle s4">✦</div>
              </div>
            </div>
            <span className="relative z-10 animate-text-pulse flex flex-row items-center">
              <Wallet2Icon className="h-5 w-5 mr-2" />
              Deposit
            </span>
            <span 
              className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 animate-shimmer rounded-lg" 
              style={{ backgroundSize: '200% 100%' }}
            />
            <style>{`
              .sparkle-container {
                position: absolute;
                width: 100%;
                height: 100%;
                pointer-events: none;
                border-radius: 12px;
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
          <Button
            size="lg"
            onClick={() => setShowWithdrawModal(true)}
            className="h-14 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 relative overflow-hidden group text-sm font-bold uppercase tracking-wider"
          >
            <span className="relative z-10 flex flex-row items-center">
              <ArrowUp className="h-5 w-5 mr-2" />
              <p>Withdraw</p>
            </span>
          </Button>
        </div>
        </div>

        

        <div className="pt-4">
          <div className="flex flex-row items-center justify-between">
            <h1 className="font-extrabold text-muted-foreground mb-1">Holdings</h1>
            <div className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
              {nonZeroBalances.length ?? 0} Characters
            </div>
          </div>
          {nonZeroBalances.length > 0 ? (
            nonZeroBalances.map((balance, index) => {
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
                  <div className="flex items-center justify-between py-4 px-1">
                    <div className="flex items-center gap-3">
                      <AIAvatar
                        src={character?.pfp}
                        alt={character?.name}
                        size="md"

                        renderBadge={false}
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
                        changeValue > 0 ? "text-green-500" : "text-red-500"
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
                        changePercentage > 0 ? "text-green-500" : "text-red-500",
                        changePercentage > 0 ? "bg-green-500/10" : "bg-red-500/10",
                        "px-2 py-1 rounded-full"
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
                  {index < nonZeroBalances.length - 1 && <Separator />}
                </div>
              )
            })
          ) : (
            <div className="flex items-center justify-center py-4">
              <p className="text-sm text-muted-foreground">No holdings yet</p>
            </div>
          )}
        </div>

        <MobileModalWithdraw
          show={showWithdrawModal}
          handleClose={() => setShowWithdrawModal(false)}
        />
      </div>
    </div>
  )
} 