import { Card } from "./ui/card"
import { Shield, Flame, Radio, ArrowDown, ArrowUp, ChevronUpIcon, Clock, LockIcon } from 'lucide-react'
import { Button } from "./ui/button"
import { cn, formatPercentage } from "../lib/utils"
import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import { AIAvatar } from "./ai-avatar"
import { useBattleState, useCharacters, useUser } from "../hooks/api"
import { useTimeTill } from "./WorldStateView"
import { Status, Character, CurrentBattleState } from '@memeclashtv/types'
import { useAddress, useBalance } from '../hooks/user'
import { useConvertEthToUsd } from '../EthPriceProvider'
import { formatEther, formatNumber } from '../lib/utils'
import { getBuyPrice, getSellPriceMc } from '../utils'
import { ModalBuySell } from "./ModalBuySell"
import { useFundWallet, usePrivy } from "@privy-io/react-auth"
import { currentChain } from "../main"
import { StreamEmbed } from "./StreamView"
import { MobileBuySellModal } from "./MobileBuySellModal"

const PENDING_MATCH_DELAY = 240000;

interface CharacterInfoProps {
  name: string
  winChance: number
  image: string
  isReversed?: boolean
  battleState: CurrentBattleState
  characterId: number
}

function CharacterInfo({ name, winChance, image, isReversed = false, battleState, characterId }: CharacterInfoProps) {
  const matchOver = battleState?.lastMatchResult !== undefined
  const isWinner = matchOver && battleState?.lastMatchResult?.winner === characterId
  const isLoser = matchOver && battleState?.lastMatchResult?.winner !== characterId
  const isBattling = battleState?.status === Status.Battling

  return (
    <div className={cn("flex items-center gap-2 relative p-1", isReversed && "flex-row-reverse text-right p-1")}>
      {matchOver && (
          <div className={cn(
            "absolute left-1/2 translate-x-1/2 text-xs font-bold animate-bounce",
            isWinner && "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]",
            isLoser && "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
          )}
          >
            {isWinner ? "WON" : "LOST"}
        </div>
      )}
      <div>
        <div className={cn("font-bold text-lg leading-tight", isWinner && "text-green-400 animate-glow", isLoser && "text-red-400 animate-glow")}>{name}</div>
        <div className="text-[10px] text-muted-foreground font-bold">{winChance.toFixed(2)}% WIN RATE</div>
      </div>
    </div>
  )
}

interface CharacterStatsProps {
  address: string
  character: Character
  shares: number
  timeLeft: number
  battleState: CurrentBattleState
  winPrice: number
  losePrice: number
  preHoldingsValue: number
  isP1: boolean
  isLoadingPrices: boolean
}

function CharacterStats({ address, character, shares, timeLeft, battleState, winPrice, losePrice, preHoldingsValue, isP1, isLoadingPrices }: CharacterStatsProps) {
  const convertEthToUsd = useConvertEthToUsd()
  const isMatchJustEnded = battleState?.lastMatchResult !== undefined
  const tokenState = battleState?.lastMatchResult?.tokenState;
  const currentPrice = isMatchJustEnded ? tokenState[isP1 ? "prevPrice1" : "prevPrice2"] : character.price
  const { authenticated, login } = usePrivy()
  const { fundWallet } = useFundWallet()
  
  // Get power-ups from character data
  const attackPowerUp = character.temporaryAttackBoost
  const defensePowerUp = character.temporaryDefenseBoost

  const isBattling = battleState?.status === Status.Battling || (timeLeft <= 0 && battleState?.status === Status.Pending)
  const isPendingMatch = battleState?.status === Status.Pending
  

  //calculate new holdings value should be the same as the preHoldingsValue if the match is not over
  //if the match is over, then it should be the percentage change in price times the preHoldingsValue
  
  const isWinner = battleState?.lastMatchResult?.winner === character.id
  console.log("1234: preHoldingsValue", preHoldingsValue)
  const newHoldingsValue = useMemo(() => {
    if (!isMatchJustEnded || preHoldingsValue === 0) return preHoldingsValue;
    
    return isWinner 
      ? preHoldingsValue * (1 + (winPrice - currentPrice) / currentPrice)
      : preHoldingsValue * (1 + (losePrice - currentPrice) / currentPrice);
  }, [isMatchJustEnded, isWinner, preHoldingsValue, winPrice, losePrice, currentPrice]);

  console.log("1234: holdings values:", {
    preHoldingsValue,
    newHoldingsValue,
    isWinner,
    isMatchJustEnded
  });

  const { balanceNumber } = useBalance(address as `0x${string}`);
  const shouldFund = useMemo(() => {
    return balanceNumber <= 0;
    }, [balanceNumber])
  const [characterId, setCharacterId] = useState(0)
  const [characterName, setCharacterName] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalAction, setModalAction] = useState<'Buy' | 'Sell' | null>(null)
  const handleShowModal = useCallback((action: 'Buy' | 'Sell', characterId: number, characterName: string) => {
    if(!authenticated) {
      login();
      return;
    }
    if(shouldFund) {
      fundWallet(address, {chain: currentChain});
      return;
    }
    setCharacterId(characterId)
    setCharacterName(characterName)
    setModalAction(action);
    setShowModal(true);
  }, [authenticated, login, shouldFund, address]);

  const handleCloseModal = () => {
    console.log("mounted Calling handle close")
    setShowModal(false);
  }

  return (
    <div className="space-y-1">
      {/* <div className="flex justify-between gap-1 mb-1">
        <StatButton 
          icon={Shield} 
          value={character.defense} 
          type="defense" 
          characterId={character.id.toString()} 
          powerUp={defensePowerUp} 
          isBattling={isBattling}
        />
        <StatButton 
          icon={Flame} 
          value={character.attack} 
          type="attack" 
          characterId={character.id.toString()} 
          powerUp={attackPowerUp} 
          isBattling={isBattling}
        />
      </div> */}
      <div className="rounded-lg mb-1">
        <PriceInfo 
          currentPrice={currentPrice} 
          losePrice={losePrice} 
          winPrice={winPrice} 
          isBattling={isBattling} 
          isWinner={isWinner}
          battleState={battleState}
          isLoading={isLoadingPrices}
        />
      </div>
      <div className="text-[10px] text-muted-foreground text-center">
        You own: {shares} shares
      </div>
      <BuyNowButton 
        onClick={() => {
          handleShowModal('Buy', character.id, character.name)
        }}
        character={character}
        timeLeft={timeLeft}
        isBattling={isBattling}
        isPendingMatch={isPendingMatch}
        preNewHoldingsValue={preHoldingsValue}
        newHoldingsValue={newHoldingsValue}
        sharesOwned={shares}
      />
      <MobileBuySellModal 
        isInBattle={isBattling}
        characterId={character.id}
        show={showModal}
        handleClose={handleCloseModal}
        handleOpen={handleShowModal as any}
        actionType={modalAction as any}
        characterName={character.name}
      />
    </div>
  )
}

interface StatButtonProps {
  icon: typeof Shield | typeof Flame
  value: number
  type: "attack" | "defense"
  characterId: string
  powerUp: number
  isBattling: boolean
}

function StatButton({ icon: Icon, value, type, characterId, powerUp, isBattling }: StatButtonProps) {
  return (
    <Link
      to={`/power-up/${characterId}/${type}`}
      className={cn(
        "flex items-center justify-between p-1 h-8 w-full bg-white rounded-lg",
        "text-[10px] font-semibold",
        type === "attack" ? "text-orange-500" : "text-blue-500"
      )}
    >
      <div className="flex flex-col items-center">
        <div className="flex items-center">
          <Icon className="h-3 w-3 mr-1" />
          <span>{value}</span>
          {powerUp > 0 && (
            <span className="text-green-500 ml-1">+{powerUp}</span>
          )}
          <span className="text-[8px] ml-1">{type?.charAt(0).toUpperCase() + type?.slice(1)}</span>
        </div>
        <span className="text-[8px] mt-0.5">Power up</span>
      </div>
      {!isBattling && (
        <div className="flex flex-col">
          <ChevronUpIcon className="h-2 w-2" />
          <ChevronUpIcon className="h-2 w-2 -mt-1" />
          <ChevronUpIcon className="h-2 w-2 -mt-1" />
        </div>
      )}
      {isBattling && (
        <div className="flex flex-col">
          <LockIcon className="h-2 w-2" />
        </div>
      )}
    </Link>
  )
}

interface PriceInfoProps {
  currentPrice: number
  losePrice: number
  winPrice: number
  isBattling: boolean
  isWinner?: boolean
  battleState: CurrentBattleState
  isLoading?: boolean
}

const PriceInfo = memo(function PriceInfo({ 
  currentPrice, 
  losePrice, 
  winPrice, 
  isBattling, 
  isWinner, 
  battleState, 
  isLoading 
}: PriceInfoProps) {
  const convertEthToUsd = useConvertEthToUsd()
  
  // Memoize both the calculations and the conversion to USD
  const priceData = useMemo(() => {
    const winPercentage = ((winPrice - currentPrice) / currentPrice) * 100
    const losePercentage = ((losePrice - currentPrice) / currentPrice) * 100
    
    return {
      currentPriceUsd: formatNumber(convertEthToUsd(currentPrice)),
      winPercentage,
      losePercentage,
      winPriceUsd: formatNumber(convertEthToUsd(winPrice)),
      losePriceUsd: formatNumber(convertEthToUsd(losePrice))
    }
  }, [currentPrice, losePrice, winPrice, convertEthToUsd])

  const battleEnded = battleState?.lastMatchResult !== undefined

  return (
    <div className="flex flex-col p-1">
      <div className="flex justify-between items-center mb-1">
        <span className="text-muted-foreground text-sm">Current price</span>
        <span className="font-bold text-md font-bold">{priceData.currentPriceUsd}</span>
      </div>
      <div className="flex flex-col justify-between gap-2">
        {isLoading ? (
          <>
            <div className="h-6 bg-gray-500/20 rounded animate-pulse transition-opacity ease-in-out" />
            <div className="h-6 bg-gray-500/20 rounded animate-pulse transition-opacity ease-in-out" />
          </>
        ) : (
          <>
            <PriceOutcome 
              label="If Win"
              formattedPrice={priceData.winPriceUsd}
              percentage={priceData.winPercentage}
              icon={ArrowUp}
              disabled={battleEnded && !isWinner}
            />
            <PriceOutcome 
              label="If Lose"
              formattedPrice={priceData.losePriceUsd}
              percentage={priceData.losePercentage}
              icon={ArrowDown}
              disabled={battleEnded && isWinner}
            />
          </>
        )}
      </div>
    </div>
  )
})

interface PriceOutcomeProps {
  label: string
  formattedPrice: string // Changed from number to pre-formatted string
  percentage: number
  icon: typeof ArrowDown | typeof ArrowUp
  disabled?: boolean
}

const PriceOutcome = memo(function PriceOutcome({ 
  label, 
  formattedPrice, 
  percentage, 
  icon: Icon, 
  disabled 
}: PriceOutcomeProps) {
  const isPositive = percentage > 0
  const color = isPositive ? "text-green-400" : "text-red-400"
  const glowColor = isPositive ? "drop-shadow-[0_0_2px_rgba(34,197,94,0.3)]" : "drop-shadow-[0_0_2px_rgba(239,68,68,0.3)]"
  const plusOrMinus = isPositive ? "+" : "-"
  const contentRef = useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current) {
        setIsOverflowing(contentRef.current.scrollWidth > contentRef.current.clientWidth)
      }
    }

    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [])

  const formattedPercentage = useMemo(() => 
    Math.abs(percentage).toFixed(2)
  , [percentage])

  return (
    <div className={cn(
      "flex flex-row items-center w-full justify-between",
      disabled && "opacity-30"
    )}>
      <div className={cn(
        "text-[10px] text-muted-foreground inline-block",
        disabled && "opacity-30",
        color
      )}>{isPositive ? '▲' : '▼'}{label}</div>
      <div className={cn(
        "flex items-center text-[12px] font-bold overflow-hidden",
        color,
        glowColor,
        isPositive && "bg-green-500/10",
        !isPositive && "bg-red-500/10",
        "rounded-full px-1 py-0.5",
        "animate-price-pulse"
      )}>
        <div
          ref={contentRef}
          className={cn(
            "whitespace-nowrap",
            isOverflowing && "animate-scroll-x"
          )}
        >
          <span className="inline-block">
            {formattedPrice} ({plusOrMinus}{formattedPercentage}%)
          </span>
          {isOverflowing && (
            <span className="inline-block ml-4">
              {formattedPrice} ({plusOrMinus}{formattedPercentage}%)
            </span>
          )}
        </div>
      </div>
    </div>
  )
})

const formatTime = (seconds: number) => {
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  } else {
    return `${seconds}s`
  }
}

function BuyNowButton({ 
  character,
  timeLeft,
  isBattling,
  isPendingMatch,
  preNewHoldingsValue,
  newHoldingsValue,
  sharesOwned ,
  onClick
}: { 
  character: Character
  timeLeft: number
  isBattling: boolean
  isPendingMatch: boolean
  preNewHoldingsValue: number
  newHoldingsValue: number
  sharesOwned: number
  onClick: () => void
}) {
  const convertEthToUsd = useConvertEthToUsd()
  const percentChange = preNewHoldingsValue > 0 
    ? ((newHoldingsValue - preNewHoldingsValue) / preNewHoldingsValue) 
    : 0
  const amountChange = newHoldingsValue - preNewHoldingsValue
  const increased = percentChange > 0
  const gainedNothing = newHoldingsValue == preNewHoldingsValue

  if (isBattling) {
    return (
      <Button disabled className="w-full bg-gray-700 text-yellow-400 text-xs sm:text-sm md:text-base">
        Trading locked 🔒
      </Button>
    )
  }

  if (isPendingMatch && timeLeft !== null) {
    return (
      <Button 
        onClick={onClick}
        className="w-full h-8 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black relative overflow-hidden group text-xs font-bold uppercase tracking-wider animate-aggressive-pulse"
      >
        <span className="relative z-10 text-shadow-glow animate-text-pulse text-outline">BUY NOW</span>
        <span className="absolute top-0 right-0 bg-yellow-300 px-2 py-1 text-[8px] rounded-bl-md font-bold">
          {formatTime(timeLeft)} <span className="text-[7px] lowercase">left</span>
        </span>
        <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 opacity-75 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></span>
      </Button>
    )
  }

  return (
    <Button
      className={cn(
        "w-full bg-gray-700 text-lg animate-pulse animate-glow",
        gainedNothing 
          ? 'text-gray-400' 
          : (increased ? 'text-green-400 animate-pulse-win' : 'text-red-400 animate-pulse-lose')
      )}
    >
      <span className={cn(
        gainedNothing 
          ? 'animate-pulse text-gray-400' 
          : (increased ? 'text-green-400 animate-pulse-win' : 'text-red-400 animate-pulse-lose'),
        'font-bold text-[10px] animate-glow animate-pulse'
      )}>
        {gainedNothing ? 'Gained NOTHING' : (increased ? 'Earned' : 'Lost')} {formatNumber(convertEthToUsd(amountChange))}{increased ? '↑' : '↓'} ({formatPercentage(percentChange)})
      </span>
    </Button>
  )
}

function BattleTimer({ timeLeft }: { timeLeft: number }) {
  const { data: battleState } = useBattleState()
  const matchOver = battleState?.lastMatchResult !== undefined

  return (
    <div className="text-center flex flex-col items-center justify-end p-0 relative z-10">
      <div className="relative">
        {/* Diagonal line behind VS */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[2px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent animate-pulse"
          style={{ 
            transform: 'translate(-50%, -50%) rotate(-65deg)',
          }}
        />
        
        {/* VS text */}
        {timeLeft > 0 ?
          <div className="font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 text-[32px] p-3 m-0 italic relative animate-glow">
            <Clock className="w-3 h-3 mr-0.5" />
            {formatTime(timeLeft)}
          </div>
        :
          <div className="font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 text-[32px] p-3 m-0 italic relative animate-glow">
            VS
          </div>
        }
      </div>
    </div>
  )
}

export function BattleView() {
  const { data: battleState } = useBattleState()
  const { data: characters } = useCharacters()
  const address = useAddress()
  const { data: user } = useUser(address)
  const timeLeft = useTimeTill(battleState?.willStartAt ?? 0)

  // Get current battle characters
  const [character1, character2] = useMemo(() => {
    return [
      characters?.find((c) => c.id === battleState?.p1),
      characters?.find((c) => c.id === battleState?.p2)
    ]
  }, [characters, battleState])

  // Calculate win/loss prices based on market cap transfers
  const [character1WinPrice, setCharacter1WinPrice] = useState(0)
  const [character1LosePrice, setCharacter1LosePrice] = useState(0)
  const [character2WinPrice, setCharacter2WinPrice] = useState(0)
  const [character2LosePrice, setCharacter2LosePrice] = useState(0)

  // Get user's shares for each character
  const character1Shares = useMemo(() => {
    const balance = user?.balances?.find((b) => b.character == character1?.id)?.balance ?? 0
    console.log("1234: user balances", user?.balances)
    console.log("1234: character1 id", character1?.id)
    console.log("1234: found balance", balance)
    return balance
  }, [user, character1])

  const character2Shares = useMemo(() => {
    return user?.balances?.find((b) => b.character == character2?.id)?.balance ?? 0
  }, [user, character2])

  // Match just ended
  const isMatchJustEnded = useMemo(() => {
    return battleState?.lastMatchResult !== undefined;
  }, [battleState]);

  const character1Value = useMemo(() => {
    if(isMatchJustEnded) {
      return battleState?.lastMatchResult?.tokenState?.prevMarketCap1 ?? 0
    }
    return character1?.value ?? 0
  }, [character1, isMatchJustEnded, battleState])

  const character2Value = useMemo(() => {
    if(isMatchJustEnded) {
      return battleState?.lastMatchResult?.tokenState?.prevMarketCap2 ?? 0
    }
    return character2?.value ?? 0
  }, [character2, isMatchJustEnded, battleState])

  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
  
  // Calculate holdings values
  const [character1HoldingsValue, setCharacter1HoldingsValue] = useState(0)
  const [character2HoldingsValue, setCharacter2HoldingsValue] = useState(0)

  useEffect(() => {
    const calculatePrices = async () => {
      if (!character1 || !character2) return
      const isMatchPending = battleState?.willStartAt > 0;
      const now = new Date().getTime()/1000
      const timeLeft = battleState?.willStartAt - now
      const tenSecondsPastSincePending = timeLeft >= PENDING_MATCH_DELAY-10
      if(isMatchPending && tenSecondsPastSincePending) {
        setIsLoadingPrices(true)
      }
      try {
        const c1Value = character1Value
        const c2Value = character2Value

        console.log("c1Value", c1Value)
        console.log("c2Value", c2Value)

        // Character 1 wins (gets 10% of character2's market cap)
        const c1WinPrice = await getSellPriceMc(
          character1.supply,
          c1Value + (c2Value * 0.1),
          1
        )

        console.log("c1WinPrice", c1WinPrice)
        
        // Character 1 loses (loses 10% of market cap)
        const c1LosePrice = await getSellPriceMc(
          character1.supply,
          c1Value * 0.9,
          1
        )

        console.log("c1LosePrice", c1LosePrice)

        // Character 2 wins (gets 10% of character1's market cap)
        const c2WinPrice = await getSellPriceMc(
          character2.supply,
          c2Value + (c1Value * 0.1),
          1
        )

        console.log("c2WinPrice", c2WinPrice)

        // Character 2 loses (loses 10% of market cap)
        const c2LosePrice = await getSellPriceMc(
          character2.supply,
          c2Value * 0.9,
          1
        )

        console.log("c2LosePrice", c2LosePrice)

        setCharacter1WinPrice(c1WinPrice)
        setCharacter1LosePrice(c1LosePrice)
        setCharacter2WinPrice(c2WinPrice)
        setCharacter2LosePrice(c2LosePrice)
      } finally {
        setIsLoadingPrices(false)
      }
    }

    calculatePrices()
  }, [character1, character2, character1Value, character2Value, battleState])


  useEffect(() => {
    const calculateHoldings = async () => {
      // Only calculate if we have all required data
      if (!character1?.supply || !character2?.supply || !character1Value || !character2Value || !user?.balances?.length) {
        console.log("1234: Missing required data for holdings calc:", {
          character1Supply: character1?.supply,
          character2Supply: character2?.supply,
          character1Value,
          character2Value,
          userBalances: user?.balances
        });
        return;
      }

      const c1Shares = user.balances.find((b) => b.character === character1.id)?.balance ?? 0;
      const c2Shares = user.balances.find((b) => b.character === character2.id)?.balance ?? 0;

      console.log("1234: Calculating holdings with:", {
        c1Shares,
        c2Shares,
        character1Supply: character1.supply,
        character2Supply: character2.supply,
        character1Value,
        character2Value
      });

      try {
        const [c1Value, c2Value] = await Promise.all([
          getSellPriceMc(character1.supply, character1Value, c1Shares),
          getSellPriceMc(character2.supply, character2Value, c2Shares)
        ]);

        console.log("1234: Setting holdings values:", { c1Value, c2Value });
        setCharacter1HoldingsValue(c1Value);
        setCharacter2HoldingsValue(c2Value);
      } catch (error) {
        console.error("Error calculating holdings:", error);
      }
    };

    calculateHoldings();
  }, [character1?.supply, character2?.supply, character1Value, character2Value, user?.balances]);

  // Memoize all price calculations
  const priceCalculations = useMemo(() => {
    if (!character1 || !character2) return null;

    return {
      character1: {
        winPrice: character1WinPrice,
        losePrice: character1LosePrice,
        currentPrice: character1?.price ?? 0,
      },
      character2: {
        winPrice: character2WinPrice,
        losePrice: character2LosePrice,
        currentPrice: character2?.price ?? 0,
      }
    }
  }, [
    character1?.price,
    character2?.price,
    character1WinPrice,
    character1LosePrice,
    character2WinPrice,
    character2LosePrice
  ]);

  if (!character1 || !character2) return null

  return (
    <div className="space-y-2">
      <div className="z-1">
        <div className="relative" style={{}}>
          <StreamEmbed />
          <div className="absolute top-2 left-2 flex items-center space-x-2 bg-black/50 rounded-full px-2 py-1 z-10">
            <Radio className="w-3 h-3 text-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-white">LIVE</span>
          </div>
        </div>
      </div>

      <div className="relative bg-gradient-to-br from-purple-600/5 to-blue-600/5 rounded-lg">
        <div className="absolute inset-0 flex">
          <div className="w-1/2 relative h-[43%]">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-40"
              style={{ 
                backgroundImage: `url(${character1?.pfp})`,
                maskImage: 'linear-gradient(to right, black 50%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to right, black 50%, transparent 100%)'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
          </div>
          <div className="w-1/2 relative h-[43%]">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-40"
              style={{ 
                backgroundImage: `url(${character2?.pfp})`,
                maskImage: 'linear-gradient(to left, black 50%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to left, black 50%, transparent 100%)'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-l from-black/50 to-transparent" />
          </div>
        </div>

        <div className="relative z-10 p-1">
          <div className="flex justify-between items-center mb-4">
            <div className="w-[35%]">
              <CharacterInfo 
                name={character1.name} 
                winChance={(character1.winCount / character1.matchCount) * 100}
                image={character1.pfp}
                battleState={battleState}
                characterId={character1.id}
              />
            </div>
            <div className="w-[30%] flex justify-center">
              <BattleTimer timeLeft={timeLeft} />
            </div>
            <div className="w-[35%]">
              <CharacterInfo 
                name={character2.name} 
                winChance={(character2.winCount / character2.matchCount) * 100}
                image={character2.pfp} 
                isReversed 
                battleState={battleState}
                characterId={character2.id}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <CharacterStats 
              address={address}
              character={character1}
              shares={character1Shares}
              timeLeft={timeLeft}
              battleState={battleState}
              winPrice={priceCalculations?.character1.winPrice ?? 0}
              losePrice={priceCalculations?.character1.losePrice ?? 0}
              preHoldingsValue={character1HoldingsValue}
              isP1={true}
              isLoadingPrices={isLoadingPrices}
            />
            <CharacterStats 
              address={address}
              character={character2}
              shares={character2Shares}
              timeLeft={timeLeft}
              battleState={battleState}
              winPrice={priceCalculations?.character2.winPrice ?? 0}
              losePrice={priceCalculations?.character2.losePrice ?? 0}
              preHoldingsValue={character2HoldingsValue}
              isP1={false}
              isLoadingPrices={isLoadingPrices}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

