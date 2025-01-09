import { useRef, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Send, Lock, ArrowUpRight, ArrowDownRight, Heart, Shield, Zap, Swords } from 'lucide-react'
import { ScrollArea, ScrollBar } from "./ui/scroll-area"
import { BaseActivity, MatchEndActivity, MatchStartActivity, MatchPendingActivity, TradeActivity, StakeActivity, ChatActivity } from '@memeclashtv/types/activity'
import { Character, User } from '@memeclashtv/types';
import { useCharacters, useUsers } from '../hooks/api';
import { formatNumber } from '../lib/utils';
import { useConvertEthToUsd } from '../EthPriceProvider';
import { statIcons } from './CharacterPage';
import { useActivities, useSendMessage } from './ActivityListenerProvider'
import { usePrivy, useLogin } from '@privy-io/react-auth'
import { useNavigate } from 'react-router-dom'
import { truncateWallet } from './NavBar'
import { Avatar } from './ui/avatar'
import Jazzicon from '@raugfer/jazzicon';
import { zeroAddress } from 'viem'
import { useMediaQuery } from '../hooks/useMediaQuery'

// builds an image data url for embedding
export function buildDataUrl(address: string): string {
  return 'data:image/svg+xml;base64,' + btoa(Jazzicon(address ?? zeroAddress));
}

export enum ActivityType {
  MatchPending = 'MatchPending',
  MatchStart = 'MatchStart',
  MatchEnd = 'MatchEnd',
  Trade = 'Trade',
  Stake = 'Stake',
  Chat = 'Chat',
}

// Helper function to format timestamps to hour and minute with am/pm
const formatTime = (timestamp: number) => format(new Date(timestamp), 'h:mm a')

// Activity renderer component
export const ActivityItem = ({ activity, characters, convertEthToUsd, users }: { activity: BaseActivity, characters: Character[], convertEthToUsd: any, users: User[]}) => {
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 1100px)')

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
            className="bg-yellow-900/50 opacity-50 p-2 rounded-lg shadow-lg flex flex-wrap items-center text-sm w-full border-b border-yellow-700"
          >
            {time}
            <span className="text-yellow-400 font-semibold mr-2">Match Pending:</span>
            <div className="flex items-center">
              <img src={character1?.pfp} alt={character1?.name} className="w-5 h-5 rounded-full object-cover border border-yellow-400 mr-1" />
              <p className='hover:underline cursor-pointer' onClick={() => navigate(`/character/${character1?.id}`)}>{character1?.name}</p>
              <span className="mx-1 font-bold">VS</span>
              <img src={character2?.pfp} alt={character2?.name} className="w-5 h-5 rounded-full object-cover border border-yellow-400 mr-1" />
              <p className='hover:underline cursor-pointer' onClick={() => navigate(`/character/${character2?.id}`)}>{character2?.name}</p>
            </div>
            <span className="ml-2 text-yellow-400">
              in {Math.round((matchPending.startTime - activity.timestamp))}s
            </span>
            <span className="ml-2 text-yellow-400">buy your shares now!!!</span>
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
            className="bg-blue-900/50 p-2 rounded-lg shadow-lg flex flex-wrap items-center text-sm w-full border-b border-blue-700"
          >
            {time}
            <span className="text-blue-400 font-semibold mr-2">Match Started:</span>
            <div className="flex items-center flex-wrap">
              <img src={character1Match?.pfp} alt={character1Match?.name} className="w-5 h-5 rounded-full object-cover border border-blue-400 mr-1" />
              <p className='hover:underline cursor-pointer' onClick={() => navigate(`/character/${character1Match?.id}`)}>{character1Match?.name}</p>
              <span className="mx-1 font-bold text-blue-400">VS</span>
              <img src={character2Match?.pfp} alt={character2Match?.name} className="w-5 h-5 rounded-full object-cover border border-blue-400 mr-1" />
              <p className='hover:underline cursor-pointer' onClick={() => navigate(`/character/${character2Match?.id}`)}>{character2Match?.name}</p>
              <span className="mx-1 font-bold text-blue-400">who will win?</span>
            </div>
          </motion.div>
        )

      case ActivityType.MatchEnd:
        const matchEnd = activity as MatchEndActivity
        const winnerIsP1 = matchEnd?.p1 == matchEnd?.winner;
        const winnerPrice = winnerIsP1 ? 
        formatNumber(convertEthToUsd(matchEnd?.tokenState?.newPrice1)):
        formatNumber(convertEthToUsd(matchEnd?.tokenState?.newPrice2))
        const tvlTransferred = formatNumber(convertEthToUsd(matchEnd.tokenState.reward));
        const winnerCharacter = characters?.find(c => c.id === matchEnd?.winner);
        const loserCharacter = characters?.find(c => c.id === (winnerIsP1 ? matchEnd?.p2 : matchEnd?.p1));
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-green-900/50 p-2 rounded-lg shadow-lg flex flex-wrap items-center text-sm w-full border-b border-green-700"
          >
            {time}
            <span className="text-green-400 font-semibold mr-2">Match Results:</span>
            <div className="flex items-center flex-wrap">
              <img src={winnerCharacter?.pfp} alt={winnerCharacter?.name} className="w-5 h-5 rounded-full object-cover border border-green-400 mr-1" />
              <p className='hover:underline cursor-pointer' onClick={() => navigate(`/character/${winnerCharacter?.id}`)}>{winnerCharacter?.name}</p>
              <span className="mx-1 font-bold text-green-400">beat</span>
              <img src={loserCharacter?.pfp} alt={loserCharacter?.name} className="w-5 h-5 rounded-full object-cover border border-red-400 opacity-50 mr-1" />
              <p className='hover:underline cursor-pointer text-red-400' onClick={() => navigate(`/character/${loserCharacter?.id}`)}>{loserCharacter?.name}</p>
              <span className="ml-1 font-bold text-green-400">gaining</span>
              <span className="ml-1 text-green-400">{tvlTransferred} in MktCap</span>
              <span className="ml-1 font-bold text-green-400">price now {winnerPrice}</span>
            </div>
          </motion.div>
        )

      case ActivityType.Trade:
        const trade = activity as TradeActivity
        const character = characters?.find(c => c.id === trade.character);
        const cost = formatNumber(convertEthToUsd(trade?.ethAmount));
        const amount = trade?.shareAmount;
        const userTrader = users?.find(u => u.address?.toLowerCase() == trade.trader?.toLowerCase()) as any
        const traderDisplayName = userTrader?.username ? `@${userTrader?.username}` : truncateWallet(trade.trader);
        const traderPfp = userTrader?.pfp ? userTrader?.pfp : buildDataUrl(trade.trader);
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            
            className={`p-2 rounded-lg shadow-lg flex flex-wrap items-center text-sm w-full ${trade.isBuy ? 'bg-green-900/50 border-b border-green-700' : 'bg-red-900/50 border-b border-red-700'}`}
          >
            {time}
            <span className={`font-semibold mr-2 ${trade.isBuy ? 'text-green-400' : 'text-red-400'}`}>
              {trade.isBuy ? 'Buy:' : 'Sell:'}
            </span>
            <div className="flex items-center flex-wrap">
              <img src={traderPfp} alt={traderDisplayName} className="w-5 h-5 rounded-full object-cover border border-gray-400 mr-1" />
              <span className="text-gray-400 hover:underline cursor-pointer" onClick={() => navigate(`/user/${trade.trader}`)}>{traderDisplayName}</span>
              <span className="mx-1">{trade.isBuy ? 'bought' : 'sold'}  {amount}</span>
              <img src={character?.pfp} alt={character?.name}  className="w-5 h-5 rounded-full object-cover border border-gray-400 mr-1" />
              <span className="text-gray-400 hover:underline cursor-pointer" onClick={() => navigate(`/character/${character?.id}`)}>{character?.name}</span>
              <span className="mx-1">{trade.isBuy ? 'for' : 'at'}</span>
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
            className="bg-purple-900/50 p-2 rounded-lg shadow-lg flex flex-wrap items-center text-sm w-full border-b border-purple-700"
          >
            {time}
            <span className="text-purple-400 font-semibold mr-2">Stake:</span>
            <div className="flex items-center flex-wrap">
              <img src={characterStake?.pfp} alt={characterStake?.name} className="w-5 h-5 rounded-full object-cover border border-purple-400" />
              <span className="mx-1">{stake.amount}</span>
              {statIcons[stake.attribute]}
              <span className="ml-1 text-gray-400">by {truncateWallet(stake.staker)}</span>
            </div>
          </motion.div>
        )

      case ActivityType.Chat:
        const chat = activity as ChatActivity
        const userChat = users?.find(u => u.address?.toLowerCase() == chat.sender?.toLowerCase()) as any
        const displayName = userChat?.username ? `@${userChat?.username}` : truncateWallet(chat.sender);
        const pfp = userChat?.pfp ? userChat?.pfp : buildDataUrl(chat.sender);
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-gray-800/50 p-2 rounded-lg shadow-lg flex flex-wrap items-center text-sm w-full border-b border-gray-700"
          >
            {time}
            <img src={pfp} alt={displayName} className="w-5 h-5 rounded-full object-cover border border-gray-400" />
            <span className="font-bold hover:underline cursor-pointer mr-2" onClick={() => navigate(`/user/${chat.sender}`)}>{displayName}:</span>
            <span className="break-all">{chat.message}</span>
          </motion.div>
        )

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
  const activities = useActivities() as any;
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const converEthToUsd = useConvertEthToUsd();
  const { data:characters } = useCharacters();
  const { data:users } = useUsers();
  const [inputMessage, setInputMessage] = useState('')
  const { authenticated, user } = usePrivy()
  const { login } = useLogin()
  const sendMessage = useSendMessage()
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
    if (inputMessage.trim() && isLoggedIn) {
      sendMessage(inputMessage)
      setInputMessage('')
    }
  }

  const handleLogin = () => {
    login()
  }

  return (
    <div className="bg-gray-900 text-gray-300 shadow-lg flex flex-col h-full w-full border">
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

        @keyframes glow {
          0% { box-shadow: 0 0 5px rgba(255,255,255,0.3); }
          50% { box-shadow: 0 0 20px rgba(255,255,255,0.5); }
          100% { box-shadow: 0 0 5px rgba(255,255,255,0.3); }
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700">
        <div className="flex justify-center items-center py-4">
          <h2 className="text-2xl font-bold text-white">Activity Feed</h2>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-4 flex flex-col-reverse custom-scrollbar">
        <div ref={scrollAreaRef} />
        <AnimatePresence initial={false}>
          {activities?.map((activity, index) => (
            <ActivityItem key={index} activity={activity} characters={characters} convertEthToUsd={converEthToUsd} users={users} />
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