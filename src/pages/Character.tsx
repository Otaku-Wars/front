import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar"
import { Badge } from "../components/ui/badge"
import { 
  Trophy, Target, ThumbsUp, ThumbsDown, Bot,
  TrendingUp, DollarSign, Users, ArrowLeft, Share2,
  ArrowUp, ArrowDown, Clock
} from 'lucide-react'
import { AIAvatar } from "../components/ai-avatar"
import { MatchList } from "../components/MatchList"
import { HolderList } from "../components/HolderList"
import { TradeList } from "../components/TradeList"
import { StakeList } from "../components/StakeList"
import { ModalBuySell } from "../components/ModalBuySell"
import { useCharacter, useCharacters, useCharacterTrades, useCharacterMatches, useBattleState, useCharacterHolders, useCharacterPerformance, useUsers } from '../hooks/api'
import { useConvertEthToUsd } from '../EthPriceProvider'
import { formatEther, formatNumber, formatPercentage } from '../lib/utils'
import { useTimeTill } from '../components/WorldStateView'
import { MobileChart } from '../components/MobileChart'
import { Attribute, Status, User } from '@memeclashtv/types'
import { Activity, MatchEndActivity, TradeActivity } from '@memeclashtv/types/activity'
import { useAddress, useBalance } from '../hooks/user'
import { useFundWallet, usePrivy } from "@privy-io/react-auth"
import { currentChain } from "../main"
import { zeroAddress } from 'viem'
import { buildDataUrl } from '../components/ActivityBar'
import { truncateWallet } from '../components/NavBar'

const statIcons = {
  Health: <Trophy className="w-5 h-5 text-yellow-400" />,
  Power: <Target className="w-5 h-5 text-blue-400" />,
  Attack: <ThumbsUp className="w-5 h-5 text-green-400" />,
  Defense: <ThumbsDown className="w-5 h-5 text-red-400" />
}

const getTier = (value: number) => {
  // Implementation of tier calculation
  return 1 // Placeholder
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

const timeSince = (date: number) => {
  const now = Math.floor(Date.now() / 1000);
  const seconds = now - date;
  
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return 'just now';
  }
};

export function Character() {
  const { id: characterId } = useParams()
  const { data: character } = useCharacter(parseInt(characterId))
  const { data: characters } = useCharacters()
  const convertEthToUsd = useConvertEthToUsd()
  const [isFlipped, setIsFlipped] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalAction, setModalAction] = useState<'Buy' | 'Sell'>('Buy')
  const [showStakeModal, setShowStakeModal] = useState(false)
  const [showUnstakeModal, setShowUnstakeModal] = useState(false)
  const [selectedAttribute, setSelectedAttribute] = useState<string>()
  const { data: battleState } = useBattleState()
  const { data: trades } = useCharacterTrades(parseInt(characterId))
  const { data: matches } = useCharacterMatches(parseInt(characterId))
  const [currentMatchIdLast, setCurrentMatchIdLast] = useState(0)
  const willStartIn = useTimeTill(battleState?.willStartAt ?? 0)
  const { data: holders } = useCharacterHolders(parseInt(characterId))
  const { data: users } = useUsers()

  // Generate round-robin matchups
  const characterIds = characters?.map(c => c.id.toString()) || []
  const [matchups, setMatchups] = useState<number[][]>([])

  useEffect(() => {
    if (characters && matchups.length === 0) {
      setMatchups(generateRoundRobinMatchups(characterIds))
    }
  }, [characters, characterIds])

  // Battle status logic
  const characterStatus = useMemo(() => {
    return battleState?.p1 === parseInt(characterId) || battleState?.p2 === parseInt(characterId) 
      ? battleState?.status === Status.Battling
        ? 'inBattle'
        : (battleState?.status === Status.Pending ? 'waiting' : 'idle')
      : 'idle'
  }, [battleState, characterId])

  // Combined activities for chart
  const combinedActivities = useMemo(() => {
    const tradeActivities = trades || []
    const matchActivities = matches || []

    const allActivities = [
      ...tradeActivities.map(trade => ({
        ...trade,
        timestamp: trade.timestamp,
        type: 'trade'
      })),
      ...matchActivities.map(match => ({
        ...match,
        timestamp: match.timestamp,
      }))
    ]

    return allActivities.sort((a, b) => a.timestamp - b.timestamp)
  }, [trades, matches])
  const [startTime, setStartTime] = useState<number>(Math.floor(Date.now() / 1000) - 24 * 60 * 60);

  const { data: performance } = useCharacterPerformance(parseInt(characterId), startTime);

  const matchesLeft = useMemo(() => {
    if (!matchups.length || !battleState) return 0;
    
    const currentMatchIndex = battleState.currentMatch % matchups.length;
    const wrappedMatchups = [...matchups.slice(currentMatchIndex), ...matchups.slice(0, currentMatchIndex)];
    const nextMatchIndex = wrappedMatchups.findIndex(match => match.includes(parseInt(characterId)));
    
    let adjustedMatchesLeft = nextMatchIndex;
    if (battleState.status === Status.Pending) {
      adjustedMatchesLeft -= 1;
    }
    
    return adjustedMatchesLeft;
  }, [matchups, battleState, characterId]);

  const { authenticated, login } = usePrivy()
  const { fundWallet } = useFundWallet()
  const address = useAddress()
  const { balanceNumber } = useBalance(address)
  
  const shouldFund = useMemo(() => {
    return balanceNumber <= 0;
  }, [balanceNumber])

  const handleShowModal = useCallback((action: 'Buy' | 'Sell') => {
    if(!authenticated) {
      login();
      return;
    }
    if(shouldFund) {
      fundWallet(address, {chain: currentChain});
      return;
    }
    setModalAction(action);
    setShowModal(true);
  }, [authenticated, login, shouldFund, address]);

  const handleCloseModal = () => {
    setShowModal(false);
  }

  const handleOpenStakeModal = (attribute: Attribute) => {
    setSelectedAttribute(attribute as any)
    setShowStakeModal(true)
  }

  const handleOpenUnstakeModal = (attribute: Attribute) => {
    setSelectedAttribute(attribute as any)
    setShowUnstakeModal(true)
  }

  const [visibleMatches, setVisibleMatches] = useState<MatchEndActivity[]>([]);
  const [visibleHolders, setVisibleHolders] = useState<User[]>([]);
  const [visibleTrades, setVisibleTrades] = useState<TradeActivity[]>([]);
  const [page, setPage] = useState(0);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (matches) setVisibleMatches(matches.slice(0, 10).sort((a, b) => b.timestamp - a.timestamp));
    if (holders) {
      const sortedHolders = [...holders].sort((a, b) => {
        const balanceA = a.balances?.find(b => b.character === character.id)?.balance || 0;
        const balanceB = b.balances?.find(b => b.character === character.id)?.balance || 0;
        return balanceB - balanceA;
      });
      setVisibleHolders(sortedHolders.slice(0, 10));
    }
    if (trades) setVisibleTrades(trades.slice(0, 10).sort((a, b) => b.timestamp - a.timestamp));
  }, [matches, holders, trades, character]);

  const loadMoreItems = useCallback((type: 'matches' | 'holders' | 'trades') => {
    const newPage = page + 1;
    const start = newPage * 10;
    const end = start + 10;

    switch(type) {
      case 'matches':
        if (matches) {
          const sortedMatches = [...matches].sort((a, b) => b.timestamp - a.timestamp);
          setVisibleMatches(sortedMatches.slice(0, end));
        }
        break;
      case 'holders':
        if (holders) {
          const sortedHolders = [...holders].sort((a, b) => {
            const balanceA = a.balances?.find(b => b.character === character.id)?.balance || 0;
            const balanceB = b.balances?.find(b => b.character === character.id)?.balance || 0;
            return balanceB - balanceA;
          });
          setVisibleHolders(sortedHolders.slice(0, end));
        }
        break;
      case 'trades':
        if (trades) {
          const sortedTrades = [...trades].sort((a, b) => b.timestamp - a.timestamp);
          setVisibleTrades(sortedTrades.slice(0, end));
        }
        break;
    }
    setPage(newPage);
  }, [page, matches, holders, trades, character]);

  const lastItemRef = useCallback((node: any, type: 'matches' | 'holders' | 'trades') => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadMoreItems(type);
      }
    });
    if (node) observer.current.observe(node);
  }, [loadMoreItems]);

  if (!character) return null
  

  return (
    <div className="min-h-screen pb-16">
      {/* New Navigation Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between h-14 px-4 max-w-md mx-auto relative">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/" className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
            <img src="/logo.png" alt="Logo" className="h-8 w-8" />
            <img src="/logo-text.png" alt="Logo Text" className="h-4" />
          </Link>
          <Button variant="ghost" size="icon">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 pt-16 space-y-6">
        {/* Character Header - Updated Style */}
        <div className="py-4 space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <AIAvatar
                src={character.pfp}
                alt={character.name}
                size="md"
                className="h-12 w-12"
              />
              <div>
                <h1 className="text-xl font-bold">{character.name}</h1>
                <div className="flex items-center gap-2 text-xs">
                  {/* <Badge variant="secondary" className="bg-yellow-400 text-white">
                    Tier {getTier(character.value)}
                  </Badge> */}
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className='flex flex-col'>
                      <div className="text-xs text-muted-foreground">Win Rate</div>
                      <div className="text-green-500 font-bold">{(character.winCount * 100 / character.matchCount)?.toFixed(0)}%</div>
                    </div>
                    
                    <div className='flex flex-col'>
                      <div className="text-xs text-muted-foreground">Wins</div>
                      <div className="text-green-500 font-bold">{character.winCount}</div>
                    </div>
                    <div className='flex flex-col'>
                      <div className="text-xs text-muted-foreground">Losses</div>
                      <div className="text-red-500 font-bold">{character.lossCount}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold mb-1">
                {formatNumber(convertEthToUsd(character.price))}
              </div>
              <div className={`text-sm flex items-center justify-end ${
                performance > 0 ? "text-green-500" : "text-red-500"
              }`}>
                {performance > 0 ? 
                  <ArrowUp className="h-4 w-4 mr-1" /> : 
                  <ArrowDown className="h-4 w-4 mr-1" />
                }
                {formatPercentage(performance/100)}
                <span className="text-xs text-muted-foreground font-bold">
                    24H
                </span>
              </div>
            </div>
          </div>

          {/* Market Data Cards */}
          <div className="grid grid-cols-4 gap-2">
            <MarketDataCard 
              icon={<DollarSign className="h-4 w-4" />} 
              title="Market Cap" 
              value={formatNumber(convertEthToUsd(character.value))} 
            />
            <MarketDataCard 
              icon={<Users className="h-4 w-4" />} 
              title="Holders" 
              value={holders?.length.toString() || "0"} 
            />
            <MarketDataCard 
              icon={<Target className="h-4 w-4" />} 
              title="Supply" 
              value={character.supply.toString()} 
            />
            <Card className="p-2">
              <CardContent className="p-0 flex flex-col items-center justify-center h-full">
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center">
                    <ThumbsUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-xs">ATK</span>
                  </div>
                  <span className="font-bold text-sm">{character.attack}</span>
                </div>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <ThumbsDown className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-xs">DEF</span>
                  </div>
                  <span className="font-bold text-sm">{character.defense}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Chart */}
          <Card>
            <CardContent className="p-4">
              <div className="h-[200px]">
                <MobileChart 
                  activities={combinedActivities as any}
                  characterId={parseInt(characterId)}
                  characters={characters}
                  height={200}
                />
              </div>
            </CardContent>
          </Card>

          {/* Trading Buttons - Updated Style */}
          <div className="grid grid-cols-2 gap-4">
            {characterStatus === "inBattle" ? (
              <Button 
                disabled 
                className="w-full h-12 mt-4 bg-gray-700 text-yellow-400 text-sm"
              >
                Buying locked 🔒
              </Button>
            ) : (
              <Button 
                className="w-full h-12 mt-4 bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 
                  relative overflow-hidden group text-sm font-bold uppercase tracking-wider animate-aggressive-pulse
                  transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]
                  hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] focus:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                onClick={() => handleShowModal('Buy')}
              >
                <span className="relative z-10 text-shadow-glow animate-text-pulse text-outline outline-black text-black group-hover:animate-shimmer-text">
                  BUY NOW
                </span>
                <span className="absolute top-0 right-0 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 text-[8px] rounded-bl-md font-bold 
                  flex items-center text-white whitespace-nowrap group-hover:bg-black/50">
                  <Clock className="mr-0.5 h-2.5 w-2.5 animate-pulse text-green-300" />
                  {characterStatus === "waiting" 
                    ? `${formatTime(willStartIn)} left`
                    : matchesLeft <= 0 
                      ? 'Finished'
                      : matchesLeft === 1
                        ? 'Next up'
                        : `${matchesLeft} matches left`
                  }
                </span>
                <span 
                  className="absolute inset-0 bg-gradient-to-r from-green-400 via-green-300 to-green-400 opacity-75 
                    animate-shimmer group-hover:opacity-90" 
                  style={{ backgroundSize: '200% 100%' }}
                />
              </Button>
            )}
            {characterStatus !== "inBattle" && (
            <Button 
                className="w-full bg-red-500 hover:bg-red-600 text-white h-12 mt-4 text-black text-outline text-sm font-bold"
                onClick={() => handleShowModal('Sell')}
              >
                SELL
              </Button>
            )}
            {characterStatus === "inBattle" && (
              <Button 
                disabled 
                className="w-full h-12 mt-4 bg-gray-700 text-yellow-400 text-sm"
              >
                Selling locked 🔒
              </Button>
            )}
          </div>

          {/* Activity Tabs */}
          <Tabs defaultValue="matches" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="matches" className="text-xs">Matches</TabsTrigger>
              <TabsTrigger value="holders" className="text-xs">Holders</TabsTrigger>
              <TabsTrigger value="trades" className="text-xs">Trades</TabsTrigger>
            </TabsList>
                <TabsContent value="matches">
                <Card className="overflow-hidden divide-y divide-border">
                {visibleMatches.map((match, index) => {
                    const isPlayer1 = match.p1 === parseInt(characterId);
                    const opponentId = isPlayer1 ? match.p2 : match.p1;
                    const opponent = characters?.find(c => c.id === opponentId);
                    const isWinner = match.winner === parseInt(characterId);
                    const priceChange = isPlayer1 
                        ? (match.tokenState.newPrice1 - match.tokenState.prevPrice1) / match.tokenState.prevPrice1
                        : (match.tokenState.newPrice2 - match.tokenState.prevPrice2) / match.tokenState.prevPrice2;
                    const newPrice = isPlayer1 ? match.tokenState.newPrice1 : match.tokenState.newPrice2;
                    const mcapChange = Math.abs(match.tokenState.reward);
                    
                    return (
                        <div 
                        key={match.timestamp} 
                        ref={index === visibleMatches.length - 1 ? (node) => lastItemRef(node, 'matches') : null}
                        className="w-full justify-between px-4 py-3 hover:bg-accent/50 flex items-center gap-2"
                        >
                        <div className="flex items-center gap-2">
                            <div className='flex flex-col'>
                            <div className="flex items-center gap-1">
                                <div className={`text-xs font-bold ${isWinner ? 'text-green-500' : 'text-red-500'}`}>
                                {isWinner ? 'Beat' : 'Lost to'}
                                </div>
                                <img 
                                src={opponent?.pfp || '/placeholder.svg'}
                                alt={opponent?.name}
                                className="w-4 h-4 rounded-full object-cover"
                                />
                                <div className="text-sm font-medium">{opponent?.name}</div>
                            </div>
                            <div className={`text-xs text-muted-foreground`}>
                                {isWinner ? '+' : '-'} {formatNumber(convertEthToUsd(mcapChange))} MCap {isWinner ? 'gained' : 'lost'}
                            </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-sm font-bold ${isWinner ? 'text-green-500' : 'text-red-500'}`}>
                            {formatNumber(convertEthToUsd(newPrice))}
                            <span className="text-xs ml-1">({isWinner ? '+' : '-'}{formatPercentage(Math.abs(priceChange))})</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                            {timeSince(match.timestamp)}
                            </div>
                        </div>
                        </div>
                    );
                    })}
                </Card>
                </TabsContent>

                <TabsContent value="holders">
                <Card className="overflow-hidden divide-y divide-border">
                {visibleHolders.map((holder, index) => {
                    const user = users?.find(u => u.address === holder.address)
                    const balance = holder.balances?.find(b => b.character === character?.id)?.balance
                    if (!user || !balance) return null

                    return (
                    <div 
                        key={holder.address}
                        ref={index === visibleHolders.length - 1 ? (node) => lastItemRef(node, 'holders') : null}
                        className="w-full justify-between px-4 py-3 hover:bg-accent/50 flex items-center gap-2"
                        >
                        <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">#{index + 1}</div>
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={holder.pfp ?? buildDataUrl(holder.address)} />
                            <AvatarFallback>{holder.username ?? truncateWallet(holder.address)[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="text-sm">{holder.username ?? truncateWallet(holder.address)}</div>
                            
                        </div>
                        </div>
                        <div className="text-right">
                        <div className="text-sm font-bold">
                            {balance} shares
                        </div>
                        <div className="text-xs text-muted-foreground">
                            <span className="font-bold">{formatPercentage((balance / character.supply))}</span> of supply
                        </div>

                        </div>

                    </div>
                    )
                })}
                </Card> 
                </TabsContent>

                <TabsContent value="trades">
                <Card className="overflow-hidden divide-y divide-border">
                    {visibleTrades.map((trade, index) => {
                    const trader = users?.find(u => u.address.toLowerCase() === trade.trader.toLowerCase())
                    if (!trader) return null

                    return (
                    <div 
                        key={trade.timestamp}
                        ref={index === visibleTrades.length - 1 ? (node) => lastItemRef(node, 'trades') : null}
                        className="w-full justify-between px-4 py-3 hover:bg-accent/50 flex items-center gap-2"
                        >
                        <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={trader.pfp ?? buildDataUrl(trader.address)} />
                            <AvatarFallback>{trader.username ? `@${trader.username}` : truncateWallet(trader.address)[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <div className="text-sm font-medium">
                            {trader.username ?? truncateWallet(trader.address)}
                            </div>
                            <div className={`text-xs text-muted-foreground`}>
                            <span className={`${trade.isBuy ? 'text-green-500' : 'text-red-500'}`}>{trade.isBuy ? 'Bought' : 'Sold'}</span> <span className="font-bold">{trade.shareAmount}</span> shares for <span className={`font-bold ${trade.isBuy ? 'text-green-500' : 'text-red-500'}`}>{formatNumber(convertEthToUsd(trade.ethAmount))}</span>
                            </div>
                        </div>
                        </div>
                        <div className="text-right">
                        <div className={`text-sm font-bold ${trade.isBuy ? 'text-green-500' : 'text-red-500'}`}>
                            {formatNumber(convertEthToUsd(trade.newPrice))}
                            <span className="text-xs ml-1">
                               ({trade.isBuy ? '+' : '-'}{formatPercentage(Math.abs((trade.newPrice - trade.prevPrice) / trade.prevPrice))})
                            </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {timeSince(trade.timestamp)}
                        </div>
                        </div>
                    </div>
                    )
                })}
                </Card>
                </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Keep existing Modals */}
      <ModalBuySell 
        isInBattle={characterStatus === "inBattle"}
        characterId={character.id}
        show={showModal}
        handleClose={handleCloseModal}
        handleOpen={handleShowModal}
        actionType={modalAction}
        characterName={character.name}
        timeLeft={characterStatus === "waiting" ? willStartIn : 0}
        matchesLeft={matchesLeft}
      />
    </div>
  )
}

// Add new MarketDataCard component
function MarketDataCard({ icon, title, value }: { icon: React.ReactNode, title: string, value: string }) {
  return (
    <Card className="p-2">
      <CardContent className="p-0 flex flex-col items-center justify-center h-full">
        <div className="mt-1 text-xs text-center">{title}</div>
        <div className="font-bold text-sm">{value}</div>
      </CardContent>
    </Card>
  )
}

// Helper function for round-robin matchups
function generateRoundRobinMatchups(characters: string[]) {
  if (characters.length % 2 === 1) {
    characters.push(null as any)
  }

  const playerCount = characters.length
  const rounds = playerCount - 1
  const half = playerCount / 2
  const matchups = []
  const playerIndexes = characters.map((_, i) => i).slice(1)

  for (let round = 0; round < rounds; round++) {
    const roundPairings = []
    const newPlayerIndexes = [0].concat(playerIndexes)
    const firstHalf = newPlayerIndexes.slice(0, half)
    const secondHalf = newPlayerIndexes.slice(half, playerCount).reverse()

    for (let i = 0; i < firstHalf.length; i++) {
      const p1 = firstHalf[i]
      const p2 = secondHalf[i]

      if (characters[p1] !== null && characters[p2] !== null) {
        roundPairings.push([p1, p2])
      }
    }

    playerIndexes.push(playerIndexes.shift() as any)
    matchups.push(...roundPairings)
  }

  return matchups
} 

