import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ModalBuySell } from './ModalBuySell';
import { MatchList } from './MatchList';
import { formatNumber, HolderList } from './HolderList';
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

const statIcons = {
    Health: <Heart className="w-4 h-4 text-green-500" />,
    Power: <Zap className="w-4 h-4 text-blue-500" />,
    Attack: <Swords className="w-4 h-4 text-orange-500" />,
    Defense: <Shield className="w-4 h-4 text-gray-500" />,
    Speed: <Wind className="w-4 h-4 text-yellow-500" />
}

// Function to generate round-robin matchups
function generateRoundRobinMatchups(characters: string[]) {
    let matchups = [];
    let n = characters.length;

    let _characters = characters.slice(); // Clone the array to avoid modifying the original
    if (n % 2 === 1) {
        _characters.push(null); // Add a dummy character for odd number of characters
        n++;
    }

    for (let round = 0; round < n - 1; round++) {
        for (let i = 0; i < n / 2; i++) {
            const char1 = _characters[i];
            const char2 = _characters[n - 1 - i];

            if (char1 !== null && char2 !== null) {
                matchups.push([parseInt(char1), parseInt(char2)]);
            }
        }

        // Rotate characters, keeping the first character in place
        _characters.splice(1, 0, _characters.pop()!);
    }

    return matchups;
}

// Function to calculate matches until next match
function matchesUntilNextMatch(currentMatchIndex: number, lastMatchIndex: number, totalMatches: number): number {
    if (currentMatchIndex < lastMatchIndex) {
        return lastMatchIndex - currentMatchIndex;
    } else {
        return totalMatches - currentMatchIndex + lastMatchIndex;
    }
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

export const CharacterPage = () => {
    const { id } = useParams();
    const [showModal, setShowModal] = useState(false);
    const [modalAction, setModalAction] = useState('Buy');
    const address = useAddress();
    const characterId = parseInt(id);
    const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('1D');
    const [startTime, setStartTime] = useState<number>(Math.floor(Date.now() / 1000) - 24 * 60 * 60);
    const [showStakeModal, setShowStakeModal] = useState(false);
    const [selectedAttribute, setSelectedAttribute] = useState('');

    const { data: character, isLoading } = useCharacter(characterId);
    const { data: characters } = useCharacters();
    const { data: yourShares } = useCharacterSharesBalance(characterId, address);
    const { data: trades } = useCharacterTrades(characterId);
    const { data: matches } = useCharacterMatches(characterId);
    const { data: performance } = useCharacterPerformance(characterId, startTime);
    const { data: battleState, isLoading: isBattleLoading, isError: isBattleError } = useBattleState(); // Use battleState hook
    const { data: holders } = useCharacterHolders(characterId);

    const convertEthToUsd = useConvertEthToUsd();

    const { data: user } = useUser(address);

    const totalStakes = useMemo(() => {
        return character?.healthStakes + character?.powerStakes + character?.attackStakes + character?.defenseStakes + character?.speedStakes;
    }, [character]);

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

    const handleCloseModal = () => setShowModal(false);
    const handleTimeFrameChange = (timeFrame: TimeFrame) => {
        setSelectedTimeFrame(timeFrame);
    };

    // Function to handle opening the stake modal
    const handleOpenStakeModal = (attribute: string) => {
        setSelectedAttribute(attribute);
        setShowStakeModal(true);
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
    : 'waiting'
    : 'idle';

    // Generate round-robin matchups
    const characterIds = characters?.map(c => c.id.toString()) || [];
    const matchups = generateRoundRobinMatchups(characterIds);
    const totalMatches = matchups.length;

    // Determine the current match index from battleState
    const currentMatchIndex = battleState?.currentMatch ?? 0;

    // Determine the last match index for the character
    const lastMatchIndex = matchups.findIndex(match => match.includes(characterId));

    // Calculate the number of matches left until the next match
    const matchesLeft = matchesUntilNextMatch(currentMatchIndex, lastMatchIndex, totalMatches);

    // Predict the next character that will be fought
    const nextMatchIndex = (currentMatchIndex + matchesLeft) % totalMatches;
    const nextMatch = matchups[nextMatchIndex];
    const nextOpponentId = nextMatch?.find(id => id !== characterId);
    const nextOpponent = characters?.find(c => c.id === nextOpponentId);

    const holderCount = useMemo(() => {
        return holders?.length || 0;
    }, [holders]);

    if (isLoading || isBattleLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

    return (
        <div className="flex flex-col lg:flex-row w-full gap-4 lg:gap-8 items-start justify-center p-2 lg:p-4 min-h-screen">
            <div className="flex flex-col items-center lg:sticky lg:top-8 w-full lg:w-1/4 bg-card p-4 rounded-lg shadow">
                <Avatar className="w-32 h-32 lg:w-48 lg:h-48 mb-4">
                    <AvatarImage src={character.pfp} alt={character.name} />
                    <AvatarFallback>{character.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center mt-2 mb-6">
                    <CardTitle className="text-2xl lg:text-3xl">{character.name}</CardTitle>
                    <CardDescription className="text-lg">Tier {getTier(character.value)}</CardDescription>
                    <StatusBadge status={characterStatus} /> {/* Add StatusBadge here */}
                </div>
                <div className="flex flex-row justify-between gap-10 text-center w-full">
                    <div>
                        <p className="text-sm text-muted-foreground">Wins</p>
                        <p className="text-xl font-bold">{character.winCount}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Loses</p>
                        <p className="text-xl font-bold">{character.lossCount}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Matches</p>
                        <p className="text-xl font-bold">{character.matchCount}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Win odds</p>
                        <p className="text-xl font-bold">{(character?.winCount * 100 / character?.matchCount)?.toFixed(0)}%</p>
                    </div>
                </div>
                <div className="w-full space-y-4">
                    <div className="w-full mt-6 space-y-2">
                        {Object.entries(statIcons).map(([stat, icon]) => (
                            <div key={stat} className="flex justify-between items-center">
                                <span className="flex items-center gap-2">
                                    {icon}
                                    {stat}
                                </span>
                                <span>{character[stat.toLowerCase()]}</span>
                            </div>
                        ))}
                    </div>
                    <div>
                        <p className="text-sm font-medium mb-1">Next Match:</p>
                        <p className="text-sm">In {matchesLeft * 2} min vs {nextOpponent?.name || "Unknown"}</p> {/* Render next match details */}
                    </div>
                </div>
            </div>

            {/* Character info */}
            <div className='w-full lg:w-3/4 space-y-4 lg:space-y-8'>
                <Card>
                    <CardHeader>
                        <CardTitle>Price Chart</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                            <div>
                                <p className="text-sm text-muted-foreground flex items-center">
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    Price
                                </p>
                                <p className="text-xl font-bold">${convertEthToUsd(character.price)}</p>
                                <p className="text-sm text-muted-foreground">{character.price} ETH</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground flex items-center">
                                    <TrendingUp className="w-4 h-4 mr-1" />
                                    24h Change
                                </p>
                                <p className={`text-xl font-bold ${performance > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {performance.toFixed(2)}%
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground flex items-center">
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    Market Cap
                                </p>
                                <p className="text-xl font-bold">${convertEthToUsd(character.value)}</p>
                                <p className="text-sm text-muted-foreground">{character.value} ETH</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground flex items-center">
                                    <Users className="w-4 h-4 mr-1" />
                                    Holders
                                </p>
                                <p className="text-xl font-bold">{holderCount}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground flex items-center">
                                    <Coins className="w-4 h-4 mr-1" />
                                    Supply
                                </p>
                                <p className="text-xl font-bold">{(character.supply)}</p>
                            </div>
                        </div>
                        <div className="">
                            <Chart activities={combinedActivities as any} characterId={characterId} />
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 mb-6">
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
                        </div>
                        <div className="flex space-x-4">
                            <Button className="flex-1 text-lg py-6" onClick={() => handleShowModal('Buy')}>Buy</Button>
                            <Button className="flex-1 text-lg py-6" variant="outline" onClick={() => handleShowModal('Sell')}>Sell</Button>
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
                                        <Button size="sm" onClick={() => handleOpenStakeModal(stat)}>Stake</Button>
                                    </div>
                                    <Progress value={(character[stat.toLowerCase()] / 100) * 100} className="h-4" />
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Total stakes: {character[`${stat.toLowerCase()}Stakes`]} </span>
                                        <span>Your stake: 0 </span>
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
                characterId={character?.id}
                show={showModal}                handleClose={handleCloseModal}
                actionType={modalAction as any}
                characterName={character?.name}
            />

            <ModalStake 
                show={showStakeModal}
                handleClose={() => setShowStakeModal(false)}
                characterId={characterId}
                attribute={selectedAttribute as any}
            />
        </div>
    );
};
