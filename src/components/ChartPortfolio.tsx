import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatNumber } from '../lib/utils';
import { PortfolioEntry, PortfolioTradeEvent, PortfolioMatchEvent } from '@memeclashtv/types';
import { useConvertEthToUsd } from '../EthPriceProvider';
import { useMatch, useTrade } from '../hooks/api';

// Define the structure of each data point for the chart
interface ChartDataPoint {
    timestamp: number;
    portfolioValue: number;
    change: number;
    eventId: number;
    event: PortfolioMatchEvent | PortfolioTradeEvent;
}

// Define the props for the ChartPortfolio component
interface ChartPortfolioProps {
    portfolioEntries: PortfolioEntry[];
}

// Component to render PortfolioTradeEvent and PortfolioMatchEvent
const PortfolioEventComponent = ({ event }: { event: PortfolioMatchEvent | PortfolioTradeEvent }) => {
    if (event.type === "PortfolioTradeEvent") {
        return (
            <div>
                <p><strong>Trade Event</strong></p>
                <p>Trader: {event.trader}</p>
                <p>Character ID: {event.character}</p>
                <p>Action: {event.isBuy ? 'Buy' : 'Sell'}</p>
                <p>Amount: {formatNumber(event.amount)} ETH</p>
                <p>Cost: {formatNumber(event.cost)} USD</p>
            </div>
        );
    }

    return (
        <div>
            <p><strong>Match Event</strong></p>
            <p>Character ID: {event.character}</p>
            <p>Result: {event.isWin ? 'Win' : 'Loss'}</p>
            <p>Reward: {formatNumber(event.reward)} ETH</p>
            <p>Final Price: {formatNumber(event.finalPrice)} USD</p>
        </div>
    );
};

// Custom tooltip for displaying detailed information
const CustomTooltip = ({ active, payload, label }: any) => {
    const convertEthToUsd = useConvertEthToUsd();
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const timestamp = data.timestamp;

        return (
            <div className="bg-gray-800 p-4 rounded shadow-md border border-gray-700">
                <p className="font-bold">{new Date(timestamp * 1000).toLocaleString()}</p>
                <p>Portfolio Value: {formatNumber(convertEthToUsd(data.portfolioValue))}</p>
                <PortfolioEventComponent event={data.event} />
            </div>
        );
    }
    return null;
};

export const ChartPortfolio: React.FC<ChartPortfolioProps> = ({ portfolioEntries }) => {
    const [timeRange, setTimeRange] = useState<string>("all");

    // Prepare the chart data by calculating the cumulative portfolio value
    const chartData = useMemo(() => {
        if (!portfolioEntries) return [];
        // Sort the entries by timestamp latest to earliest
        const sortedEntries = [...portfolioEntries]

        // Initialize the portfolio value
        let cumulativeValue = 0;

        // Map each entry to a chart data point
        const data: ChartDataPoint[] = sortedEntries.map(entry => {
            console.log("running ChartDataPoint")
            cumulativeValue += entry.change;
            return {
                timestamp: entry.timestamp,
                portfolioValue: cumulativeValue,
                change: entry.change,
                eventId: entry.eventId,
                event: entry.event
            };
        });

        if (timeRange === "all") {
            return data;
        }

        // Define the time ranges in seconds
        const lastTimestamp = data[data.length - 1]?.timestamp || Date.now() / 1000;
        const timeRanges: { [key: string]: number } = {
            "1h": 60 * 60,
            "1d": 24 * 60 * 60,
            "1w": 7 * 24 * 60 * 60,
            "1m": 30 * 24 * 60 * 60,
        };

        // Filter the data based on the selected time range
        const filteredData = data.filter(point => point.timestamp >= lastTimestamp - timeRanges[timeRange]);

        return filteredData.length > 0 ? filteredData : data;
    }, [portfolioEntries, timeRange]);

    // Determine the Y-axis domain based on the portfolio values
    const yAxisDomain = useMemo(() => {
        const values = chartData.map(d => d.portfolioValue);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        return [Math.max(0, minValue - Math.abs(minValue * 0.1)), maxValue + Math.abs(maxValue * 0.1)];
    }, [chartData]);

    // Determine the chart color based on the trend
    const chartColor = useMemo(() => {
        if (chartData.length < 2) return "#6366f1"; // Default color (indigo)
        const startValue = chartData[0].portfolioValue;
        const endValue = chartData[chartData.length - 1].portfolioValue;
        return startValue < endValue ? "#22c55e" : "#ef4444"; // Green for up, red for down
    }, [chartData]);

    return (
        <div className="w-full space-y-4">
            <div className="h-[400px] bg-gray-900 rounded-lg border border-gray-700">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColor} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis 
                            dataKey="timestamp" 
                            type="number" 
                            domain={['dataMin', 'dataMax']} 
                            tickFormatter={(unixTime) => new Date(unixTime * 1000).toLocaleDateString()}
                            hide={false}
                        />
                        <YAxis 
                            domain={yAxisDomain} 
                            tickFormatter={(value) => `${value} ETH`} 
                            hide={false} 
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="portfolioValue"
                            stroke={chartColor}
                            fillOpacity={1}
                            fill="url(#colorPortfolio)"
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
