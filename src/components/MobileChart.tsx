import React, { useMemo, useState, useRef, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatEther, formatNumber, formatPercentage } from '../lib/utils';
import { useConvertEthToUsd } from '../EthPriceProvider';
import { MatchEndActivity, TradeActivity } from '@memeclashtv/types/activity';
import { Character } from '@memeclashtv/types';
import { truncateWallet } from './NavBar';
import { buildDataUrl } from './ActivityBar';
import { cn } from '../lib/utils';
import { haptics } from '../utils/haptics';

type Activity = MatchEndActivity | TradeActivity;

interface ChartProps {
  activities: Activity[];
  characterId: number;
  characters: Character[];
  height?: number;
}

interface TouchState {
  touching: boolean;
  coordinate?: { x: number; y: number };
  payload?: any[];
}

export const MobileChart: React.FC<ChartProps> = ({ 
  activities, 
  characterId, 
  characters,
  height = 200 
}) => {
  const [timeRange, setTimeRange] = useState<string>("1d");
  const convertEthToUsd = useConvertEthToUsd();
  const [touchState, setTouchState] = useState<TouchState>({
    touching: false
  });
  const touchTimeout = useRef<NodeJS.Timeout>();
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const timeRanges = {
    "1h": 60 * 60,
    "4h": 4 * 60 * 60,
    "1d": 24 * 60 * 60,
    "1w": 7 * 24 * 60 * 60,
    "1m": 30 * 24 * 60 * 60,
    "max": Infinity
  };

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
    const filtered = data.filter(point => {
      if (timeRange === "max") return true;
      const cutoffTime = lastTimestamp - timeRanges[timeRange as keyof typeof timeRanges];
      return point.timestamp >= cutoffTime;
    });

    return filtered.length > 0 ? filtered : data;
  }, [activities, timeRange]);

  console.log(chartData);

  const chartColor = useMemo(() => {
    if (chartData.length < 2) return "#4F46E5";
    const startPrice = chartData[0].price;
    const endPrice = chartData[chartData.length - 1].price;
    return startPrice < endPrice ? "#22C55E" : "#EF4444";
  }, [chartData]);

  const handleTouchStart = (e: TouchEvent) => {
    document.body.classList.add('no-selection');
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    
    const timer = setTimeout(() => {
      haptics.light();
      setTouchState(prev => ({ ...prev, touching: true }));
    }, 200);
    
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    document.body.classList.remove('no-selection');
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    setTouchState({ touching: false });
  };

  const handleTouchMove = (e: TouchEvent) => {
    // Prevent scrolling only when tooltip is active
    if (touchState.touching) {
      e.preventDefault();
    }

    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (!touchState.touching) {
      document.body.classList.remove('no-selection');
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    }
  };

  const CustomTooltip = ({ active, payload, coordinate }: any) => {
    if (!active || !payload?.length || !touchState.touching) return null;

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
          absolute w-[200px] transform select-none
          ${shouldFlipVertical ? 'translate-y-0' : '-translate-y-full'}
          ${shouldFlipHorizontal ? '-translate-x-full' : 'translate-x-0'}
        `}
        style={{
          ...getPosition(),
          pointerEvents: 'none', // Prevents tooltip from capturing events
          userSelect: 'none', // Additional selection prevention
          WebkitUserSelect: 'none', // For Safari support
        }}
        onTouchStart={(e) => {
          e.preventDefault(); // Prevent any touch events on tooltip
          e.stopPropagation();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
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

  const getPriceChangeForRange = (data: any[], range: string) => {
    if (data.length < 2) return 0;
    const lastTimestamp = data[data.length - 1].timestamp;
    const cutoffTime = range === "max" ? 0 : lastTimestamp - timeRanges[range as keyof typeof timeRanges];
    
    const filteredData = data.filter(point => point.timestamp >= cutoffTime);
    if (filteredData.length < 1) return 0;
    
    const startPrice = filteredData[0].price;
    const endPrice = filteredData[filteredData.length - 1].price;
    return ((endPrice - startPrice) / startPrice) * 100;
  };

  useEffect(() => {
    return () => {
      if (touchTimeout.current) {
        clearTimeout(touchTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    // Handler to prevent scrolling on parent elements
    const preventScroll = (e: TouchEvent) => {
      if (touchState.touching && chartRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    // Add event listener with passive: false to allow preventDefault
    document.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventScroll);
    };
  }, [touchState.touching]);

  return (
    <div className="w-full">
      {/* Chart */}
      <div 
        ref={chartRef}
        onTouchStart={handleTouchStart as any}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove as any}
        style={{ height: `${height}px` }}
        className="w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={chartData} 
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={chartColor} stopOpacity={0.01}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="timestamp" 
              type="number" 
              domain={['dataMin', 'dataMax']} 
              hide 
            />
            <YAxis 
              hide 
              domain={['dataMin - dataMin * 0.3', 'dataMax + dataMax * 0.1']}
              padding={{ top: 20, bottom: 20 }}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={touchState.touching ? { stroke: '#ddd' } : false}
              position={{ x: 0, y: 0 }}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={chartColor}
              fillOpacity={1}
              fill="url(#colorPrice)"
              strokeWidth={1.5}
              activeDot={touchState.touching ? { r: 4, fill: chartColor } : false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Updated Time Range Buttons */}
      <div className="flex justify-between w-full gap-1 p-1">
        {["1H", "4H", "1D", "1W", "1M", "MAX"].map(range => {
          const rangeKey = range.toLowerCase();
          const priceChange = getPriceChangeForRange(chartData, rangeKey);
          const isPositive = priceChange >= 0;
          
          return (
            <button
              key={range}
              onClick={() => {
                haptics.medium();
                setTimeRange(rangeKey);
              }}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                timeRange === rangeKey
                  ? cn(
                      "text-white",
                      isPositive ? "bg-green-500" : "bg-red-500"
                    )
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {range}
            </button>
          );
        })}
      </div>
    </div>
  );
}; 