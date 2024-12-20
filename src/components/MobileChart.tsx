import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatEther, formatNumber, formatPercentage } from '../lib/utils';
import { useConvertEthToUsd } from '../EthPriceProvider';
import { MatchEndActivity, TradeActivity } from '@memeclashtv/types/activity';
import { Character } from '@memeclashtv/types';
import { truncateWallet } from './NavBar';
import { buildDataUrl } from './ActivityBar';

type Activity = MatchEndActivity | TradeActivity;

interface ChartProps {
  activities: Activity[];
  characterId: number;
  characters: Character[];
  height?: number;
}

export const MobileChart: React.FC<ChartProps> = ({ 
  activities, 
  characterId, 
  characters,
  height = 200 
}) => {
  const [timeRange, setTimeRange] = useState<string>("1d");
  const convertEthToUsd = useConvertEthToUsd();

  const chartData = useMemo(() => {
    const sortedActivities = activities.sort((a, b) => a.timestamp - b.timestamp);
    const data = sortedActivities.map(activity => {
      const isMatchEnd = 'p1' in activity;
      const price = isMatchEnd ? 
        characterId === activity.p1 ? 
          activity.tokenState.newPrice1 : 
          activity.tokenState.newPrice2 : 
        activity.newPrice;
      const oldPrice = isMatchEnd ? 
        characterId === activity.p1 ? 
          activity.tokenState.prevPrice1 : 
          activity.tokenState.prevPrice2 : 
        activity.prevPrice;
      return {
        timestamp: activity.timestamp,
        price,
        change: price - oldPrice,
        activity: isMatchEnd ? 'MatchEnd' : 'Trade',
        event: activity,
      };
    });

    if (timeRange === "all") return data;

    const lastTimestamp = data[data.length - 1]?.timestamp || Date.now()/1000;
    const timeRanges = {
      "1h": 60 * 60,
      "1d": 24 * 60 * 60,
      "1w": 7 * 24 * 60 * 60,
      "1m": 30 * 24 * 60 * 60,
    };
    
    const filtered = data.filter(point => 
      point.timestamp >= lastTimestamp - timeRanges[timeRange]
    );

    return filtered.length > 0 ? filtered : data;
  }, [activities, timeRange]);

  const chartColor = useMemo(() => {
    if (chartData.length < 2) return "#4F46E5";
    const startPrice = chartData[0].price;
    const endPrice = chartData[chartData.length - 1].price;
    return startPrice < endPrice ? "#22C55E" : "#EF4444";
  }, [chartData]);

  const CustomTooltip = ({ active, payload, coordinate }: any) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;
    const isPositive = data.change >= 0;
    const percentChange = ((data.change / (data.price - data.change)));
    const event = data.event;

    // Get chart container dimensions
    const chartContainer = document.querySelector('.recharts-wrapper');
    const chartWidth = chartContainer?.clientWidth || window.innerWidth;
    const chartHeight = chartContainer?.clientHeight || 200;

    // Calculate if tooltip should flip
    const shouldFlipVertical = (coordinate?.y || 0) < chartHeight / 2;
    const shouldFlipHorizontal = (coordinate?.x || 0) > chartWidth / 2;

    const getPosition = () => {
      return {
        left: coordinate?.x || 0,
        top: (coordinate?.y || 0) + (shouldFlipVertical ? 10 : -10),
      };
    };

    return (
      <div 
        className={`
          bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-100 
          absolute w-[200px] transform 
          ${shouldFlipVertical ? 'translate-y-0' : '-translate-y-full'}
          ${shouldFlipHorizontal ? '-translate-x-full' : 'translate-x-0'}
        `}
        style={getPosition()}
      >
        <div className="flex flex-col gap-2">
          <div>
            <p className={`text-base font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {formatNumber(convertEthToUsd(data.price))} <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>({isPositive ? '+' : ''}{formatPercentage(percentChange)})</span>
            </p>
        
            <p className="text-[11px] text-gray-500">
              {new Date(data.timestamp * 1000).toLocaleString()}
            </p>
          </div>

          {/* Trade Event Details */}
          {event.type === "trade" && (() => {
            const character = characters.find(c => c.id === event?.character);
            const traderUsername = event?.trader ? truncateWallet(event?.trader) : "";
            const traderPfp = buildDataUrl(event?.trader ?? "");
            
            return (
              <div className="flex flex-wrap items-center text-gray-600 gap-x-1 text-xs">
                <img
                  src={traderPfp || '/placeholder.svg'}
                  alt={traderUsername}
                  className="w-3 h-3 rounded-full border"
                />
                <span className="font-medium">{traderUsername}</span>
                <span className={event.isBuy ? 'text-green-600' : 'text-red-600'}>
                  {event.isBuy ? "bought" : "sold"}
                </span>
                <span>{event.shareAmount}</span>
                <img
                  src={character?.pfp || '/placeholder.svg'}
                  alt={character?.name}
                  className="w-3 h-3 rounded-full border"
                />
                <span className="font-medium">{character?.name}</span>
                <span>for</span>
                <span className={!event.isBuy ? 'text-red-600' : 'text-green-600'}>
                {formatNumber(convertEthToUsd(event.ethAmount))}
                </span>
              </div>
            );
          })()}

          {/* Match Event Details */}
          {event.type === "MatchEnd" && (() => {
            const character1 = characters.find(c => c.id === characterId);
            const isP1 = characterId === event?.p1;
            const character2Id = isP1 ? event.p2 : event.p1;
            const character2 = characters.find(c => c.id === character2Id);
            const isWin = characterId === event?.winner;
            const reward = event?.tokenState?.reward;
            
            return (
              <div className="flex flex-wrap items-center text-gray-600 gap-x-1 text-xs">
                <img
                  src={character1?.pfp || '/placeholder.svg'}
                  alt={character1?.name}
                  className="w-3 h-3 rounded-full border"
                />
                <span className="font-medium">{character1?.name}</span>
                <span className={isWin ? 'text-green-600' : 'text-red-600'}>
                  {isWin ? "won" : "lost"}
                </span>
                <span>vs</span>
                <img
                  src={character2?.pfp || '/placeholder.svg'}
                  alt={character2?.name}
                  className="w-3 h-3 rounded-full border"
                />
                <span className="font-medium">{character2?.name}</span>
                <span className={isWin ? 'text-green-600' : 'text-red-600'}>
                  {isWin ? '+' : '-'} {formatNumber(convertEthToUsd(Math.abs(reward)))} <span className="text-xs text-muted-foreground">mcap</span>
                </span>
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Chart */}
      <div className={`w-full h-[${height}px]`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: -5, left: -5, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={chartColor} stopOpacity={0.01}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#f0f0f0" 
              vertical={false} 
            />
            <XAxis 
              dataKey="timestamp" 
              type="number" 
              domain={['dataMin', 'dataMax']} 
              hide 
            />
            <YAxis hide />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: '#ddd' }}
              position={{ x: 0, y: 0 }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={chartColor}
              fillOpacity={1}
              fill="url(#colorPrice)"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Time Range Buttons */}
      <div className="flex justify-between w-full gap-1 p-1">
        {["1h", "1d", "1w", "1m", "all"].map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`
              px-3 py-1 text-xs font-medium transition-all w-full
              ${timeRange === range 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {range.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}; 