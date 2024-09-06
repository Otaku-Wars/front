import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { ScrollArea } from "./ui/scroll-area"
import useWebSocket from 'react-use-websocket';
import { BaseActivity, MatchPendingActivity, MatchStartActivity, MatchEndActivity, TradeActivity, StakeActivity } from '@memeclashtv/types/activity'
// Type definitions for websocket messages
export enum ActivityType {
    MatchPending = 'MatchPending',
    MatchStart = 'MatchStart',
    MatchEnd = 'MatchEnd',
    Trade = 'Trade',
    Stake = 'Stake',
}

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
          <time dateTime={new Date(activity?.timestamp ?? 0).toISOString()} className="text-xs text-muted-foreground">
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

// Main ActivityBar component
export const ActivityBar = () => {
    const [activities, setActivities] = useState<BaseActivity[]>([]);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    //set 20 dummy activities
    useEffect(() => {
        for (let i = 0; i < 20; i++) {
            setActivities(prevActivities => [...prevActivities, {
                type: ActivityType.MatchPending,
                timestamp: Date.now(),
                p1: i,
                p2: i + 1
            }]);
        }
    }, []);
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

    // Scroll to bottom when activities change
    useEffect(() => {
        //if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        //}
    }, []);

  return (
    <ScrollArea className="max-h-full overflow-y-auto" ref={scrollAreaRef}>
      <div className="p-4 border-b text-center"> {/* Center the header text */}
        <h2 className="text-lg font-semibold">Activity Feed</h2>
      </div>
        <div className="p-4 space-y-2 flex flex-col-reverse"> {/* Reverse the order of activities */}
          {activities.map((activity, index) => (
            <ActivityItem key={index} activity={activity} />
          ))}
        </div>
    </ScrollArea>
  )
}