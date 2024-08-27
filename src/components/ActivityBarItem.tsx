import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { ScrollArea } from "./ui/scroll-area"
import { ActivityType, BaseActivity, MatchPendingActivity, MatchStartActivity, MatchEndActivity, TradeActivity, StakeActivity } from '@memeclashtv/types/activity'
import useWebSocket from 'react-use-websocket';

// Helper function to format timestamps
const formatTime = (timestamp: number) => format(new Date(timestamp), 'HH:mm:ss')

// Activity renderer component
const ActivityItem = ({ activity }: { activity: BaseActivity }) => {
  const renderContent = () => {
    switch (activity.type) {
      case ActivityType.MatchPending:
        const matchPending = activity as MatchPendingActivity
        return (
          <p>Match pending between Player {matchPending.p1} and Player {matchPending.p2}</p>
        )

      case ActivityType.MatchStart:
        const matchStart = activity as MatchStartActivity
        return (
          <p>Match {matchStart.id} started: Player {matchStart.p1} vs Player {matchStart.p2}</p>
        )

      case ActivityType.MatchEnd:
        const matchEnd = activity as MatchEndActivity
        return (
          <p>Match {matchEnd.id} ended. Winner: Player {matchEnd.winner}</p>
        )

      case ActivityType.Trade:
        const trade = activity as TradeActivity
        return (
          <p>{trade.trader} {trade.isBuy ? 'bought' : 'sold'} {trade.shareAmount} shares of Character {trade.character}</p>
        )

      case ActivityType.Stake:
        const stake = activity as StakeActivity
        return (
          <p>{stake.staker} staked {stake.amount} on Character {stake.character}'s {stake.attribute} attribute</p>
        )

      default:
        return <p>Unknown activity type</p>
    }
  }

  return (
    <Card className="mb-2">
      <CardContent className="p-3">
        <div className="flex justify-between items-center mb-1">
          <Badge variant="outline" className="text-xs">
            {activity.type}
          </Badge>
          <time dateTime={new Date(activity.timestamp).toISOString()} className="text-xs text-muted-foreground">
            {formatTime(activity.timestamp)}
          </time>
        </div>
        <div className="text-sm">
          {renderContent()}
        </div>
      </CardContent>
    </Card>
  )
}

// Dummy data
const dummyActivities: BaseActivity[] = [
  {
    type: ActivityType.MatchPending,
    timestamp: Date.now() - 300000,
    p1: 1,
    p2: 2,
    duration: 180,
    startTime: Date.now() - 240000,
  } as MatchPendingActivity,
  {
    type: ActivityType.MatchStart,
    timestamp: Date.now() - 240000,
    id: 1,
    p1: 1,
    p2: 2,
  } as MatchStartActivity,
  {
    type: ActivityType.Trade,
    timestamp: Date.now() - 180000,
    trader: '0x1234...5678',
    character: 3,
    isBuy: true,
    shareAmount: 100,
    ethAmount: 0.5,
    prevPrice: 0.01,
    newPrice: 0.0105,
    prevMarketCap: 10000,
    newMarketCap: 10500,
  } as TradeActivity,
  {
    type: ActivityType.Stake,
    timestamp: Date.now() - 120000,
    staker: '0xabcd...ef01',
    character: 2,
    attribute: 1,
    amount: 50,
    prevAttribute: 100,
    newAttribute: 150,
  } as StakeActivity,
  {
    type: ActivityType.MatchEnd,
    timestamp: Date.now() - 60000,
    id: 1,
    p1: 1,
    p2: 2,
    state1: { health: 80, power: 90, attack: 85, defense: 75, speed: 70 },
    state2: { health: 0, power: 85, attack: 80, defense: 70, speed: 75 },
    winner: 1,
    tokenState: {
      prevPrice1: 0.01, newPrice1: 0.012,
      prevPrice2: 0.015, newPrice2: 0.014,
      prevMarketCap1: 10000, newMarketCap1: 12000,
      prevMarketCap2: 15000, newMarketCap2: 14000,
      reward: 1000,
    },
  } as MatchEndActivity,
]

// Main ActivityBar component
export const ActivityBar = () => {
    const [activities, setActivities] = useState<BaseActivity[]>([]);
    
    // WebSocket URL
    const socketUrl = import.meta.env.VITE_WS_API_URL as string;

    // Use the useWebSocket hook to connect to the WebSocket
    const { lastMessage } = useWebSocket(socketUrl, {
        onMessage: (message) => console.log('WebSocket message received:', message),
        onOpen: () => console.log('WebSocket connection opened'),
        onClose: () => console.log('WebSocket connection closed'),
        onError: (error) => console.error('WebSocket error:', error),
        shouldReconnect: () => true, // Will attempt to reconnect on all close events
    });

    // Handle incoming messages
    useEffect(() => {
        if (lastMessage !== null) {
            setActivities(prevActivities => [JSON.parse(lastMessage.data), ...prevActivities]);
        }
    }, [lastMessage]);

  return (
    <div className="w-full max-w-sm h-100 bg-background border-l">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Activity Feed</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="p-4 space-y-2">
          {activities.map((activity, index) => (
            <ActivityItem key={index} activity={activity} />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}