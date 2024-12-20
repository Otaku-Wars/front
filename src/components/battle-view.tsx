import { Card } from "./ui/card"
import { Shield, Flame, Radio, ArrowDown, ArrowUp, ChevronUpIcon, Clock, LockIcon } from 'lucide-react'
import { Button } from "./ui/button"
import { cn, formatPercentage } from "../lib/utils"
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
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
    <div className={cn("flex items-center gap-2 relative", isReversed && "flex-row-reverse text-right")}>
      <div className="relative">
        <div className={cn(
          "rounded-full p-0.5",
          isWinner && "bg-green-500/50 animate-pulse",
          isLoser && "bg-red-500/50 animate-pulse"
        )}>
          <AIAvatar
            src={image}
            alt={name}
            size="sm"
            className="w-10 h-10"
          />
        </div>
        {matchOver && (
          <div className={cn(
            "absolute left-1/2 -translate-x-1/2 text-xs font-bold animate-bounce z-100",
            isWinner && "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]",
            isLoser && "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
          )}
          >
            {isWinner ? "WON" : "LOST"}
          </div>
        )}
        {isBattling && (
          <div className="absolute left-1/2 -translate-x-1/2 font-bold animate-bounce z-100 text-gray-500 text-[8px]">
            BATTLING
          </div>
        )}
      </div>
      <div>
        <div className="font-bold text-xs leading-tight">{name}</div>
        <div className="text-[10px] text-muted-foreground">{winChance.toFixed(2)}%</div>
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
  newHoldingsValue: number
}

function CharacterStats({ address, character, shares, timeLeft, battleState, winPrice, losePrice, preHoldingsValue, newHoldingsValue }: CharacterStatsProps) {
  const convertEthToUsd = useConvertEthToUsd()
  const currentPrice = character.price
  const { authenticated, login } = usePrivy()
  const { fundWallet } = useFundWallet()
  
  // Get power-ups from character data
  const attackPowerUp = character.temporaryAttackBoost
  const defensePowerUp = character.temporaryDefenseBoost

  const isBattling = battleState?.status === Status.Battling || (timeLeft <= 0 && battleState?.status === Status.Pending)
  const isPendingMatch = battleState?.status === Status.Pending
  

  const isWinner = battleState?.lastMatchResult?.winner === character.id

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
      <div className="bg-background/50 rounded-lg mb-1">
        <PriceInfo 
          currentPrice={currentPrice} 
          losePrice={losePrice} 
          winPrice={winPrice} 
          isBattling={isBattling} 
          isWinner={isWinner}
          battleState={battleState}
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
      <ModalBuySell 
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
}

function PriceInfo({ currentPrice, losePrice, winPrice, isBattling, isWinner, battleState }: PriceInfoProps) {
  const convertEthToUsd = useConvertEthToUsd()
  const losePercentage = ((losePrice - currentPrice) / currentPrice) * 100
  const winPercentage = ((winPrice - currentPrice) / currentPrice) * 100

  const battleEnded = battleState?.lastMatchResult !== undefined

  return (
    <div className="flex flex-col text-[10px] bg-white rounded-lg p-2 border">
      <div className="flex justify-between items-center mb-1">
        <span className="text-muted-foreground">Current price</span>
        <span className="font-bold text-xs">{formatNumber(convertEthToUsd(currentPrice))}</span>
      </div>
      <div className="flex justify-between space-x-1">
        <PriceOutcome 
          label="If Win" 
          price={winPrice} 
          percentage={winPercentage} 
          icon={ArrowUp} 
          disabled={battleEnded && !isWinner}
        />
        <PriceOutcome 
          label="If Lose" 
          price={losePrice} 
          percentage={losePercentage} 
          icon={ArrowDown} 
          disabled={battleEnded && isWinner}
        />
      </div>
    </div>
  )
}

interface PriceOutcomeProps {
  label: string
  price: number
  percentage: number
  icon: typeof ArrowDown | typeof ArrowUp
  disabled?: boolean
}

function PriceOutcome({ label, price, percentage, icon: Icon, disabled }: PriceOutcomeProps) {
  const convertEthToUsd = useConvertEthToUsd()
  const isPositive = percentage > 0
  const color = isPositive ? "text-green-500/90" : "text-red-500/90"
  const glowColor = isPositive ? "drop-shadow-[0_0_2px_rgba(34,197,94,0.3)]" : "drop-shadow-[0_0_2px_rgba(239,68,68,0.3)]"
  const plusOrMinus = isPositive ? "+" : ""
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
  }, [price, percentage])

  return (
    <div className={cn(
      "flex flex-col items-start flex-1 min-w-0",
      disabled && "opacity-30"
    )}>
      <span className="text-[8px] text-muted-foreground">{label}</span>
      <div className={cn(
        "flex items-center text-[9px] font-semibold w-full overflow-hidden",
        color,
        glowColor,
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
            {formatNumber(convertEthToUsd(price))} ({plusOrMinus}{Math.abs(percentage).toFixed(2)}%)
          </span>
          {isOverflowing && (
            <span className="inline-block ml-4">
              {formatNumber(convertEthToUsd(price))} ({plusOrMinus}{Math.abs(percentage).toFixed(2)}%)
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

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
        "w-full bg-gray-700 text-lg",
        gainedNothing 
          ? 'text-gray-400' 
          : (increased ? 'text-green-400 animate-pulse-win' : 'text-red-400 animate-pulse-lose')
      )}
    >
      <span className={cn(
        gainedNothing 
          ? 'animate-pulse text-gray-400' 
          : (increased ? 'text-green-400 animate-pulse-win' : 'text-red-400 animate-pulse-lose'),
        'font-bold text-[10px]'
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
    <div className="text-center">
      <div className="font-extrabold text-base bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">VS</div>
      <div className="text-[8px] text-muted-foreground">
        {timeLeft > 0 ? "Starts in" : `Match #${battleState?.currentMatch}`}
      </div>
      <div className="text-sm font-bold flex items-center justify-center text-orange-500 animate-aggressive-pulse">
        {timeLeft > 0 ? (
          <>
            <Clock className="w-3 h-3 mr-0.5" />
            <span className="text-shadow-glow">{formatTime(timeLeft)}</span>
          </>
        ) : (
          <span className={cn(
            "text-shadow-glow text-[8px]",
            matchOver ? "text-green-500" : "text-orange-500"
          )}>
            {matchOver ? "COMPLETE" : "BATTLING"}
          </span>
        )}
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
    return user?.balances?.find((b) => b.character === character1?.id)?.balance ?? 0
  }, [user, character1])

  const character2Shares = useMemo(() => {
    return user?.balances?.find((b) => b.character === character2?.id)?.balance ?? 0
  }, [user, character2])

  useEffect(() => {
    const calculatePrices = async () => {
      if (!character1 || !character2) return

      // Character 1 wins (gets 10% of character2's market cap)
      const c1WinPrice = await getSellPriceMc(
        character1.supply,
        character1.value + (character2.value * 0.1),
        1
      )
      // Character 1 loses (loses 10% of market cap)
      const c1LosePrice = await getSellPriceMc(
        character1.supply,
        character1.value * 0.9,
        1
      )
      // Character 2 wins (gets 10% of character1's market cap)
      const c2WinPrice = await getSellPriceMc(
        character2.supply,
        character2.value + (character1.value * 0.1),
        1
      )
      // Character 2 loses (loses 10% of market cap)
      const c2LosePrice = await getSellPriceMc(
        character2.supply,
        character2.value * 0.9,
        1
      )

      setCharacter1WinPrice(c1WinPrice)
      setCharacter1LosePrice(c1LosePrice)
      setCharacter2WinPrice(c2WinPrice)
      setCharacter2LosePrice(c2LosePrice)
    }

    calculatePrices()
  }, [character1, character2])

  // Calculate holdings values
  const [character1Holdings, setCharacter1Holdings] = useState({ pre: 0, new: 0 })
  const [character2Holdings, setCharacter2Holdings] = useState({ pre: 0, new: 0 })

  useEffect(() => {
    const calculateHoldings = async () => {
      if (!character1 || !character2) return

      const c1Pre = await getSellPriceMc(
        character1.supply - character1Shares,
        character1.value,
        character1Shares
      )
      const c1New = await getSellPriceMc(
        character1.supply,
        character1.value,
        character1Shares
      )
      const c2Pre = await getSellPriceMc(
        character2.supply - character2Shares,
        character2.value,
        character2Shares
      )
      const c2New = await getSellPriceMc(
        character2.supply,
        character2.value,
        character2Shares
      )

      setCharacter1Holdings({ pre: c1Pre, new: c1New })
      setCharacter2Holdings({ pre: c2Pre, new: c2New })
    }

    calculateHoldings()
  }, [character1, character2, character1Shares, character2Shares])

  

  if (!character1 || !character2) return null

  return (
    <div className="space-y-2">
      <Card className="overflow-hidden">
        <div className="relative" style={{ paddingBottom: '75%' }}>
          <iframe 
            src={import.meta.env.VITE_EMBED_ID ?? 'https://lvpr.tv?v=6950nisrggh4cvk1&muted=false&lowLatency=force&autoplay=true'}
            className="absolute top-0 left-0 w-full h-full"
            allow="autoplay; fullscreen"
          />
          <div className="absolute top-2 left-2 flex items-center space-x-2 bg-black/50 rounded-full px-2 py-1 z-10">
            <Radio className="w-3 h-3 text-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-white">LIVE</span>
          </div>
        </div>
      </Card>

      <Card className="p-2 relative overflow-hidden bg-gradient-to-br from-purple-600/5 to-blue-600/5">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-2">
            <div className="w-[35%]">
              <CharacterInfo 
                name={character1.name} 
                winChance={51.12} 
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
                winChance={48.88} 
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
              winPrice={character1WinPrice}
              losePrice={character1LosePrice}
              preHoldingsValue={character1Holdings.pre}
              newHoldingsValue={character1Holdings.new}
            />
            <CharacterStats 
              address={address}
              character={character2}
              shares={character2Shares}
              timeLeft={timeLeft}
              battleState={battleState}
              winPrice={character2WinPrice}
              losePrice={character2LosePrice}
              preHoldingsValue={character2Holdings.pre}
              newHoldingsValue={character2Holdings.new}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}

