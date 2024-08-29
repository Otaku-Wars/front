import { useEffect, useMemo, useState } from 'react'
import { CurrentBattleState, Status, Character } from "@memeclashtv/types"
import { Badge } from "./ui/badge"
import { Card, CardContent } from "./ui/card"
import { Heart, Gem, Flame, Shield, Zap } from 'lucide-react'
import { useCharacters, useBattleState } from '../hooks/api'
import { getBuyPrice } from '../utils'
import { useConvertEthToUsd } from '../EthPriceProvider'

interface WorldStateViewProps {
  battleState: CurrentBattleState
  characters: Character[]
}

export const useTimeTill = (time: number) => {
  const [timeTill, setTimeTill] = useState(Math.max(0, Math.floor((time - Date.now()) / 1000)));
  console.log("timeTill", timeTill)
  console.log("time", time)
  useEffect(() => {
      const interval = setInterval(() => {
          setTimeTill((prevTimeTill) => {
              const now = Date.now() / 1000;
              console.log("now", now)
              const currentTimeTill = Math.floor(time - now);
              return currentTimeTill > 0 ? currentTimeTill : 0;
          });
      }, 1000);

      return () => clearInterval(interval);
  }, [time]);

  return timeTill;
}

export const WorldStateView = () => {
  const convertEthToUsd = useConvertEthToUsd()
  const { data: characters, isLoading: charactersLoading, isError: charactersError } = useCharacters();
    const { data: battleState, isLoading, isError } = useBattleState();

    const character1 = useMemo(() => {
        if(isLoading) return null
        if(isError) return null
        const p1Id = battleState?.p1;
        return characters?.find((c: any) => c.id === p1Id);
    }, [characters, battleState, isLoading, isError])

    const character2 = useMemo(() => {
        if(isLoading) return null
        if(isError) return null
        const p2Id = battleState?.p2;
        return characters?.find((c: any) => c.id === p2Id);
    }, [characters, battleState, isLoading, isError])

    const character1Price = useMemo(()=> {
        return character1 ? character1.price : 0;
    }, [character1])

    const character2Price = useMemo(()=> {
        return character2 ? character2.price : 0;
    }, [character2])

    const character1MarketCap = useMemo(() => {
        return character1 ? character1.value : 0;
    }, [character1])

    const character2MarketCap = useMemo(() => {
        return character2 ? character2.value : 0;
    }, [character2])

    const character1WinMarketCap = useMemo(() => {
        const reward = (character2MarketCap * 0.1);
        return convertEthToUsd(character1MarketCap + reward);
    }, [character1MarketCap, character2MarketCap])

    const character2WinMarketCap = useMemo(() => {
        const reward = (character1MarketCap * 0.1);
        return convertEthToUsd(character2MarketCap + reward);
    }, [character1MarketCap, character2MarketCap])

    const character1LossMarketCap = useMemo(() => {
        const reward = (character1MarketCap * 0.1);
        return convertEthToUsd(character1MarketCap - reward);
    }, [character1MarketCap, character2MarketCap])

    const character2LossMarketCap = useMemo(() => {
        const reward = (character2MarketCap * 0.1);
        return convertEthToUsd(character2MarketCap - reward);
    }, [character1MarketCap, character2MarketCap])

    const character1WinPrice = useMemo(() => {
      console.log("win market cap1", character1WinMarketCap)
        const price = getBuyPrice(character1?.supply ?? 0, parseFloat(character1WinMarketCap as any))
        return convertEthToUsd(price);
    }, [character1WinMarketCap])

    const character2WinPrice = useMemo(() => {
        const price = getBuyPrice(character2?.supply ?? 0, parseFloat(character2WinMarketCap as any))
        return convertEthToUsd(price);
    }, [character2WinMarketCap])

    const character1LossPrice = useMemo(() => {
        const price = getBuyPrice(character1?.supply ?? 0, parseFloat(character1LossMarketCap as any))
        return convertEthToUsd(price);
    }, [character1LossMarketCap])

    const character2LossPrice = useMemo(() => {
        const price = getBuyPrice(character2?.supply ?? 0, parseFloat(character2LossMarketCap as any))
        return convertEthToUsd(price);
    }, [character2LossMarketCap])



    const isPendingMAtch = useMemo(() => {
        return battleState?.status == 1;
    }, [battleState])

    const winner = useMemo(() => {
        return battleState?.lastMatchResult;
    }, [battleState])

    

    console.log("data will start at", battleState?.willStartAt)
    const willStartIn = useTimeTill(battleState?.willStartAt ?? 0);
  const getStatusBadge = (status: Status) => {
    switch (status) {
      case Status.Idle:
        return <Badge variant="secondary">Idle</Badge>
      case Status.Pending:
        return <Badge>Pending</Badge>
      case Status.Battling:
        return <Badge variant="destructive">Battling</Badge>
    }
  }


  const renderCharacterInfo = (character: Character | undefined, isRightCard: boolean) => {
    if (!character) return null

    const attributesJsx = (
      <div className="flex items-center space-x-1 text-sm">
        <span className="text-green-400">{character.health}<Heart className="inline w-4 h-4" /></span>
        <span className="text-blue-400">{character.power}<Gem className="inline w-4 h-4" /></span>
        <span className="text-orange-400">{character.attack}<Flame className="inline w-4 h-4" /></span>
        <span className="text-yellow-400">{character.defense}<Shield className="inline w-4 h-4" /></span>
        <span className="text-purple-400">{character.speed}<Zap className="inline w-4 h-4" /></span>
      </div>
    )

    const nameAndPfpJsx = (
      <div className="flex items-center space-x-2">
        <img
          src={character.pfp}
          alt={character.name}
          className="w-8 h-8 rounded-full object-cover"
        />
        <span className="font-bold text-lg">{character.name}</span>
      </div>
    )

    return (
      <Card className="flex-1 bg-gray-900 text-white border-gray-700">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            {isRightCard ? nameAndPfpJsx : attributesJsx}
            {isRightCard ? attributesJsx : nameAndPfpJsx}
          </div>
          <div className="grid grid-cols-2 gap-1 text-sm">
            <div>Current Price:</div>
            <div className="text-right">${character.price.toFixed(8)}</div>
            <div>Mktcap:</div>
            <div className="text-right">${(character.value).toFixed(8)}</div>

            {winner ? <>
              <div className="text-right">
              {winner.winner === character.id 
                ? `${character.name} won! Price now: ${!isRightCard ? character1WinPrice : character2WinPrice}` 
                : `${character.name} lost! Price now: ${!isRightCard ? character1LossPrice : character2LossPrice}`}
            </div>
            </> : <>
              <div className="text-green-400">Win price:</div>
              <div className="text-right text-green-400">${!isRightCard ? character1WinPrice : character2WinPrice } (80%) </div>
              <div className="text-red-400">Lose price:</div>
              <div className="text-right text-red-400">${!isRightCard ? character1LossPrice : character2LossPrice} (-10%) </div>
            </>
            }
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full bg-gray-950 p-4 rounded-lg">
      <div className="flex items-stretch space-x-1">
        {renderCharacterInfo(character1, false)}
        <div className="flex flex-col items-center justify-center px-4">
          <div className="text-4xl font-bold text-white mb-2">VS</div>
          {battleState?.status === Status.Pending && (
            <div className="text-sm text-gray-400">
              Will start {willStartIn}
            </div>
          )}
          {battleState?.status == Status.Battling && (
            <div className="text-sm text-gray-400">
              Match #{battleState.currentMatch}
            </div>
          )}
        </div>
        {renderCharacterInfo(character2, true)}
      </div>
    </div>
  )
}