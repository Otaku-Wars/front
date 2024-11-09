import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Heart, Gem, Flame, Shield, TrendingUp, TrendingDown, Users, Briefcase } from 'lucide-react'
import { Button } from "../components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip"
import { useCharacters, useBattleState, useUser } from '../hooks/api'
import { useConvertEthToUsd } from '../EthPriceProvider'
import { useNavigate } from 'react-router-dom'
import { useAddress, useBalance } from '../hooks/user'
import { CurrentBattleState, Status, Character } from "@memeclashtv/types"
import { getBuyPrice, getSellPriceMc } from '../utils'
import { formatNumber, formatPercentage } from '../lib/utils'
import { ModalBuySell } from './ModalBuySell'
import { useFundWallet, usePrivy } from '@privy-io/react-auth'
import { currentChain } from '../main'

export const useTimeTill = (time: number) => {
  const [timeTill, setTimeTill] = useState<number | null>(null)

  useEffect(() => {
    const updateTimeTill = () => {
      const now = Date.now() / 1000
      const currentTimeTill = Math.floor(time - now)
      setTimeTill(Math.max(0, currentTimeTill))
    }

    updateTimeTill()
    const interval = setInterval(updateTimeTill, 1000)

    return () => clearInterval(interval)
  }, [time])

  return timeTill
}

const BuyTradeButton = ({ onClick, preNewHoldingsValue, newHoldingsValue, sharesOwned, isPendingMatch, willStartIn, isBattling, character }: { onClick: () => void; preNewHoldingsValue: number; newHoldingsValue: number; sharesOwned: number; isPendingMatch: boolean; willStartIn: number | null; isBattling: boolean, character: Character }) => {
  const percentChange = preNewHoldingsValue > 0 ? ((newHoldingsValue - preNewHoldingsValue) / preNewHoldingsValue) : 0
  const amountChange = newHoldingsValue - preNewHoldingsValue
  const convertEthToUsd = useConvertEthToUsd()
  const increased = percentChange > 0
  const gainedNothing = newHoldingsValue == preNewHoldingsValue
  if (isBattling) {
    return (
      <Button disabled className="w-full bg-gray-700 text-yellow-400 text-xs sm:text-sm md:text-base">
        Trading locked 🔒
      </Button>
    )
  }

  if (isPendingMatch && willStartIn !== null) {
    return (
      
      <Button 
        onClick={onClick}
        className="breathing w-full bg-yellow-600 text-black text-lg font-bold hover:bg-yellow-700 transition-all duration-300 text-xs sm:text-sm md:text-base relative overflow-hidden group"
      >
        <span 
        style={{
          textShadow: `
            2px 2px 0 #FFFFFF, 
            2px 2px 0 #FFFFFF, 
            2px 2px 0 #FFFFFF, 
            2px 2px 0 #FFFFFF
          `,
        }}  
        className="relative z-10 text-shadow-md text-shadow-white"
        >
          BUY NOW
        </span>
        <span className="absolute top-0 right-0 bg-gray-700 bg-opacity-50 text-md px-1 py-0.5 rounded-bl font-bold">
          {willStartIn.toString().padStart(2, '0')}s left to buy
        </span>
        <span className="absolute inset-0 bg-yellow-400 opacity-30 group-hover:opacity-50 transition-opacity duration-300 animate-pulse-glow"></span>
        <span className="absolute inset-0 animate-pulsate"></span>
      </Button>
    )
  }

  return (
    <Button
      
     className={`w-full bg-gray-700 text-lg ${gainedNothing ? 'text-gray-400' : (increased ? 'text-green-400 animate-pulse-win' : 'text-red-400 animate-pulse-lose')}`}>
      <span className={`${gainedNothing ? 'animate-pulse text-gray-400' : (increased ? 'text-green-400 animate-pulse-win ' : 'text-red-400 animate-pulse-lose')} font-bold`}>
        You {gainedNothing ? 'gained NOTHING' : (increased ? 'earned' : 'lost')} {formatNumber(convertEthToUsd(amountChange))}{increased ? '↑' : '↓'} ({formatPercentage(percentChange)})
      </span>
    </Button>
  )
}

const CharacterStats = ({ character }: { character: Character }) => (
  <div className="flex justify-between items-center mt-1">
    <div className="flex items-center">
      <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 mr-0.5" />
      <span className="text-xs sm:text-sm text-green-400">{character.health}</span>
    </div>
    <div className="flex items-center">
      <Gem className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 mr-0.5" />
      <span className="text-xs sm:text-sm text-blue-400">{character.power}</span>
    </div>
    <div className="flex items-center">
      <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400 mr-0.5" />
      <span className="text-xs sm:text-sm text-orange-400">{character.attack}</span>
    </div>
    <div className="flex items-center">
      <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-300 mr-0.5" />
      <span className="text-xs sm:text-sm text-blue-300">{character.defense}</span>
    </div>
  </div>
)

const PriceInfo = ({ currentPrice, winPrice, losePrice, value, supply, isRightSide, isWinner, isLoser, percentChangeWin, percentChangeLose }: { currentPrice: number, winPrice: number, losePrice: number, value: number, supply: number, isRightSide: boolean, isWinner: boolean, isLoser: boolean, percentChangeWin: number, percentChangeLose: number  }) => {
  const priceInfoClasses = isRightSide ? "flex-row" : "flex-row-reverse"
  const textAlignClass = isRightSide ? "text-left" : "text-right"
  const greyOutClass = "text-gray-500"
  const convertEthToUsd = useConvertEthToUsd()

  return (
    <TooltipProvider
      delayDuration={0}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-start cursor-help w-full ${priceInfoClasses}`}>
            <div className={`flex flex-col items-start ${isRightSide ? 'mr-1 sm:mr-2' : 'ml-1 sm:ml-2'} ${textAlignClass} ${isWinner || isLoser ? greyOutClass : ''}`}>
              <span className="text-xs text-gray-400">Price</span>
              <span className="text-sm sm:text-base md:text-lg font-bold">{formatNumber(currentPrice)}</span>
            </div>
            <div className={`flex flex-col items-start ${isRightSide ? 'mr-1 sm:mr-2' : 'ml-1 sm:ml-2'} ${textAlignClass} ${isLoser ? greyOutClass : ''}`}>
              <span className="text-xs text-gray-400">If Win</span>
              <span className={`text-sm text-nowrap sm:text-base md:text-lg font-extrabold ${isLoser ? 'text-gray-500' : 'text-green-400 animate-pulse-win'}`}>
                {isRightSide ? (
                  <>
                    <span className="animate-arrow-up inline-block mr-1">↑</span>{formatNumber(winPrice)} ({formatPercentage(percentChangeWin)})
                  </>
                ) : (
                  <>
                    {formatNumber(winPrice)}<span className="animate-arrow-up inline-block ml-1">↑</span> ({formatPercentage(percentChangeWin)})
                  </>
                )}
              </span>
            </div>
            <div className={`flex flex-col items-start ${textAlignClass} ${isWinner ? greyOutClass : ''}`}>
              <span className="text-xs text-gray-400">If Lose</span>
              <span className={`text-sm text-nowrap sm:text-base md:text-lg font-extrabold ${isWinner ? 'text-gray-500' : 'text-red-400 animate-pulse-lose'}`}>
                {isRightSide ? (
                  <>
                    <span className="animate-arrow-down inline-block mr-1">↓</span>${losePrice.toLocaleString()} ({formatPercentage(percentChangeLose)})
                  </>
                ) : (
                  <>
                    {formatNumber(losePrice)}<span className="animate-arrow-down inline-block ml-1">↓</span> ({formatPercentage(percentChangeLose)})
                  </>
                )}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <div>Current: ${currentPrice.toLocaleString()}</div>
            <div className="text-green-400">If Win: ${winPrice.toLocaleString()}</div>
            <div className="text-red-400">If Lose: ${losePrice.toLocaleString()}</div>
            <div>Market Cap: {formatNumber(convertEthToUsd(value))}</div>
            <div>Supply: {supply.toLocaleString()} shares</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const MarketInfo = ({ value, supply, isRightSide }: { value: number, supply: number, isRightSide: boolean }) => {
  const convertEthToUsd = useConvertEthToUsd()
  return (
  <TooltipProvider
    delayDuration={0}
  >
    <Tooltip>
      <TooltipTrigger asChild>
        {/* <div className={`flex flex-col ${isRightSide ? 'items-end' : 'items-start'} cursor-help`}>
          <span className="text-xs text-gray-400">MCap</span>
          <div className="flex items-center">
            {!isRightSide && <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 mr-0.5" />}
            <span className="text-xs sm:text-sm">{formatNumber(convertEthToUsd(value))}</span>
            {isRightSide && <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 ml-0.5" />}
          </div>
        </div> */}
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm">
          <div>Market Cap: ${value.toLocaleString()}</div>
          <div>Supply: {supply.toLocaleString()} shares</div>
        </div>
      </TooltipContent>
    </Tooltip>
    </TooltipProvider>
  )
}

const HoldingsInfo = ({ isGameOver, isWinner, isLoser, sharesOwned, holdingsValue, winHoldingsValue, loseHoldingsValue, winPercentChange, losePercentChange }: { isGameOver: boolean, isWinner: boolean, isLoser: boolean, sharesOwned: number, holdingsValue: number, winHoldingsValue: number, loseHoldingsValue: number, winPercentChange: number, losePercentChange: number }) => {
  const convertEthToUsd = useConvertEthToUsd()
  const gain = winHoldingsValue - holdingsValue
  const loss = loseHoldingsValue - holdingsValue
  console.log("sharesOwned", sharesOwned, "holdingsValue", holdingsValue, "winHoldingsValue", winHoldingsValue, "loseHoldingsValue", loseHoldingsValue, "gain", gain, "loss", loss)
  return (
    <TooltipProvider
      delayDuration={0}
    >
      <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center cursor-help">
          <Users className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400 mr-0.5" />
          <span className="text-xs sm:text-sm">
            You own {sharesOwned} shares ({formatNumber(convertEthToUsd(holdingsValue))})
          </span>
          {!isGameOver && (
            <>
            <span className="text-xs sm:text-sm text-green-400">
              (+{formatNumber(convertEthToUsd(gain))})
            </span>
            <span className="text-xs sm:text-sm text-red-400">
              ({formatNumber(convertEthToUsd(loss))})
            </span>
          </>
          )}
          {isGameOver && (
            <>
            {isWinner && (
            <span className="text-xs sm:text-sm text-green-400">
              (+{formatNumber(convertEthToUsd(gain))})
            </span>
            )}
            {isLoser && (
            <span className="text-xs sm:text-sm text-red-400">
              ({formatNumber(convertEthToUsd(loss))})
            </span>
            )}
            </>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-lg">
          <div className='text-yellow-400 font-bold'>Current Share Worth: {formatNumber(convertEthToUsd(holdingsValue))}</div>
          <div className="text-green-400">If Win: Your shares would be worth <span className='font-bold underline'>{formatNumber(convertEthToUsd(winHoldingsValue))} (+{formatNumber(convertEthToUsd(gain))}) </span></div>
          <div className="text-red-400">If Lose: Your shares would be worth <span className='font-bold underline'>{formatNumber(convertEthToUsd(loseHoldingsValue))} ({formatNumber(convertEthToUsd(loss))})</span></div>
        </div>
      </TooltipContent>
    </Tooltip>
    </TooltipProvider>
  )
}

export const WorldStateView = () => {
  const address = useAddress()
  const { data: user } = useUser(address)
  const { authenticated, login } = usePrivy()
  const { fundWallet } = useFundWallet()
  const convertEthToUsd = useConvertEthToUsd()
  const { balanceNumber } = useBalance(address);
  const shouldFund = useMemo(() => {
    return balanceNumber <= 0;
    }, [balanceNumber])
  const { data: characters, isLoading: charactersLoading, isError: charactersError } = useCharacters()
  const { data: battleState, isLoading, isError } = useBattleState()
  const [showModal, setShowModal] = useState(false);
  const [characterId, setCharacterId] = useState(0)
  const [characterName, setCharacterName] = useState('')
  const [modalAction, setModalAction] = useState<'Buy' | 'Sell'>('Buy')
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

  const navigator = useNavigate()

  const [character1, character2] = useMemo(() => {
    return [
      characters?.find((c) => c.id === battleState?.p1),
      characters?.find((c) => c.id === battleState?.p2)
    ]
  }, [characters, battleState])

  const character1SharesOwnedByYou = useMemo(() => {
    return user?.balances?.find((b) => b.character == character1?.id)?.balance ?? 0
  }, [user, character1])
  console.log("character1SharesOwnedByYou", character1SharesOwnedByYou)

  const character2SharesOwnedByYou = useMemo(() => {
    return user?.balances?.find((b) => b.character == character2?.id)?.balance ?? 0
  }, [user, character2])

  const character1Price = useMemo(() => {
    return character1 ? character1.price : 0
  }, [character1])

  const character2Price = useMemo(() => {
    return character2 ? character2.price : 0
  }, [character2])

  const character1MarketCap = useMemo(() => {
    return character1 ? character1.value : 0
  }, [character1])

  const character2MarketCap = useMemo(() => {
    return character2 ? character2.value : 0
  }, [character2])

  const character1WinMarketCap = useMemo(() => {
    const reward = (character2MarketCap * 0.1)
    return (character1MarketCap + reward)
  }, [character1MarketCap, character2MarketCap])

  const character2WinMarketCap = useMemo(() => {
    const reward = (character1MarketCap * 0.1)
    return (character2MarketCap + reward)
  }, [character1MarketCap, character2MarketCap])

  const character1LossMarketCap = useMemo(() => {
    const reward = (character1MarketCap * 0.1)
    return (character1MarketCap - reward)
  }, [character1MarketCap, character2MarketCap])

  const character2LossMarketCap = useMemo(() => {
    const reward = (character2MarketCap * 0.1)
    return (character2MarketCap - reward)
  }, [character1MarketCap, character2MarketCap])

  const [character1WinPrice, setCharacter1WinPrice] = useState(0)
  const [character2WinPrice, setCharacter2WinPrice] = useState(0)
  const [character1LossPrice, setCharacter1LossPrice] = useState(0)
  const [character2LossPrice, setCharacter2LossPrice] = useState(0)

  const [yourShares1WinValue, setYourShares1WinValue] = useState(0)
  const [yourShares2WinValue, setYourShares2WinValue] = useState(0)
  const [yourShares1LossValue, setYourShares1LossValue] = useState(0)
  const [yourShares2LossValue, setYourShares2LossValue] = useState(0)
  const [holdingsValue1, setHoldingsValue1] = useState(0)
  const [holdingsValue2, setHoldingsValue2] = useState(0)

  useEffect(() => {
    const fetchPrices = async () => {
      const price1Win = await getBuyPrice(character1?.supply ?? 0, parseFloat(character1WinMarketCap as any))
      const price2Win = await getBuyPrice(character2?.supply ?? 0, parseFloat(character2WinMarketCap as any))
      setCharacter1WinPrice(price1Win)
      setCharacter2WinPrice(price2Win)

      const price1Loss = await getBuyPrice(character1?.supply ?? 0, parseFloat(character1LossMarketCap as any))
      const price2Loss = await getBuyPrice(character2?.supply ?? 0, parseFloat(character2LossMarketCap as any))
      setCharacter1LossPrice(price1Loss)
      setCharacter2LossPrice(price2Loss)
    }

    fetchPrices()
  }, [character1WinMarketCap, character2WinMarketCap, character1LossMarketCap, character2LossMarketCap])

  
  useEffect(() => {
    const fetchValues = async () => {
      const valueNow = await getSellPriceMc(character1?.supply ?? 0, character1?.value, character1SharesOwnedByYou)
      const valueNow2 = await getSellPriceMc(character2?.supply ?? 0, character2?.value, character2SharesOwnedByYou)
      console.log("valueNow", valueNow, "character1SharesOwnedByYou", character1SharesOwnedByYou, "character1?.supply", character1?.supply, "character1?.value", character1?.value)
      const value1Win = await getSellPriceMc(character1?.supply ?? 0, character1WinMarketCap, character1SharesOwnedByYou)
      const value2Win = await getSellPriceMc(character2?.supply ?? 0, character2WinMarketCap, character2SharesOwnedByYou)
      const value1Loss = await getSellPriceMc(character1?.supply ?? 0, character1LossMarketCap, character1SharesOwnedByYou)
      const value2Loss = await getSellPriceMc(character2?.supply ?? 0, character2LossMarketCap, character2SharesOwnedByYou)
      setYourShares1WinValue(value1Win)
      setYourShares2WinValue(value2Win)
      setYourShares1LossValue(value1Loss)
      setYourShares2LossValue(value2Loss)
      setHoldingsValue1(valueNow)
      setHoldingsValue2(valueNow2)
    }
    fetchValues()
  }, [character1WinMarketCap, character2WinMarketCap, character1LossMarketCap, character2LossMarketCap, character1SharesOwnedByYou, character2SharesOwnedByYou])


  const winner = battleState?.lastMatchResult?.winner ?? null
  const willStartIn = useTimeTill(battleState?.willStartAt ?? 0)
  const isBattling = battleState?.status == Status.Battling || (willStartIn == 0 && battleState?.status == Status.Pending)
  const isPendingMatch = battleState?.status == Status.Pending

  const isStartup = battleState?.p1 == 0 && battleState?.p2 == 0;


  console.log("battleState winner", winner)

  const renderCharacterInfo = (character: Character | undefined, sharesOwned: number, isRightSide: boolean) => {
    if (!character) return null

    const currentPrice = convertEthToUsd(character.price)
    const winPrice = !isRightSide ? convertEthToUsd(character1WinPrice) : convertEthToUsd(character2WinPrice)
    const losePrice = !isRightSide ? convertEthToUsd(character1LossPrice) : convertEthToUsd(character2LossPrice)
    const winHoldingsValue = !isRightSide ? yourShares1WinValue : yourShares2WinValue
    const loseHoldingsValue = !isRightSide ? yourShares1LossValue : yourShares2LossValue
    const winPercentChange = currentPrice > 0 ? ((winPrice - currentPrice) / currentPrice) : 0
    const losePercentChange = currentPrice > 0 ? ((losePrice - currentPrice) / currentPrice) : 0
    const isWinner = winner !== null && winner == character.id
    const isLoser = winner !== null && winner !== character.id
    const newHoldingsValue = isWinner ? winHoldingsValue : loseHoldingsValue
    console.log("characterAA", character.id, "isWinner", isWinner, "isLoser", isLoser)
    const holdingsValue = !isRightSide ? holdingsValue1 : holdingsValue2;
    const isGameOver = winner !== null && true;
    const winRate = character.matchCount > 0 && character.winCount > 0 ? character.winCount / character.matchCount : 0;

    return (
      <div className={`flex flex-col ${isRightSide ? 'items-start' : 'items-end'} w-full max-w-[45%]`}>
        
        <div className={`flex items-center ${isRightSide ? 'flex-row-reverse' : 'flex-row'} mb-1 sm:mb-2 cursor-pointer`}
          onClick={() => {
            navigator(`/character/${character.id}`)
          }}
        >
          <div className={``}>
            {isPendingMatch && <span className="ml-2 text-gray-400 animate-pulse-glow">WAITING...</span>}
            {isWinner && <span className="ml-2 text-green-400 animate-pulse-win-glow">WON (price now ${winPrice.toLocaleString()})</span>}
            {isLoser && <span className="ml-2 text-red-400 animate-pulse-lose-glow">LOST (price now ${losePrice.toLocaleString()})</span>}
          </div>
          <div className={`flex flex-col ${isRightSide ? 'items-start ml-1 sm:ml-2' : 'items-end mr-1 sm:mr-2'}`}>
            <h2 className="text-sm sm:text-base md:text-lg font-bold mb-0.5 sm:mb-1">
              {isRightSide && <span className="mr-2 text-2xl">{character.name}</span>}
              {isRightSide && <TooltipProvider
                delayDuration={0}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs sm:text-sm text-gray-400">{formatPercentage(winRate)}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">Win Rate: {formatPercentage(winRate)}</div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>}
              {!isRightSide && <TooltipProvider
                delayDuration={0}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs sm:text-sm text-gray-400">{formatPercentage(winRate)}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">Win Rate: {formatPercentage(winRate)}</div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>}
              {!isRightSide && <span className="ml-2 text-2xl">{character.name}</span>}

            </h2>
            
            <CharacterStats character={character} />
          </div>
          <img src={character.pfp} alt={character.name} className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-2 border-yellow-500 ${isRightSide ? 'ml-1 sm:ml-2' : 'mr-1 sm:mr-2'}`} />
        </div>
        <div className="w-full">
          <div className={`flex justify-between items-center mb-1 sm:mb-2 ${isRightSide ? 'flex-row' : 'flex-row-reverse'}`}>
            <PriceInfo 
              currentPrice={currentPrice} 
              winPrice={winPrice}
              losePrice={losePrice} 
              value={character.value} 
              supply={character.supply}
              isRightSide={isRightSide}
              isWinner={isWinner}
              isLoser={isLoser}
              percentChangeWin={winPercentChange}
              percentChangeLose={losePercentChange}
            />
            <MarketInfo value={character.value} supply={character.supply} isRightSide={isRightSide} />
          </div>
          <div className="flex justify-between items-center mb-1 sm:mb-2">
            <HoldingsInfo 
              isGameOver={isGameOver}
              isWinner={isWinner}
              isLoser={isLoser}
              sharesOwned={sharesOwned}
              holdingsValue={holdingsValue}
              winHoldingsValue={winHoldingsValue}
              loseHoldingsValue={loseHoldingsValue}
              winPercentChange={winPercentChange}
              losePercentChange={losePercentChange}
            />
          </div>
          <BuyTradeButton
            
            preNewHoldingsValue={holdingsValue}
            newHoldingsValue={newHoldingsValue}
            character={character}
            sharesOwned={sharesOwned}
            isPendingMatch={isPendingMatch}
            willStartIn={willStartIn}
            isBattling={isBattling}
            onClick={() => {
              handleShowModal('Buy', character.id, character.name)
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <>
    {isStartup && <div className="text-center text-white bg-gray-900 p-4">
      <h1 className="text-4xl font-bold">Battle's a starting soon...</h1>
      <p className="text-lg">Buy shares now to be ready!</p>
    </div>}
      {!isStartup &&
        <div className="bg-gray-900 text-white">
        <style>{`
          @keyframes pulse-win {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(74, 222, 128, 0.5)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 10px rgba(74, 222, 128, 0.7)); }
        }
        @keyframes pulse-lose {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(248, 113, 113, 0.5)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 10px rgba(248, 113, 113, 0.7)); }
        }
        @keyframes arrow-up {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes arrow-down {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; scale: 1; }
          50% { opacity: 0.6; scale: 1.5; }
        }
        @keyframes pulsate {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-pulse-win {
          animation: pulse-win 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-pulse-lose {
          animation: pulse-lose 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-arrow-up {
          animation: arrow-up 1s ease-in-out infinite;
          display: inline-block;
        }
        .animate-arrow-down {
          animation: arrow-down 1s ease-in-out infinite;
          display: inline-block;
        }
        .animate-pulse-glow {
          animation: pulse-glow 1s ease-in-out infinite;
        }
        .animate-pulsate {
          animation: pulsate 1s ease-in-out infinite;
        }
        .animate-pulse-win-glow {
          animation: pulse-win 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, pulse-glow 1s ease-in-out infinite;
        }
        .animate-pulse-lose-glow {
          animation: pulse-lose 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, pulse-glow 1s ease-in-out infinite;
        }
      `}</style>
      <div className="max-w-7xl mx-auto bg-gray-900 border p-2 sm:p-4 md:p-6 shadow-lg">
        <div className="flex flex-row justify-between items-center">
          {renderCharacterInfo(character1, character1SharesOwnedByYou, false)}
          <div className="flex flex-col items-center justify-center ">
            <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2 text-yellow-400 relative">
              <span className="relative z-10">VS</span>
              <div className="absolute inset-0 bg-yellow-500 transform -skew-x-12 z-0 opacity-20"></div>
            </div>
            {battleState?.status === Status.Pending && willStartIn !== null && (
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-yellow-400 tabular-nums">
                  {willStartIn.toString().padStart(2, '0')}s
                </div>
                <div className="text-xs sm:text-sm md:text-base text-gray-400">until battle</div>
              </div>
            )}
            {battleState?.status === Status.Battling && (
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-yellow-400">Match #{battleState?.currentMatch}</div>
                <div className="text-xs sm:text-sm md:text-base text-gray-400">battle in progress</div>
              </div>
            )}
          </div>
          {renderCharacterInfo(character2, character2SharesOwnedByYou, true)}
        </div>
      </div>
      <ModalBuySell 
        isInBattle={false}
        characterId={characterId}
        show={showModal}
        handleClose={handleCloseModal}
        handleOpen={handleShowModal as any}
        actionType={modalAction as any}
        characterName={characterName}
        />
      </div>
      }
    </>
  )
}