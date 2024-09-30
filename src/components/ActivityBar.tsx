import { useRef, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Send, Lock, ArrowUpRight, ArrowDownRight, Heart, Shield, Zap, Swords } from 'lucide-react'
import { ScrollArea, ScrollBar } from "./ui/scroll-area"
import { BaseActivity, MatchEndActivity, MatchStartActivity, MatchPendingActivity, TradeActivity, StakeActivity } from '@memeclashtv/types/activity'
import { Character } from '@memeclashtv/types';
import { useCharacters } from '../hooks/api';
import { formatNumber } from '../lib/utils';
import { useConvertEthToUsd } from '../EthPriceProvider';
import { statIcons } from './CharacterPage';
import { useActivities } from './ActivityListenerProvider'
import { usePrivy, useLogin } from '@privy-io/react-auth'
import { useNavigate } from 'react-router-dom'

export enum ActivityType {
  MatchPending = 'MatchPending',
  MatchStart = 'MatchStart',
  MatchEnd = 'MatchEnd',
  Trade = 'Trade',
  Stake = 'Stake',
}

// Helper function to format timestamps to hour and minute
const formatTime = (timestamp: number) => format(new Date(timestamp), 'HH:mm')

// Activity renderer component
const ActivityItem = ({ activity, characters, convertEthToUsd }: { activity: BaseActivity, characters: Character[], convertEthToUsd: any}) => {
  const renderContent = () => {
    const time = (
      <span className="text-xs text-gray-500 flex items-center mr-2 min-w-[40px]">
        <Clock className="w-3 h-3 mr-1" />
        {formatTime(activity.timestamp * 1000)}
      </span>
    )

    switch (activity.type) {
      case ActivityType.MatchPending:
        const matchPending = activity as MatchPendingActivity
        const character1 = characters?.find(c => c.id === matchPending.p1);
        const character2 = characters?.find(c => c.id === matchPending.p2);
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-yellow-900/50 p-2 rounded-lg shadow-lg flex flex-wrap items-center text-sm w-full"
          >
            {time}
            <span className="text-yellow-400 font-semibold mr-2">Match Pending:</span>
            <div className="flex items-center">
              <img src={character1?.pfp} alt={character1?.name} className="w-5 h-5 rounded-full object-cover border border-yellow-400" />
              <span className="mx-1 font-bold">VS</span>
              <img src={character2?.pfp} alt={character2?.name} className="w-5 h-5 rounded-full object-cover border border-yellow-400" />
            </div>
            <span className="ml-2 text-yellow-400">
              in {Math.round((matchPending.startTime - Date.now()) / 1000)}s
            </span>
          </motion.div>
        )

      case ActivityType.MatchStart:
        const matchStart = activity as MatchStartActivity
        const character1Match = characters?.find(c => c.id === matchStart.p1);
        const character2Match = characters?.find(c => c.id === matchStart.p2);
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-blue-900/50 p-2 rounded-lg shadow-lg flex flex-wrap items-center text-sm w-full"
          >
            {time}
            <span className="text-blue-400 font-semibold mr-2">Match Started:</span>
            <div className="flex items-center">
              <img src={character1Match?.pfp} alt={character1Match?.name} className="w-5 h-5 rounded-full object-cover border border-blue-400" />
              <span className="mx-1 font-bold text-blue-400">VS</span>
              <img src={character2Match?.pfp} alt={character2Match?.name} className="w-5 h-5 rounded-full object-cover border border-blue-400" />
            </div>
          </motion.div>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-green-900/50 p-2 rounded-lg shadow-lg flex flex-wrap items-center text-sm w-full"
          >
            {time}
            <span className="text-green-400 font-semibold mr-2">Match Results:</span>
            <div className="flex items-center flex-wrap">
              <img src={winnerCharacter?.pfp} alt={winnerCharacter?.name} className="w-5 h-5 rounded-full object-cover border border-green-400" />
              <span className="mx-1 font-bold text-green-400">wins</span>
              <span className="text-green-400">{winnerPrice}</span>
            </div>
            <img src={loserCharacter?.pfp} alt={loserCharacter?.name} className="w-5 h-5 rounded-full object-cover border border-red-400 opacity-50 ml-2" />
          </motion.div>
        )

      case ActivityType.Trade:
        const trade = activity as TradeActivity
        const character = characters?.find(c => c.id === trade.character);
        const cost = formatNumber(convertEthToUsd(trade?.ethAmount));
        const amount = trade?.shareAmount;
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`p-2 rounded-lg shadow-lg flex flex-wrap items-center text-sm w-full ${trade.isBuy ? 'bg-green-900/50' : 'bg-red-900/50'}`}
          >
            {time}
            <span className={`font-semibold mr-2 ${trade.isBuy ? 'text-green-400' : 'text-red-400'}`}>
              {trade.isBuy ? 'Buy:' : 'Sell:'}
            </span>
            <div className="flex items-center flex-wrap">
              <img src={character?.pfp} alt={character?.name} className="w-5 h-5 rounded-full object-cover border border-gray-400" />
              <span className="mx-1">{amount} shares</span>
              <span className="font-bold">{cost}</span>
              {trade.isBuy ? <ArrowUpRight className="w-4 h-4 text-green-400 ml-1" /> : <ArrowDownRight className="w-4 h-4 text-red-400 ml-1" />}
            </div>
          </motion.div>
        )

      case ActivityType.Stake:
        const stake = activity as StakeActivity
        const characterStake = characters?.find(c => c.id === stake.character);

        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-purple-900/50 p-2 rounded-lg shadow-lg flex flex-wrap items-center text-sm w-full"
          >
            {time}
            <span className="text-purple-400 font-semibold mr-2">Stake:</span>
            <div className="flex items-center flex-wrap">
              <img src={characterStake?.pfp} alt={characterStake?.name} className="w-5 h-5 rounded-full object-cover border border-purple-400" />
              <span className="mx-1">{stake.amount}</span>
              {statIcons[stake.attribute]}
              <span className="ml-1 text-gray-400">by {stake.staker}</span>
            </div>
          </motion.div>
        )

      // case ActivityType.Chat:
      //   const chat = activity as ChatActivity
      //   return (
      //     <motion.div
      //       initial={{ opacity: 0, y: 20 }}
      //       animate={{ opacity: 1, y: 0 }}
      //       exit={{ opacity: 0, y: 20 }}
      //       className="bg-gray-800/50 p-2 rounded-lg shadow-lg flex flex-wrap items-center text-sm w-full"
      //     >
      //       {time}
      //       <span className="font-semibold mr-2">{chat.username}:</span>
      //       <span className="break-all">{chat.message}</span>
      //     </motion.div>
      //   )

      default:
        return <p>Unknown activity type</p>
    }
  }

  return (
    <div className="mb-2 w-full">
      {renderContent()}
    </div>
  )
}

// Main ActivityBar component
export const ActivityBar = () => {
  const activities = useActivities();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const converEthToUsd = useConvertEthToUsd();
  const { data:characters } = useCharacters();
  const [inputMessage, setInputMessage] = useState('')
  const { authenticated, user } = usePrivy()
  const { login } = useLogin()
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Scroll to bottom when activities change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = -100;
    }
  }, [activities]);

  useEffect(() => {
    if (authenticated) {
      setIsLoggedIn(true)
    }
  }, [authenticated])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // if (inputMessage.trim() && isLoggedIn) {
    //   const newActivity: ChatActivity = {
    //     type: ActivityType.Chat,
    //     timestamp: Date.now(),
    //     username: 'You',
    //     message: inputMessage.trim()
    //   }
    //   setActivities([...activities, newActivity])
    //   setInputMessage('')
    // }
  }

  const handleLogin = () => {
    login()
  }

  return (
    <div className="bg-gray-900 text-gray-300 rounded-lg shadow-lg flex flex-col h-full w-full">
      <style>{`
        /* Webkit (Chrome, Safari, newer versions of Opera) */
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #4b5563;
          border-radius: 20px;
          border: 3px solid #1f2937;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #6b7280;
        }

        /* Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #4b5563 #1f2937;
        }
      `}</style>
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700">
        <div className="flex justify-center items-center py-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Activity Feed</h2>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-4 flex flex-col-reverse custom-scrollbar">
        <div ref={scrollAreaRef} />
        <AnimatePresence initial={false}>
          {activities.slice().map((activity, index) => (
            <ActivityItem key={index} activity={activity} characters={characters} convertEthToUsd={converEthToUsd} />
          ))}
        </AnimatePresence>
      </div>
      <div className="p-4 border-t border-gray-700">
        {isLoggedIn ? (
          <form onSubmit={handleSubmit} className="flex items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow bg-gray-800 text-white rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-r-md px-4 py-2 transition-colors duration-200"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        ) : (
          <div className="flex items-center">
            <div className="flex-grow bg-gray-800 text-gray-500 rounded-l-md px-4 py-2">
              Login to chat
            </div>
            <button
              onClick={handleLogin}
              className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-r-md px-4 py-2 transition-colors duration-200 flex items-center"
            >
              <Lock className="w-5 h-5 mr-2" />
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}