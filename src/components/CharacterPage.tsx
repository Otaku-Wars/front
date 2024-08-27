import React, { useEffect, useMemo, useState } from 'react';
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
import { useCharacter, useCharacterTrades, useCharacterPerformance, useCharacters, useCharacterMatches, useUser } from '../hooks/api';
import { useCharacterSharesBalance } from '../hooks/contract';
import { useAddress } from '../hooks/user';
import { convertEthToUsd } from './CharacterList';
import { Chart } from './Chart';
import { MatchEndActivity, TradeActivity } from '@memeclashtv/types/activity';
import ModalStake from './ModalStake'; // Adjust the path as necessary
import { Attribute } from '@memeclashtv/types';

type TimeFrame = 'Live' | '1D' | '1W' | '1M' | '3M' | 'YTD' | '1Y' | 'ALL';

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

    if (isLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center space-x-4">
                        <Avatar className="w-20 h-20">
                            <AvatarImage src={character?.pfp} alt={character?.name} />
                            <AvatarFallback>{character?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle>{character?.name}</CardTitle>
                            <CardDescription>Tier S</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Price</p>
                                <p className="text-2xl font-bold">${convertEthToUsd(character?.price)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">24h Change</p>
                                <p className={`text-2xl font-bold ${performance > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {performance?.toFixed(2)}%
                                </p>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Button onClick={() => handleShowModal('Buy')}>Buy</Button>
                            <Button variant="outline" onClick={() => handleShowModal('Sell')}>Sell</Button>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.keys(Attribute)
                            .filter((stat) => stat.length > 1)
                            .map((stat) => (
                                <div key={stat} className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span>{stat}</span>
                                        <Button onClick={() => handleOpenStakeModal(Attribute[stat])}>Stake</Button>
                                    </div>
                                    <Progress value={(character[stat.toLowerCase()] / 1090) * 100} />
                                    <div className="flex justify-between text-sm">
                                        <span>Total stakes: {characterStakes[stat]} </span>
                                        <span>Your stake: {yourStakes[stat]} </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Price Chart</CardTitle>
                </CardHeader>
                <CardContent>
                    <Chart activities={combinedActivities} characterId={characterId} />
                    <div className="flex justify-center space-x-2 mt-4">
                        {(['Live', '1D', '1W', '1M', '3M', 'YTD', '1Y', 'ALL'] as TimeFrame[]).map((timeFrame) => (
                            <Button
                                key={timeFrame}
                                variant={selectedTimeFrame === timeFrame ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedTimeFrame(timeFrame)}
                            >
                                {timeFrame}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

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

            <ModalBuySell 
                characterId={character?.id}
                show={showModal} 
                handleClose={handleCloseModal} 
                actionType={modalAction} 
                characterName={character?.name}
            />

            <ModalStake 
                show={showStakeModal} 
                handleClose={() => setShowStakeModal(false)} 
                characterId={characterId} 
                attribute={selectedAttribute} 
            />
        </div>
    );
};
