import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ModalBuySell } from './ModalBuySell';
import { MatchList } from './MatchList';
import { HolderList } from './HolderList';
import { TradeList } from './TradeList';
import { StakeList } from './StakeList';
import { useCharacter, useCharacterTrades, useCharacterPerformance, useCharacters, useCharacterMatches, useUser, useBattleState, useCharacterHolders } from '../hooks/api';
import { useCharacterSharesBalance } from '../hooks/contract';
import { useAddress } from '../hooks/user';
import { Chart } from './Chart';
import { MatchEndActivity, TradeActivity } from '@memeclashtv/types/activity';
import ModalStake from './ModalStake'; // Adjust the path as necessary
import { Attribute, Status } from '@memeclashtv/types';
import { Users, DollarSign, Coins, TrendingUp, Heart, Zap, Swords, Shield, Wind } from 'lucide-react'
import { useConvertEthToUsd } from '../EthPriceProvider';
import ModalUnstake from './ModalUnstake';
import { formatEther, formatNumber, formatPercentage } from '../lib/utils';
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Badge } from './ui/badge';
import { Trophy, Target, ThumbsUp, ThumbsDown } from 'lucide-react';
import { StatusIndicator } from './CharacterList';
import { useTimeTill } from './WorldStateView';

type TimeFrame = 'Live' | '1D' | '1W' | '1M' | '3M' | 'YTD' | '1Y' | 'ALL';

//Create tier list base on market cap, S, A, B, C, D
//Priced in ETH 0-1ETH = D, 1-5ETH = C, 5-10ETH = B, 10-50ETH = A, 50+ETH = S
const getTier = (marketCap: number) => {
    if (marketCap > 50) return 'S';
    if (marketCap > 10) return 'A';
    if (marketCap > 5) return 'B';
    if (marketCap > 1) return 'C';
    if (marketCap > 0) return 'D';
    return 'F';
}

export const statIcons = {
    Health: <Heart className="w-4 h-4 text-green-500" />,
    Power: <Zap className="w-4 h-4 text-blue-500" />,
    Attack: <Swords className="w-4 h-4 text-orange-500" />,
    Defense: <Shield className="w-4 h-4 text-gray-500" />,
    Speed: <Wind className="w-4 h-4 text-yellow-500" />
}

// Function to generate round-robin matchups
export function generateRoundRobinMatchups(characters: string[]) {
    if (characters.length % 2 === 1) {
        characters.push(null as any); // Add a dummy character for odd number of characters
    }

    const playerCount = characters.length;
    const rounds = playerCount - 1;
    const half = playerCount / 2;

    const matchups = [];

    const playerIndexes = characters.map((_, i) => i).slice(1);

    for (let round = 0; round < rounds; round++) {
        const roundPairings = [];

        const newPlayerIndexes = [0].concat(playerIndexes);

        const firstHalf = newPlayerIndexes.slice(0, half);
        const secondHalf = newPlayerIndexes.slice(half, playerCount).reverse();

        for (let i = 0; i < firstHalf.length; i++) {
            const p1 = firstHalf[i];
            const p2 = secondHalf[i];

            if (characters[p1] !== null && characters[p2] !== null) {
                roundPairings.push([p1, p2]);
            }
        }

        // Rotate the array
        playerIndexes.push(playerIndexes.shift() as any);
        matchups.push(...roundPairings);
    }

    return matchups;
}

interface StatusBadgeProps {
    status: 'inBattle' | 'waiting' | 'idle';
  }
  
  const statusStyles = {
    inBattle: 'bg-red-500 text-white',
    waiting: 'bg-yellow-500 text-white',
    idle: 'bg-green-500 text-white',
  };
  
  const statusText = {
    inBattle: 'In Battle',
    waiting: 'Waiting to Battle',
    idle: 'Idle',
  };
  
  const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[status]}`}>
        {statusText[status]}
      </span>
    );
  };

export const getMatchesUntilNextMatch = (
    characterId: number, 
    currentMatchIndex: number, 
    characterIds: string[]
) => {
    const matchups = generateRoundRobinMatchups(characterIds);
    const wrappedMatchups = [...matchups.slice(currentMatchIndex), ...matchups.slice(0, currentMatchIndex)];
    const nextMatchIndex = wrappedMatchups.findIndex(match => match.includes(characterId));
    return nextMatchIndex;
}

export const getMatchesUntilNextMatchForCharacters = (
    characterIds: string[],
    currentMatchIndex: number, // In raw number, not wrapped,
): { [id: number] : number} => {
    const matchups = generateRoundRobinMatchups(characterIds);
    const trueCurrentMatchIndex = currentMatchIndex % matchups.length;
    const wrappedMatchups = [...matchups.slice(trueCurrentMatchIndex), ...matchups.slice(0, trueCurrentMatchIndex)];
    const matchesTill = {}
    characterIds.forEach(characterId => {
        const nextMatchIndex = wrappedMatchups.findIndex(match => match.includes(Number(characterId)));
        console.log("AA, true current matchindex", trueCurrentMatchIndex)
        console.log("AA, djfnf",nextMatchIndex)
        console.log("AA, matchups", wrappedMatchups)
        const trueNextMatchIndex = (nextMatchIndex + trueCurrentMatchIndex) % matchups.length;
        let matchesTill_ = trueNextMatchIndex - trueCurrentMatchIndex;
        if(matchesTill_ < 0) {
            matchesTill_ += matchups.length;
        }
        matchesTill[characterId] = matchesTill_;
    })
    return matchesTill;
}

export const CharacterPage = () => {
    const { id } = useParams();
    const [showModal, setShowModal] = useState(false);
    const [modalAction, setModalAction] = useState('Buy');
    const address = useAddress();
    const characterId = parseInt(id);
    const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('1D');
    const [startTime, setStartTime] = useState<number>(Math.floor(Date.now() / 1000) - 24 * 60 * 60);
    const [showStakeModal, setShowStakeModal] = useState(false);
    const [selectedAttribute, setSelectedAttribute] = useState<number>(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const { data: character, isLoading } = useCharacter(characterId);
    const { data: characters, isLoading: isCharactersLoading, isFetched: isCharactersFetched } = useCharacters();
    const { data: yourShares } = useCharacterSharesBalance(characterId, address);
    const { data: trades } = useCharacterTrades(characterId);
    const { data: matches } = useCharacterMatches(characterId);
    const { data: performance } = useCharacterPerformance(characterId, startTime);
    const { data: battleState, isLoading: isBattleLoading, isError: isBattleError } = useBattleState(); // Use battleState hook
    const { data: holders } = useCharacterHolders(characterId);
    const convertEthToUsd = useConvertEthToUsd();
    const [currentMatchIdLast, setCurrentMatchIdLast] = useState(0);

    const { data: user } = useUser(address);

    const unlockTime = user?.stakeUnlockTime;

    const totalStakes = useMemo(() => {
        return character?.healthStakes + character?.powerStakes + character?.attackStakes + character?.defenseStakes + character?.speedStakes;
    }, [character]);

    const getMatchStatusText = () => {
        let adjustedMatchesTillNextMatch = matchesLeft;
    
        if (battleState.status === Status.Pending) {
          adjustedMatchesTillNextMatch -= 1;
        }
    
        if (battleState.p1 === characterId || battleState.p2 === characterId) {
          if (battleState.status === Status.Battling) {
            return "In battle";
          } else if (battleState.status === Status.Pending) {
            return "Waiting to battle";
          } else if (battleState.status === Status.Idle) {
            return "Finished battling";
          }
        } else if (adjustedMatchesTillNextMatch === 1) {
          return <p>Next up</p>;
        } else if (adjustedMatchesTillNextMatch > 0) {
          return <p>{adjustedMatchesTillNextMatch} {adjustedMatchesTillNextMatch === 1 ? 'match' : 'matches'} left until battle vs <img src={nextOpponent?.pfp} className="w-4 h-4 rounded-full inline-block" alt={nextOpponent?.name} />{nextOpponent?.name || "Unknown"} estimated in {adjustedMatchesTillNextMatch * 2} min</p>;
        } else {
          return "Finished battling";
        }
      };

    const yourStakes = useMemo(() => {
        const types = [
            "attack",
            "defense",
            "health",
            "power",
            "speed"
        ]
        const stakes = {};
        types.forEach(stat => {
            const stake = user?.stakes?.find(stake => stake.attribute == Attribute[stat] && stake.character == characterId)
            stakes[stat] = stake?.balance ?? 0;
        });
        return { ...stakes }; // Return a new object to avoid read-only issues
    }, [character, user]);

    const [showUnstakeModal, setShowUnstakeModal] = useState(false);

    const characterStakes = useMemo(() => {
        const types = [
            "attack",
            "defense",
            "health",
            "power",
            "speed"
        ];
        const stakes = {}; // Create a mutable object
        types.forEach(stat => {
            stakes[stat] = character?.[stat.toString().toLowerCase() + "Stakes"] ?? 0;
        });
        return { ...stakes }; // Return a new object to avoid read-only issues
    }, [character]);

    useEffect(() => {
        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        switch (selectedTimeFrame) {
            case 'Live':
                setStartTime(now - 60 * 60); // 1 hour ago
                break;
            case '1D':
                setStartTime(now - 24 * 60 * 60);
                break;
            case '1W':
                setStartTime(now - 7 * 24 * 60 * 60);
                break;
            case '1M':
                setStartTime(now - 30 * 24 * 60 * 60);
                break;
            case '3M':
                setStartTime(now - 90 * 24 * 60 * 60);
                break;
            case 'YTD':
                setStartTime(Math.floor(new Date(new Date().getFullYear(), 0, 1).getTime() / 1000));
                break;
            case '1Y':
                setStartTime(now - 365 * 24 * 60 * 60);
                break;
            case 'ALL':
                setStartTime(0); // From the beginning
                break;
        }
    }, [selectedTimeFrame]);

    const handleShowModal = (action: 'Buy' | 'Sell') => {
        setModalAction(action);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        console.log("mounted Calling handle close")
        setShowModal(false);
    }
    const handleTimeFrameChange = (timeFrame: TimeFrame) => {
        setSelectedTimeFrame(timeFrame);
    };

    // Function to handle opening the stake modal
    const handleOpenStakeModal = (attribute: number) => {
        setSelectedAttribute(attribute);
        setShowStakeModal(true);
    };

    const handleOpenUnstakeModal = (attribute: number) => {
        setSelectedAttribute(attribute);
        setShowUnstakeModal(true);
    };

    // Combine and sort activities
    const combinedActivities = useMemo(() => {
        const tradeActivities = trades || [];
        const matchActivities = matches || [];

        // Combine both activities
        const allActivities = [
            ...tradeActivities.map((trade: TradeActivity) => ({
                ...trade,
                timestamp: trade.timestamp, // Ensure timestamp is available
                type: 'trade' // Add a type for easier identification
            })),
            ...matchActivities.map((match: MatchEndActivity) => ({
                ...match,
                timestamp: match.timestamp, // Ensure timestamp is available
            })),
        ];

        // Sort by timestamp
        return allActivities.sort((a, b) => a.timestamp - b.timestamp);
    }, [trades, matches]);

    const characterStatus = battleState?.p1 === characterId || battleState?.p2 === characterId 
    ? battleState?.status == Status.Battling
    ? 'inBattle'
    : (battleState?.status == Status.Pending? 'waiting': 'idle')
    : 'idle';

    // Generate round-robin matchups
    const characterIds = characters?.map(c => c.id.toString()) || [];
    const [matchups, setMatchups] = useState<number[][]>([]);
    useEffect(() => {
        if (isCharactersFetched && matchups.length == 0) {
            setMatchups(generateRoundRobinMatchups(characterIds));
            console.log("calling generateRoundRobinMatchups")
        }
    }, [isCharactersFetched]);
    const totalMatches = matchups.length;
    console.log("Matchups", matchups)

    const willStartIn =  useTimeTill(battleState?.willStartAt ?? 0)

    // Determine the current match index from battleState
    useEffect(()=> {
        if (battleState?.currentMatch) {
            setCurrentMatchIdLast(battleState?.currentMatch % matchups.length)
        }
    },[battleState?.currentMatch, matchups])

    console.log("Matchups current match: ", currentMatchIdLast, "total matches: ", totalMatches)


    // Find the next match for the character, wrapping around from the current index
    const wrappedMatchups = [...matchups.slice(currentMatchIdLast), ...matchups.slice(0, currentMatchIdLast)];
    const nextMatchIndex = wrappedMatchups.findIndex(match => match.includes(characterId));

    // Calculate the true index of the next match
    const trueNextMatchIndex = (nextMatchIndex + currentMatchIdLast) % totalMatches;

    console.log("true match index", trueNextMatchIndex)

    

    // Calculate the number of matches left until the next match
    let matchesLeft = trueNextMatchIndex - currentMatchIdLast;
    if(matchesLeft < 0) {
        matchesLeft += matchups.length;
    }

    // Predict the next character that will be fought
    const nextMatch = matchups[trueNextMatchIndex];
    const nextOpponentId = nextMatch?.find(id => id !== characterId);
    const nextOpponent = characters?.find(c => c.id === nextOpponentId);

    const holderCount = useMemo(() => {
        return holders?.length || 0;
    }, [holders]);

    const isBattling = characterStatus == "inBattle"
    const isPendingMatch = characterStatus == "waiting"

    const BuyButton = () => {
        if (isBattling) {
            return <Button disabled className="text-4xl flex-1 bg-gray-700 text-white text-2xl font-bold hover:bg-green-700 transition-all duration-300 relative overflow-hidden group py-10 h-40">Trading Locked🔒</Button>
        }
        if (isPendingMatch) {
            return (
                <Button 
                style={{
                    textShadow: `
                    2px 2px 0 #000000, 
                    2px 2px 0 #000000, 
                    2px 2px 0 #000000, 
                    2px 2px 0 #000000, 
                    2px 2px 0 #000000
                `,
                }}  
                className="text-4xl flex-1 breathing-green bg-green-600 text-white text-2xl font-bold hover:bg-green-700 transition-all duration-300 relative overflow-hidden group py-10 h-40"
                    onClick={() => handleShowModal('Buy')}
                >
                    BUY NOW
                    <span className="absolute top-0 right-0 bg-gray-700 bg-opacity-50 text-sm px-1 py-0.5 rounded-bl font-bold">
                    {(willStartIn ?? 0).toString().padStart(2, '0')}s left to buy
                </span>
            </Button>
            )
        }
        return (
            <Button 
                style={{
                    textShadow: `
                    2px 2px 0 #000000, 
                    2px 2px 0 #000000, 
                    2px 2px 0 #000000, 
                    2px 2px 0 #000000, 
                    2px 2px 0 #000000
                `,
                }}  
                className="text-4xl flex-1 breathing-green bg-green-600 text-white text-2xl font-bold hover:bg-green-700 transition-all duration-300 relative overflow-hidden group py-10 h-40"
                onClick={() => handleShowModal('Buy')}
            >
                BUY NOW
                <span className="absolute top-0 right-0 bg-gray-700 bg-opacity-50 text-sm px-1 py-0.5 rounded-bl font-bold">
                    {matchesLeft} matches till next battle
                </span>
            </Button>
        )
    }

    if (isLoading || isBattleLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
    console.log("AAbb character status", characterStatus)
    return (
        <div className="flex flex-col lg:flex-row w-full gap-4 lg:gap-8 items-start justify-center p-2 lg:p-4 min-h-screen">
            <div className="flex flex-col items-center lg:sticky lg:top-8 w-full lg:w-1/4 bg-card p-4 rounded-lg shadow bg-gray-900">
                <div className="flex flex-col space-y-4">
                    <div className="relative flex flex-col items-center pb-6 z-10 lg:w-1/3 sticky top-8">
                        <style>{`
                            .profile-picture-container {
                                perspective: 1000px;
                                transform-style: preserve-3d;
                                width: 12rem;
                                height: 12rem;
                            }

                            .profile-picture {
                                width: 100%;
                                height: 100%;
                                transition: transform 10s;
                                transform-style: preserve-3d;
                                animation: hover-rotate 10s ease-in-out infinite;
                            }

                            .profile-picture:hover {
                                animation-play-state: paused;
                            }

                            .profile-picture-front,
                            .profile-picture-back {
                                position: absolute;
                                width: 100%;
                                height: 100%;
                                backface-visibility: hidden;
                                border-radius: 50%;
                            }

                            .profile-picture-back {
                                transform: rotateY(180deg);
                                background-color: #1f2937;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 3rem;
                                font-weight: bold;
                                color: white;
                            }

                            @keyframes hover-rotate {
                                0%, 100% { transform: rotateY(-20deg) rotateX(20deg); }
                                25% { transform: rotateY(20deg) rotateX(-20deg); }
                                50% { transform: rotateY(-20deg) rotateX(20deg); }
                                75% { transform: rotateY(20deg) rotateX(-20deg); }
                            }

                            /* Flipping Animation */
                            .rotate-y-180 {
                                transform: rotateY(180deg);
                            }
                        `}</style>
                        <div
                            className="profile-picture-container relative mb-4 cursor-pointer"
                            onClick={() => setIsFlipped(!isFlipped)}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full p-1">
                                <div className={`profile-picture ${isFlipped ? 'rotate-y-180' : ''}`}>
                                    <div className="profile-picture-front">
                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-400 via-red-500 to-pink-500 p-2 shadow-lg">
                                            <Avatar className="w-full h-full border-2 border-solid border-yellow-400 bg-gradient-to-br from-yellow-400 via-red-500 to-pink-500 p-2 shadow-lg">
                                                <AvatarImage src={character.pfp} alt={character.name} className="object-cover rounded-full" />
                                                <AvatarFallback>{character.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </div>
                                    <div className="profile-picture-back text-4xl font-bold">
                                        {character.name.charAt(0)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h2 className="mt-4 text-4xl font-bold">{character.name}</h2>
                        <div className="flex items-center mt-2 space-x-2">
                            <Badge variant="secondary" className="text-lg px-3 py-1 bg-yellow-400 text-white font-bold">
                                Tier {getTier(character.value)}
                            </Badge>
                            <Badge variant="outline" className="text-lg px-3 py-1 border-green-400 text-green-400">
                                {characterStatus}
                            </Badge>
                        </div>
                    </div>
                    <div className="pt-0 z-10 relative lg:w-2/3 lg:pl-8">
                        <div className="flex flex-row justify-between gap-4 mb-6">
                            <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                                <Trophy className="w-8 h-8 text-yellow-400 mb-2 mx-auto" />
                                <span className="text-xl text-gray-400">Win Rate</span>
                                <span className="block text-2xl font-bold text-white">{(character.winCount * 100 / character.matchCount)?.toFixed(0)}%</span>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                                <Target className="w-8 h-8 text-blue-400 mb-2 mx-auto" />
                                <span className="text-xl text-gray-400 font-bold">Matches</span>
                                <span className="block text-2xl font-bold text-white">{character.matchCount}</span>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                                <ThumbsUp className="w-8 h-8 text-green-400 mb-2 mx-auto" />
                                <span className="text-xl text-gray-400 font-bold">Wins</span>
                                <span className="block text-2xl font-bold text-white">{character.winCount}</span>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                                <ThumbsDown className="w-8 h-8 text-red-400 mb-2 mx-auto" />
                                <span className="text-xl text-gray-400 font-bold">Losses</span>
                                <span className="block text-2xl font-bold text-white">{character.lossCount}</span>
                            </div>
                        </div>
                        <div className="space-y-2 mb-6">
                            {Object.entries(statIcons).map(([stat, icon]) => (
                                <div key={stat} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        {icon}
                                        <span className="text-sm ml-2">{stat}</span>
                                    </div>
                                    <span className={`text-xl font-bold ${icon.props.className.split(' ').find(c => c.startsWith('text-'))}`}>
                                        {character[stat.toLowerCase()]}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-700">
                            <h4 className="font-semibold mb-2 text-lg">Next Match:</h4>
                            <div className="flex flex-row items-center align-center space-x-4">
                                <div className="flex flex-col items-center align-center">
                                    <StatusIndicator 
                                    status={
                                        characterStatus == "inBattle" ? 'battling' : 
                                        characterStatus == "waiting" ? 'waiting-to-battle' : 
                                        characterStatus == "idle" ? 'idle' :
                                        characterStatus == "finished" ? 'finished' :
                                        'idle'
                                    } 
                                    matchesLeft={matchesLeft} 
                                    totalMatches={totalMatches} 
                                />
                                </div>
                                <span className="text-xl font-bold mt-4 ml-[-10px]">vs</span>
                                <div className="flex space-x-2 mt-4 items-center align-center">
                                    <Avatar className="w-8 h-8 border-2 border-yellow-400">
                                        <AvatarImage src={nextOpponent?.pfp} alt={nextOpponent?.name} />
                                        <AvatarFallback>{nextOpponent?.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-semibold text-yellow-400">{nextOpponent?.name}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Character info */}
            <div className='w-full lg:w-3/4 space-y-4 lg:space-y-8'>    
                <Card className='bg-gray-900'>
                    <CardHeader>
                            <h1 className='text-white font-bold text-4xl'>Price Chart</h1>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10 mb-6">
                            <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                                <div className="text-xl text-gray-400 font-bold flex flex-row items-center justify-center">
                                    <DollarSign className="w-4 h-4 text-green-400 mr-1" />
                                    <h1 className="text-xl font-bold">Price</h1>
                                </div>
                                <p className="block text-2xl font-bold text-white">{formatNumber(convertEthToUsd(character.price))} </p>
                                <span className="text-sm text-muted-foreground">{formatEther(character.price)}</span>
                                
                            </div>
                            <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                                <div className="text-xl text-muted-foreground flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 mr-1" />
                                    24h Change
                                </div>
                                <p className={`text-2xl font-bold ${performance > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {formatPercentage(performance/100)}
                                </p>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                                <p className="text-xl text-muted-foreground flex items-center justify-center">
                                    <DollarSign className="w-4 h-4 mr-1 text-green-400" />
                                    Market Cap
                                </p>
                                <p className="text-2xl font-bold">{formatNumber(convertEthToUsd(character.value))}</p>
                                <p className="text-sm text-muted-foreground">{formatEther(character.value)} ETH</p>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                                <p className="text-xl text-muted-foreground flex items-center">
                                    <Users className="w-4 h-4 mr-1" />
                                    Holders
                                </p>
                                <p className="text-2xl font-bold">{holderCount}</p>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-lg text-center border border-gray-700">
                                <p className="text-xl text-muted-foreground flex items-center">
                                    <Coins className="w-4 h-4 mr-1" />
                                    Supply
                                </p>
                                <p className="text-2xl font-bold">{(character.supply)}</p>
                            </div>
                            
                        </div>
                        
                        <div className="mb-4">
                            <Chart activities={combinedActivities as any} characterId={characterId} />
                        </div>
                        {/* <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 mb-6">
                            {['Live', '1D', '1W', '1M', '3M', 'YTD', '1Y', 'ALL'].map((timeFrame) => (
                                <button
                                    key={timeFrame}
                                    className={`w-full text-sm py-2 rounded-md transition-colors ${
                                        selectedTimeFrame === timeFrame
                                            ? 'bg-background/10 text-primary'
                                            : 'text-muted-foreground hover:bg-muted'
                                    }`}
                                    onClick={() => setSelectedTimeFrame(timeFrame as any)}
                                >
                                    {timeFrame}
                                </button>
                            ))}
                        </div> */}
                        <div className="flex space-x-4">
                            <BuyButton />
                            <Button 
                                style={{
                                    backgroundColor: '#BA3F3F',
                                    textShadow: `
                                        2px 2px 0 #000000, 
                                        2px 2px 0 #000000, 
                                        2px 2px 0 #000000, 
                                        2px 2px 0 #000000, 
                                        2px 2px 0 #000000
                                      `,
                                      color: '#FFFFFF',
                                      fontWeight: 'bold',
                                      fontSize: '20px',
                                      opacity: '0.8',
                 
                                }}  
                                className="text-4xl flex-1 text-lg py-6 hover:bg-red-700 transition-all duration-300 relative overflow-hidden group" 
                                onClick={() => handleShowModal('Sell')}
                            >
                                SELL
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Stats <span className="text-right text-sm text-gray-600">Total stakes: {totalStakes}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {['Health', 'Power', 'Attack', 'Defense', 'Speed'].map((stat) => (
                                <div key={stat} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium flex items-center">
                                            {statIcons[stat]}
                                            <span className="ml-2">{stat}</span>
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-5">
                                        <Progress value={(character[stat.toLowerCase()] / 100) * 100} className="h-4" />
                                        <Button className='ml-4' size="lg" onClick={() => handleOpenStakeModal(Attribute[stat?.toLowerCase()])}>Stake</Button>
                                    </div>
                                    <div className="flex justify-start text-sm text-muted-foreground items-center gap-10">
                                        <span>Total stakes: {character[`${stat.toLowerCase()}Stakes`]} </span>
                                        <span>Your stakes: {yourStakes[stat.toLowerCase()]}
                                            {yourStakes[stat.toLowerCase()] > 0 && 
                                                <Button className='ml-2' size="sm" variant="outline" onClick={() => handleOpenUnstakeModal(Attribute[stat?.toLowerCase()])}>Unstake</Button>
                                            }
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                
                {/* Tab lists */}
                <Tabs defaultValue="matches" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="matches">Matches</TabsTrigger>
                        <TabsTrigger value="holders">Holders</TabsTrigger>
                        <TabsTrigger value="trades">Trades</TabsTrigger>
                        <TabsTrigger value="stakes">Stakes</TabsTrigger>
                    </TabsList>
                    <TabsContent value="matches">
                        <MatchList characterId={characterId} characters={characters} />
                    </TabsContent>
                    <TabsContent value="holders">
                        <HolderList characterId={characterId} characterMarketCap={character?.value} characterSupply={character?.supply}/>
                    </TabsContent>
                    <TabsContent value="trades">
                        <TradeList characterId={characterId} characterImage={character?.pfp || ''} />
                    </TabsContent>
                    <TabsContent value="stakes">
                        <StakeList characterId={characterId} characterImage={character?.pfp || ''} />
                    </TabsContent>
                </Tabs>
            </div>

            <ModalBuySell 
                isInBattle={characterStatus == "inBattle"}
                characterId={character?.id}
                show={showModal}
                handleClose={handleCloseModal}
                handleOpen={handleShowModal}
                actionType={modalAction as any}
                characterName={character?.name}
            />

            <ModalStake 
                show={showStakeModal}
                handleClose={() => setShowStakeModal(false)}
                characterId={characterId}
                attribute={selectedAttribute as any}
            />

            <ModalUnstake 
                stakeUnlockTime={unlockTime}
                show={showUnstakeModal}
                handleClose={() => setShowUnstakeModal(false)}
                characterId={characterId}
                attribute={selectedAttribute as any}
            />
        </div>
    );
};