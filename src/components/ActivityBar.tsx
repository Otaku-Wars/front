import { useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { ScrollArea, ScrollBar } from "./ui/scroll-area"
import { BaseActivity, MatchEndActivity, MatchStartActivity, MatchPendingActivity, TradeActivity, StakeActivity } from '@memeclashtv/types/activity'
import { Character } from '@memeclashtv/types';
import { useCharacters } from '../hooks/api';
import { formatNumber } from '../lib/utils';
import { useConvertEthToUsd } from '../EthPriceProvider';
import { statIcons } from './CharacterPage';
import { useActivities } from './ActivityListenerProvider'

export enum ActivityType {
  MatchPending = 'MatchPending',
  MatchStart = 'MatchStart',
  MatchEnd = 'MatchEnd',
  Trade = 'Trade',
  Stake = 'Stake',
}

// Helper function to format timestamps do month day year. last 2 digits of year
const formatTime = (timestamp: number) => format(new Date(timestamp), 'MMM d, yy HH:mm:ss')

// Activity renderer component
const ActivityItem = ({ activity, characters, convertEthToUsd }: { activity: BaseActivity, characters: Character[], convertEthToUsd: any}) => {
  const renderContent = () => {
    switch (activity.type) {
      case ActivityType.MatchPending:
        const matchPending = activity as MatchPendingActivity
        const character1 = characters?.find(c => c.id === matchPending.p1);
        const character2 = characters?.find(c => c.id === matchPending.p2);
        return (
          <span>Match pending between <img src={character1?.pfp} alt={character1?.name} className="w-4 h-4 inline-flex rounded-full object-cover border-2 border-gray-700" /> <span className='underline'>{character1?.name}</span> and <img src={character2?.pfp} alt={character2?.name} className="w-4 h-4 inline-flex rounded-full object-cover border-2 border-gray-700" /> <span className='underline'>{character2?.name}</span></span>
        )

      case ActivityType.MatchStart:
        const matchStart = activity as MatchStartActivity
        const character1Match = characters?.find(c => c.id === matchStart.p1);
        const character2Match = characters?.find(c => c.id === matchStart.p2);
        return (
          <span>Match {matchStart.id} started: <img src={character1Match?.pfp} alt={character1Match?.name} className="w-4 h-4 inline-flex rounded-full object-cover border-2 border-gray-700" /> <span className='underline'>{character1Match?.name}</span> vs <img src={character2Match?.pfp} alt={character2Match?.name} className="w-4 h-4 inline-flex rounded-full object-cover border-2 border-gray-700" /> <span className='underline'>{character2Match?.name}</span></span>
        )

      case ActivityType.MatchEnd:
        const matchEnd = activity as MatchEndActivity
        const winnerIsP1 = matchEnd?.p1 == matchEnd?.winner;
        const winnerPrice = winnerIsP1 ? 
        formatNumber(convertEthToUsd(matchEnd?.tokenState?.newPrice1)):
        formatNumber(convertEthToUsd(matchEnd?.tokenState?.newPrice2))
        const winnerCharacter = characters?.find(c => c.id === matchEnd?.winner);
        const loserCharacter = characters?.find(c => c.id === (winnerIsP1 ? matchEnd?.p2 : matchEnd?.p1));
        return (
          <span>
            Match results: <img src={winnerCharacter?.pfp} alt={winnerCharacter?.name} className="w-4 h-4 inline-flex rounded-full object-cover border-2 border-gray-700" /> <span className='underline'>{winnerCharacter?.name}</span> won against <img src={loserCharacter?.pfp} alt={loserCharacter?.name} className="w-4 h-4 inline-flex rounded-full object-cover border-2 border-gray-700" /> <span className='underline'>{loserCharacter?.name}</span> {" "} share price went to <span className="text-green-500">{winnerPrice}</span>
          </span>
        )

      case ActivityType.Trade:
        const trade = activity as TradeActivity
        const character = characters?.find(c => c.id === trade.character);
        const cost = formatNumber(convertEthToUsd(trade?.ethAmount));
        const amount = trade?.shareAmount;
        return (
          <p>
            <span className='underline'>{trade.trader}</span> <span className={trade.isBuy ? "text-green-500" : "text-red-500"}>{trade.isBuy ? 'bought' : 'sold'}</span> {amount} shares of <img src={character?.pfp} alt={character?.name} className="w-4 h-4 inline-flex rounded-full object-cover border-2 border-gray-700" /> <span className='underline'>{character?.name}</span> for <span className='text-green-500'>{cost}</span>
          </p>
        )

      case ActivityType.Stake:
        const stake = activity as StakeActivity
        const characterStake = characters?.find(c => c.id === stake.character);

        return (
          <p><span className='underline'>{stake.staker}</span> staked {stake.amount} on <img src={characterStake?.pfp} alt={characterStake?.name} className="w-4 h-4 inline-flex rounded-full object-cover border-2 border-gray-700" /> <span className='underline'>{characterStake?.name}</span>'s towards {statIcons[stake.attribute]} attribute</p>
        )

      default:
        return <p>Unknown activity type</p>
    }
  }

  return (
    <div className="inline-block mr-2 mb-2">
      <span className="text-xs text-muted-foreground mr-1">
        {formatTime(activity.timestamp*1000)}
      </span>
      <span className="text-sm">
        {renderContent()}
      </span>
    </div>
  )
}

// Main ActivityBar component
export const ActivityBar = () => {
    const activities = useActivities();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const converEthToUsd = useConvertEthToUsd();
    const { data:characters } = useCharacters();

    // Scroll to bottom when activities change
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = -100;
        }
    }, [activities]);

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b text-center">
                <h2 className="text-lg font-semibold">Activity Feed</h2>
            </div>
            <ScrollArea className="flex-grow" scrollToBottom={true}>
                <div className="p-4 flex flex-col-reverse">
                    {activities.map((activity, index) => (
                        <ActivityItem key={index} activity={activity} characters={characters} convertEthToUsd={converEthToUsd} />
                    ))}
                </div>
                <ScrollBar />
            </ScrollArea>
        </div>
    )
}