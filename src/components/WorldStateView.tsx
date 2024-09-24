import { useEffect, useMemo, useState } from 'react'
import { CurrentBattleState, Status, Character } from "@memeclashtv/types"
import { Badge } from "./ui/badge"
import { Card, CardContent } from "./ui/card"
import { Heart, Gem, Flame, Shield, Zap } from 'lucide-react'
import { useCharacters, useBattleState, useUser } from '../hooks/api'
import { getBuyPrice } from '../utils'
import { useConvertEthToUsd } from '../EthPriceProvider'
import { formatEther, formatNumber } from '../lib/utils'
import { useNavigate } from 'react-router-dom'
import { useAddress } from '../hooks/user'

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

const InfoCard = ({ title, value, valueClass }: { title: string, value: React.ReactNode, valueClass?: string }) => (
  <div className={`bg-[#1F1F23] p-2 rounded-lg text-center ${valueClass}`}>
    <div className="text-gray-400 text-sm">{title}</div>
    <div className={`font-bold text-sm ${valueClass}`}>{value}</div>
  </div>
);

export const WorldStateView = () => {
  const address = useAddress()
      const {data:user} = useUser(address); // Fetch user data using the useUser hook
  const convertEthToUsd = useConvertEthToUsd()
  const { data: characters, isLoading: charactersLoading, isError: charactersError } = useCharacters();
    const { data: battleState, isLoading, isError } = useBattleState();
  const navigator = useNavigate()

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

    const character1SharesOwnedByYou = useMemo(()=> {
        return user?.balances?.find((b: any) => b.character == character1?.id)?.balance ?? 0;
    }, [user, character1])

    const character2SharesOwnedByYou = useMemo(()=> {
        return user?.balances?.find((b: any) => b.character == character2?.id)?.balance ?? 0;
    }, [user, character2])

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
        return (character1MarketCap + reward);
    }, [character1MarketCap, character2MarketCap])

    const character2WinMarketCap = useMemo(() => {
        const reward = (character1MarketCap * 0.1);
        return (character2MarketCap + reward);
    }, [character1MarketCap, character2MarketCap])

    const character1LossMarketCap = useMemo(() => {
        const reward = (character1MarketCap * 0.1);
        return (character1MarketCap - reward);
    }, [character1MarketCap, character2MarketCap])

    const character2LossMarketCap = useMemo(() => {
        const reward = (character2MarketCap * 0.1);
        return (character2MarketCap - reward);
    }, [character1MarketCap, character2MarketCap])

    const [character1WinPrice, setCharacter1WinPrice] = useState(0);
    const [character2WinPrice, setCharacter2WinPrice] = useState(0);
    const [character1LossPrice, setCharacter1LossPrice] = useState(0);
    const [character2LossPrice, setCharacter2LossPrice] = useState(0);

    useEffect(() => {
        const fetchPrices = async () => {
            const price1Win = await getBuyPrice(character1?.supply ?? 0, parseFloat(character1WinMarketCap as any));
            const price2Win = await getBuyPrice(character2?.supply ?? 0, parseFloat(character2WinMarketCap as any));
            setCharacter1WinPrice(price1Win);
            setCharacter2WinPrice(price2Win);

            const price1Loss = await getBuyPrice(character1?.supply ?? 0, parseFloat(character1LossMarketCap as any));
            const price2Loss = await getBuyPrice(character2?.supply ?? 0, parseFloat(character2LossMarketCap as any));
            setCharacter1LossPrice(price1Loss);
            setCharacter2LossPrice(price2Loss);
        };

        fetchPrices();
    }, [character1WinMarketCap, character2WinMarketCap, character1LossMarketCap, character2LossMarketCap]);
    



    const isPendingMAtch = useMemo(() => {
        return battleState?.status == Status.Pending;
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

  const isBattling = battleState?.status == Status.Battling;


  const renderCharacterInfo = (character: Character | undefined, isRightCard: boolean) => {
    if (!character) return null

    const attributesJsx = (
      <div className="flex justify-between px-2 text-md">
        <span className="">{character.health ?? 0}<Heart className="text-green-400 ml-1 inline w-4 h-4" /></span>
        <span className="">{character.power ?? 0}<Gem className="text-blue-400 ml-1 inline w-4 h-4" /></span>
        <span className="">{character.attack ?? 0}<Flame className="text-orange-400 ml-1 inline w-4 h-4" /></span>
        <span className="">{character.defense ?? 0}<Shield className="text-yellow-400 ml-1 inline w-4 h-4" /></span>
        <span className="">{character.speed ?? 0}<Zap className="text-purple-400 ml-1 inline w-4 h-4" /></span>
      </div>
    )

    const nameAndPfpJsxLeft = (
      <div className="flex flex-row justify-between items-center space-x-5 w-full gap-5 cursor-pointer"
      onClick={()=> {navigator(`/character/${character.id}`)}}

      >
      
        <div className="text-sm text-gray-400 flex flex-col">
          {character1SharesOwnedByYou ?? 0} shares owned
          {character1SharesOwnedByYou <= 0 && isPendingMAtch && <span className='text-yellow-400 font-bold breathing-effect-fast'> {willStartIn}s to Buy</span>}
          {isBattling && <span className='text-yellow-400 font-bold'>Trading locked </span>}

        </div>
        <div className='flex flex-row items-center space-x-4'>
        <span className="font-bold text-lg" style={{display: 'inline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{character.name} </span>
        <img
          src={character.pfp}
          alt={character.name}
          className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
        />
        </div>
      </div>
    )

    const nameAndPfpJsxRight = (
      <div className="flex justify-between items-center space-x-5 w-full gap-5 cursor-pointer"
      onClick={()=> {navigator(`/character/${character.id}`)}}
      > 
      <div className='flex flex-row items-center space-x-4'>
      <img
          src={character.pfp}
          alt={character.name}
          className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
        />
        <span className="font-bold text-lg" style={{display: 'inline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{character.name} </span>
        </div>
        
        <div className="text-sm text-gray-400 flex flex-col items-end text-right">
          <span>{character2SharesOwnedByYou ?? 0} shares owned</span>
          {character2SharesOwnedByYou <= 0 && isPendingMAtch && <span className='text-yellow-400 font-bold breathing-effect-fast'> {willStartIn}s to Buy</span>}
          {isBattling && <span className='text-yellow-400 font-bold'>Trading locked </span>}

        </div>
      </div>
    )

    return (
      <Card className="flex-1 bg-[#151519] text-white p-4 rounded-lg h-full gap-5">
        <CardContent className="p-4">
          <div className={`flex items-center mb-4 w-full`}>
            {isRightCard ? nameAndPfpJsxRight : nameAndPfpJsxLeft}
          </div>
          <div className="grid grid-cols-2 gap-5 text-sm">
            <InfoCard title="Current price:" value={`${formatNumber(convertEthToUsd(character.price))}`} valueClass="col-span-1" />
            <InfoCard title="Mktcap:" value={`${formatNumber(convertEthToUsd(character.value))}`} valueClass="col-span-1" />
            {winner ? (
              <InfoCard title="Result" value={
              <div className={`text-center ${winner.winner == character.id ? "text-green-400 breathing-green" : "text-red-400 breathing-red"}`}>
                {winner.winner == character.id 
                  ? `${character.name} won! Price now: ${!isRightCard ? formatNumber(convertEthToUsd(character1WinPrice)) : formatNumber(convertEthToUsd(character2WinPrice))}` 
                  : `${character.name} lost! Price now: ${!isRightCard ? formatNumber(convertEthToUsd(character1LossPrice)) : formatNumber(convertEthToUsd(character2LossPrice))}`}
              </div>
              } valueClass="col-span-2" />
            ) : (
              <>
                <InfoCard title="If Win:" 
                  value={
                    <div>
                      <p className='breathing-green'>
                        {formatNumber(convertEthToUsd(!isRightCard ? character1WinPrice : character2WinPrice))} 
                        <span className='text-sm breathing-green'>
                          ({(((isRightCard ? character2WinPrice : character1WinPrice) - character.price) / character.price * 100).toFixed(2)}%)
                        </span>
                      </p>
                      {/* <p>
                        {formatEther(!isRightCard ? character1WinPrice : character2WinPrice)} ETH
                      </p> */}
                    </div>
                  } 
                  valueClass="text-green-400" 
                />
                <InfoCard title="If Lose:" 
                  value={
                    <div>
                      <p className='breathing-red'>
                        {formatNumber(convertEthToUsd(!isRightCard ? character1LossPrice : character2LossPrice))} 
                        <span className='text-sm breathing-red'>
                          ({(((isRightCard ? character2LossPrice : character1LossPrice) - character.price) / character.price * 100).toFixed(2)}%)
                        </span>
                      </p>
                      {/* <p>
                        {formatEther(!isRightCard ? character1LossPrice : character2LossPrice)} ETH
                      </p> */}
                    </div>
                  } 
                  valueClass="text-red-400" 
                />
              </>
            )}
            <div className="col-span-2">
            {attributesJsx}
          </div>
          </div>
          
        </CardContent>
        
      </Card>
    )
  }

  return (
    <div className="w-full py-4 bg-[#1F1F23] border-none">
      <div className="flex items-stretch space-x-1">
        {renderCharacterInfo(character1, false)}
        <div className="flex flex-col items-center justify-center px-4">
          <div className="text-4xl font-bold text-white mb-2 font-shadow-lg">VS</div>
          {battleState?.status === Status.Pending && (
            <div className="text-sm text-gray-400 text-center">
              Start in <br/> <span className='text-xl'>{willStartIn}</span>
            </div>
          )}
          {battleState?.status == Status.Battling && (
            <div className="text-sm text-gray-400 text-center">
              Match <br/><span className='text-xl'>#{battleState.currentMatch}</span>
              
            </div>
          )}
        </div>
        {renderCharacterInfo(character2, true)}
      </div>
    </div>
  )
}