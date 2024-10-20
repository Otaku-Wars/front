import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatEther, formatNumber } from '../lib/utils';
import { useConvertEthToUsd } from '../EthPriceProvider';
import { MatchEndActivity, TradeActivity } from '@memeclashtv/types/activity';

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
}

interface ChartProps {
    activities: Activity[];
    characterId: number;
}

export const Chart: React.FC<ChartProps> = ({ activities, characterId }) => {
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
            return {
                timestamp: activity.timestamp,
                price: price,
                activity: activity.type,
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

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-gray-800 p-2 rounded shadow-md border border-gray-700">
                    <p className="font-bold">{new Date(data.timestamp*1000).toLocaleString()}</p>
                    <p>Price: {formatEther(data.price)} ({formatNumber(convertEthToUsd(data.price))})</p>
                    <p>Activity: {data.activity}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full space-y-4">
            <div className="h-[400px] bg-gray-900 rounded-lg border border-gray-700 bg">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColor} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} hide />
                        <YAxis domain={yAxisDomain} hide />
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
                        onClick={() => setTimeRange(range)}
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