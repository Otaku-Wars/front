import React, { useMemo, useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatEther, formatNumber } from '../lib/utils';
import { useConvertEthToUsd } from '../EthPriceProvider';
import { MatchEndActivity, TradeActivity } from '@memeclashtv/types/activity';
import { Character, User } from '@memeclashtv/types';
import { truncateWallet } from './NavBar';
import { buildDataUrl } from './ActivityBar';
import { haptics } from '../utils/haptics';

enum ActivityType {
    MatchEnd = 'MatchEnd',
    Trade = 'Trade',
}

interface BaseActivity {
    type: ActivityType;
    timestamp: number;
}

type Activity = MatchEndActivity | TradeActivity;

interface ChartDataPoint {
    timestamp: number;
    price: number;
    activity: 'MatchEnd' | 'Trade';
    change: number;
    event: Activity;
}

interface ChartProps {
    activities: Activity[];
    characterId: number;
    characters: Character[];
}

export const Chart: React.FC<ChartProps> = ({ activities, characterId, characters }) => {
    const [timeRange, setTimeRange] = useState<string>("all");
    const convertEthToUsd = useConvertEthToUsd();
    const chartData = useMemo(() => {
        const sortedActivities = activities.sort((a, b) => a.timestamp - b.timestamp);
        const data: ChartDataPoint[] = sortedActivities.map(activity => {
            const isMatchEnd = activity.type === ActivityType.MatchEnd;
            const price = isMatchEnd ? 
                characterId == (activity as MatchEndActivity).p1 ? 
                    (activity as MatchEndActivity).tokenState.newPrice1 : 
                    (activity as MatchEndActivity).tokenState.newPrice2 : 
                activity.newPrice;
            const oldPrice = isMatchEnd ? 
                characterId == (activity as MatchEndActivity).p1 ? 
                    (activity as MatchEndActivity).tokenState.prevPrice1 : 
                    (activity as MatchEndActivity).tokenState.prevPrice2 : 
                activity.prevPrice;
            return {
                timestamp: activity.timestamp,
                price: price,
                change: price - oldPrice,
                activity: activity.type,
                event: activity,
            }
        });

        if (timeRange === "all") {
            return data;
        }

        // Filter data based on selected time range
        const lastTimestamp = data[data.length - 1]?.timestamp || Date.now()/1000;
        const timeRanges = {
            "1h": 60 * 60,
            "1d": 24 * 60 * 60,
            "1w": 7 * 24 * 60 * 60,
            "1m": 30 * 24 * 60 * 60,
        };
        const filteredData = data.filter(point => point.timestamp >= lastTimestamp - timeRanges[timeRange]);

        return filteredData.length > 0 ? filteredData : data;
    }, [activities, timeRange]);

    const yAxisDomain = useMemo(() => {
        const prices = chartData.map(d => d.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        return [Math.max(0, minPrice - (minPrice*0.1)), maxPrice + (maxPrice*0.5)];
    }, [chartData]);

    const chartColor = useMemo(() => {
        if (chartData.length < 2) return "#6366f1"; // Default color (indigo)
        const startPrice = chartData[0].price;
        const endPrice = chartData[chartData.length - 1].price;
        return startPrice < endPrice ? "#22c55e" : "#ef4444"; // Green for up, red for down
    }, [chartData]);

    const CustomTooltip = ({ active, payload }: any) => {
        useEffect(() => {
            if (active) {
                haptics.light();
            }
        }, [active]);

        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const price = data.price;
            const isPositive = data.change >= 0;
            const percentChange = ((data.change / (data.price - data.change)) * 100).toFixed(2);
            const event = data.event;
            console.log("bbcccdd", event)
            return (
                <div className="bg-gray-800 p-4 rounded shadow-md border border-gray-700 text-xl">
                    <div className="flex items-center gap-2 mb-1">
                        <p className={`text-3xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {formatNumber(convertEthToUsd(price))}
                        </p>
                        <p className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}{formatNumber(convertEthToUsd(data.change))} ({isPositive ? '+' : ''}{percentChange}%)
                        </p>
                    </div>
                    <p className="text-gray-400 text-[10px] mb-2">{new Date(data.timestamp * 1000).toLocaleString()}</p>
                    {event.type === "trade" && (() => {
                        const character = characters.find(c => c.id === event?.character);
                        const traderUsername = event?.trader ? truncateWallet(event?.trader) : "";
                        const traderPfp = buildDataUrl(event?.trader ?? "")
                        console.log("bbcccdd", event)
                        return (
                            <div className="flex items-center text-gray-300 gap-1">
                                <img
                                    src={ traderPfp|| '/placeholder.svg'}
                                    alt={traderUsername || 'Trader'}
                                    className="rounded-full border  w-5 h-5 object-cover"
                                />
                                <span className='font-bold'>{traderUsername}</span>
                                <span className={event.isBuy ? 'text-green-400' : 'text-red-400'}>
                                    {event.isBuy ? "bought" : "sold"}
                                </span>
                                <span>{event.shareAmount}</span>
                                <img
                                    src={character?.pfp || '/placeholder.svg'}
                                    alt={character?.name || 'Character'}
                                    className="rounded-full border w-5 h-5 object-cover"
                                />
                                <span className='font-bold'>{character?.name}</span>
                                <span>for <span className={!event.isBuy ? 'text-red-400' : 'text-green-400'}>{formatNumber(convertEthToUsd(event.ethAmount))}</span></span>
                            </div>
                        );
                    })()}
                    {event.type === "MatchEnd" && (() => {
                        const character1 = characters.find(c => c.id === characterId)
                        const isP1 = characterId == event?.p1;
                        const character2Id = isP1 ? event.p2 : event.p1;
                        const character2 = characters.find(c => c.id === character2Id);
                        const isWin = characterId == event?.winner;
                        const reward = event?.tokenState?.reward;
                        console.log("bbcccdd", event)
                        return (
                            <div className="flex items-center text-gray-300 gap-1">
                                <img
                                    src={character1?.pfp || '/placeholder.svg'}     
                                    alt={character1?.name || 'Character'}
                                    className="rounded-full border  w-5 h-5 object-cover"
                                />
                                <span className='font-bold'>{character1?.name}</span>
                                <span className={isWin ? 'text-green-400' : 'text-red-400'}>
                                    {isWin ? "beat" : "lost to"}
                            </span>
                            <img
                                src={character2?.pfp || '/placeholder.svg'}
                                alt={character2?.name || 'Opponent'}
                                className="rounded-full border  w-5 h-5 object-cover"
                            />
                            <span className='font-bold'>{character2?.name}</span>
                            <span>and</span>
                            <span className={isWin ? 'text-green-400' : 'text-red-400'}>
                                {isWin ? "gained" : "lost"}
                            </span>
                            <span className={isWin ? 'text-green-400' : 'text-red-400'}>
                                {formatNumber(convertEthToUsd(Math.abs(reward)))}
                            </span>
                            <span>in market cap</span>
                            </div>
                        );
                    })()}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full space-y-4">
            <div className="h-[400px] bg-gray-900 rounded-lg  border border-gray-700">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColor} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} hide />
                        <YAxis domain={yAxisDomain} tickCount={10} hide />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="price"
                            stroke={chartColor}
                            fillOpacity={1}
                            fill="url(#colorPrice)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="w-full grid grid-cols-5 gap-2">
                {["1h", "1d", "1w", "1m", "all"].map(range => (
                    <button
                        key={range}
                        onClick={() => {
                            haptics.medium();
                            setTimeRange(range);
                        }}
                        className={`w-full py-2 ${timeRange === range ? 'bg-gray-700 text-white' : 'bg-gray-800'}`}
                        aria-label={`Toggle ${range} view`}
                    >
                        {range.toUpperCase()}
                    </button>
                ))}
            </div>
        </div>
    );
};