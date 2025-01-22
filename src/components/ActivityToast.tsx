import { useEffect, useRef, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { useActivities } from './ActivityListenerProvider';
import { useCharacters, useUser } from '../hooks/api';
import { SHARES_PER_POINT_BOUGHT } from '@memeclashtv/types';
import { useConvertEthToUsd } from '../EthPriceProvider';
import { formatNumber, formatPercentage } from '../lib/utils';
import { BaseActivity, MatchEndActivity, MatchStartActivity, MatchPendingActivity, TradeActivity, StakeActivity, ChatActivity } from '@memeclashtv/types/activity'
import { useAddress } from '../hooks/user';
import { usePrivy } from '@privy-io/react-auth';
import { Clock } from 'lucide-react';
import { createPortal } from 'react-dom';

const tradesUntilNextPoint = (buySharesAccumulated: number = 0) => {
  return SHARES_PER_POINT_BOUGHT - buySharesAccumulated;
};

export enum ActivityType {
  MatchPending = 'MatchPending',
  MatchStart = 'MatchStart',
  MatchEnd = 'MatchEnd',
  Trade = 'Trade',
  Stake = 'Stake',
  Chat = 'Chat',
}


const DURATION_TOAST_TRADE = 20000;
const DURATION_TOAST_MATCH_PENDING = 20000;
const DURATION_TOAST_MATCH_START = 20000;
const DURATION_TOAST_MATCH_END = 20000;


const formatTime = (seconds: number) => {
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  } else {
    return `${seconds}s`
  }
}

function PendingMatchToast({ 
  char1Name, 
  char2Name, 
  startTime 
}: { 
  char1Name: string, 
  char2Name: string, 
  startTime: number 
}) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, startTime - Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeLeft = Math.max(0, startTime - Date.now() / 1000);
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <span>Buy</span>
        <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse">
          {char1Name}
        </span>
        <span>or</span>
        <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse">
          {char2Name}
        </span>
      </div>
      <div className="flex items-center gap-1 text-yellow-400 font-bold animate-aggressive-pulse">
        <Clock className="w-3 h-3" />
        <span className="animate-glow">{formatTime(Math.floor(timeLeft))} left to buy</span>
      </div>
      
    </div>
  );
}

export const ActivityToast = () => {
  const activities = useActivities();
  const address = useAddress();
  const { authenticated } = usePrivy();
  const { data: user } = useUser(address);
  const { data: characters } = useCharacters();
  const convertEthToUsd = useConvertEthToUsd();
  const lastProcessedTimestampRef = useRef<number>(0);
  const hasShownInitialPointsToastRef = useRef(false);

  // Points reminder toast after sign in
  useEffect(() => {
    if (hasShownInitialPointsToastRef.current || !user?.points) return;

    const timer = setTimeout(() => {
      const remaining = tradesUntilNextPoint(user.points.buySharesAccumulated);
      if (remaining > 0) {
        toast(
          'Start Trading!',
          {
            description: () => (
              <div className="font-bold">
                <span className="text-yellow-400 font-bold">Buy {remaining} </span>
                <span>more shares of any character to earn your</span>
                <span className="text-yellow-400 font-bold"> next point!</span>
                <span className="text-muted-foreground"> and rank up on the leaderboard!</span>
              </div>
            ),
            duration: 10000,
            id: 'initial-points-reminder',
          }
        );
      }
      hasShownInitialPointsToastRef.current = true;
    }, 10000);

    return () => clearTimeout(timer);
  }, [user]);

  // Activity notifications
  useEffect(() => {
    // Wait for authentication, user data, and characters to be ready
    if (!activities?.length || !characters || !authenticated || !user || !address) return;

    let activityToProcess: BaseActivity; // Declare the variable

    // On initial load, find first non-trade activity
    if (lastProcessedTimestampRef.current === 0) {
      const nonTradeActivity = activities.find(activity => activity.type !== ActivityType.Trade);
      if (!nonTradeActivity) return; // If no non-trade activity found, don't process anything
      activityToProcess = nonTradeActivity;
    } else {
      activityToProcess = activities[0];
    }
    
    // Skip if we've already processed this activity
    if (activityToProcess.timestamp <= lastProcessedTimestampRef.current) {
      return;
    }
    
    // Update the last processed timestamp
    lastProcessedTimestampRef.current = activityToProcess.timestamp;

    switch (activityToProcess.type) {
      case ActivityType.Trade: {
        // Only process trades after initial load
        if (lastProcessedTimestampRef.current === 0) return;

        const trade = activityToProcess as TradeActivity;
        const character = characters.find(c => c.id === trade.character);
        const amount = formatNumber(convertEthToUsd(trade.ethAmount));
        
        if (trade.trader && user?.address && 
            trade.trader.toLowerCase() === user?.address.toLowerCase() && 
            user.points) { // Add points check
          
          const remaining = tradesUntilNextPoint(user.points.buySharesAccumulated);
          const toAddIfRemaining = `${remaining} more trades until your next point!`
          toast(`${trade.isBuy ? 'Bought' : 'Sold'} ${trade.shareAmount} ${character?.name} for ${amount} ${remaining > 0 ? `(${toAddIfRemaining})` : ''}`, {
            duration: DURATION_TOAST_TRADE,
            id: `trade-${activityToProcess.timestamp}`,
          });
        }
        break;
      }

      case ActivityType.MatchPending: {
        const matchPending = activityToProcess as MatchPendingActivity;
        const char1 = characters.find(c => c.id === matchPending.p1);
        const char2 = characters.find(c => c.id === matchPending.p2);
        const startTime = matchPending.startTime;
        
        toast.message(
          'Match Starting Soon!',
          {
            description: (
              <PendingMatchToast 
                char1Name={char1?.name || ''} 
                char2Name={char2?.name || ''} 
                startTime={matchPending.startTime}
              />
            ),
            duration: DURATION_TOAST_MATCH_PENDING,
            id: `match-pending-${activityToProcess.timestamp}`,
          }
        );
        break;
      }

      case ActivityType.MatchStart: {
        const matchStart = activityToProcess as MatchStartActivity;
        const char1 = characters.find(c => c.id === matchStart.p1);
        const char2 = characters.find(c => c.id === matchStart.p2);
        
        toast.message(
          'Match Started!',
          {
            description: (
              <span className="font-semibold text-foreground">
                <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse">
                  {char1?.name}
                </span>
                <span> vs </span>
                <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse">
                  {char2?.name}
                </span>
                <span> – </span>
                <span className="text-green-400">Watch the battle now!</span>
                <br/>
                <span className="text-muted-foreground">Winner steals 10% of the loser's market cap - increasing its share price</span>
              </span>
            ),
            duration: DURATION_TOAST_MATCH_START,
            id: `match-start-${activityToProcess.timestamp}`,
          }
        );
        break;
      }

      case ActivityType.MatchEnd: {
        const matchEnd = activityToProcess as MatchEndActivity;
        const winner = characters.find(c => c.id === matchEnd.winner);
        const loser = characters.find(c => c.id === (matchEnd.p1 === matchEnd.winner ? matchEnd.p2 : matchEnd.p1));
        
        const userBalances = user?.balances || [];
        const winnerBalance = userBalances.find(b => b.character === winner?.id)?.balance || 0;
        const loserBalance = userBalances.find(b => b.character === loser?.id)?.balance || 0;

          // Get market caps and prices from token state
          const {
            prevMarketCap1,
            prevMarketCap2,
            prevPrice1,
            prevPrice2,
            newPrice1,
            newPrice2
          } = matchEnd.tokenState;

          // Determine if winner is p1 or p2
          
          const isWinnerP1 = matchEnd.p1 === matchEnd.winner;
          const pricePercentChange = isWinnerP1 ? (newPrice1 - prevPrice1) / prevPrice1 : (newPrice2 - prevPrice2) / prevPrice2;
          const isPlus = pricePercentChange > 0;

          // Calculate winner's value change using correct prices and market cap
          const winnerPreValue = (winnerBalance / winner.supply) * (isWinnerP1 ? prevMarketCap1 : prevMarketCap2);
          const winnerPostValue = winnerPreValue * (1 + (
            (isWinnerP1 ? newPrice1 - prevPrice1 : newPrice2 - prevPrice2) / 
            (isWinnerP1 ? prevPrice1 : prevPrice2)
          ));
          const winnerGain = winnerPostValue - winnerPreValue;

          // Calculate loser's value change using correct prices and market cap
          const loserPreValue = (loserBalance / loser.supply) * (isWinnerP1 ? prevMarketCap2 : prevMarketCap1);
          const loserPostValue = loserPreValue * (1 + (
            (isWinnerP1 ? newPrice2 - prevPrice2 : newPrice1 - prevPrice1) / 
            (isWinnerP1 ? prevPrice2 : prevPrice1)
          ));
          const loserLoss = loserPostValue - loserPreValue;

          const netGain = winnerGain + loserLoss;

          toast.success(
            'Match Ended!',
            {
              description: (
                <span className="font-bold">
                  <span className={isPlus ? 'text-green-400' : 'text-red-400'}>{winner.name} won! </span>
                  <span>price increased to </span>
                  <span className={isPlus ? 'text-green-400' : 'text-red-400'}>
                    {formatNumber(convertEthToUsd(newPrice1))} ({formatPercentage(pricePercentChange)})
                  </span>
                  <br/>
                  {winnerBalance > 0 && (
                    <div className="font-bold">
                      Your <span className="text-yellow-400">{winnerBalance} {winner.name} shares</span> are <span className={winnerGain >= 0 ? 'text-green-400' : 'text-red-400'}>
                       up {formatNumber(convertEthToUsd(winnerGain))} {winnerGain >= 0 ? '↑' : '↓'}
                      </span>
                    </div>
                  )}
                  {loserBalance > 0 && (
                    <div className="font-bold">
                      Your <span className="text-yellow-400">{loserBalance} {loser.name} shares</span> are <span className={loserLoss >= 0 ? 'text-green-400' : 'text-red-400'}>
                        down {formatNumber(convertEthToUsd(loserLoss))} {loserLoss >= 0 ? '↑' : '↓'}
                      </span>
                    </div>
                  )}
                  {winnerBalance > 0 && loserBalance > 0 && (
                    <div className="font-bold">
                      Net gain: <span className={netGain >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {formatNumber(convertEthToUsd(netGain))} {netGain >= 0 ? '↑' : '↓'}
                      </span>
                    </div>
                  )}
                </span>
              ),
              duration: DURATION_TOAST_MATCH_END,
              id: `match-end-${activityToProcess.timestamp}`,
            }
        );
        break;
      }
    }
  }, [activities, user, characters, convertEthToUsd, authenticated, address]);

  // Return null if there's nothing to render
  if (!activities?.length) return null;

  return createPortal(
    <Toaster 
      position="top-center" 
      richColors 
      className="!z-[99999999]" // Increased z-index
      expand
      toastOptions={{
        style: {
          zIndex: 99999999, // Increased z-index
          border: '2px solid transparent',
          borderImage: 'linear-gradient(to right, #ff0000, #ff8000, #ffff00, #00ff00, #0000ff, #4b0082, #8f00ff) 1',
          color: 'hsl(var(--foreground))',
          borderRadius: '2px',
          background: 'hsl(var(--background))',
        },
        descriptionClassName: 'text-muted-foreground',
      }}
    />,
    document.body
  );
}; 