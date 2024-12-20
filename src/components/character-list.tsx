import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { AIAvatar } from "./ai-avatar"
import { cn, formatPercentage } from "../lib/utils"
import { useNavigate } from "react-router-dom"
import { ArrowDown, ArrowUp, ArrowUpRight } from 'lucide-react'
import { useCharacters, useBattleState, useAllCharacterPerformance } from '../hooks/api'
import { useConvertEthToUsd } from '../EthPriceProvider'
import { formatNumber } from '../lib/utils'
import { useMemo } from 'react'
import { getMatchesUntilNextMatchForCharacters } from '../components/CharacterPage'
import { Status } from '@memeclashtv/types'
import { motion, AnimatePresence } from "framer-motion"
import { Swords, AlertTriangle } from 'lucide-react'

function StatusBadge({ 
  status, 
  matchesLeft,
  totalMatches,
  p1,
  p2
}: { 
  status: string
  matchesLeft: number
  totalMatches: number
  p1: number
  p2: number
}) {
  const isStartup = p1 === 0 && p2 === 0;
  
  const getStatusColor = () => {
    if (isStartup) return 'text-yellow-400';
    if (status === 'battling') return 'text-red-400';
    if (status === 'waiting-to-battle') return 'text-orange-400';
    if (status === 'next') return 'text-yellow-400';
    const ratio = matchesLeft / 12;
    if (ratio <= 0.25) return 'text-red-400';
    if (ratio <= 0.5) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusText = () => {
    if (isStartup) return 'Buy shares NOW';
    if (status === 'battling') return 'In battle';
    if (status === 'waiting-to-battle') return 'Waiting to battle';
    if (status === 'next') return 'Next up';
    if (status === 'finished') return 'Finished';
    return `${matchesLeft} matches till battle`;
  };

  const urgencyLevel = Math.max(0, Math.min(1, 
    status === 'waiting-to-battle' ? 0.9 : 
    status === 'next' ? 0.7 : 
    1 - (matchesLeft / 12)
  ));

  const animationDuration = (() => {
    const calcDuration = 2 - (urgencyLevel * 1.5);
    if (typeof calcDuration !== 'number' || isNaN(calcDuration) || calcDuration < 0) {
      console.warn(`Invalid animation duration calculated: ${calcDuration}. Falling back to 0.5.`);
      return 0.5;
    }
    return Math.max(0.5, calcDuration);
  })();

  return (
    <motion.div 
      className={cn("flex items-center space-x-1", getStatusColor())}
      initial={{ opacity: 1, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="relative w-3 h-3 sm:w-5 sm:h-5"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ 
          duration: animationDuration,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {status === 'battling' ? (
          <Swords className="w-3 h-3 sm:w-5 sm:h-5 animate-pulse" />
        ) : status === 'waiting-to-battle' ? (
          <AlertTriangle className="w-3 h-3 sm:w-5 sm:h-5 animate-pulse" />
        ) : (
          <>
            <motion.div 
              className="absolute inset-0 rounded-full border-2 border-current"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ 
                duration: animationDuration,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div 
              className="absolute inset-0 rounded-full bg-current"
              initial={{ scale: 0 }}
              animate={{ scale: urgencyLevel }}
              transition={{ 
                duration: animationDuration,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            />
          </>
        )}
      </motion.div>

      <motion.span 
        className="text-[9px] font-medium whitespace-nowrap"
        animate={{ 
          scale: [1, 1 + (urgencyLevel * 0.2), 1],
          textShadow: [
            `0 0 ${urgencyLevel * 2}px currentColor`,
            `0 0 ${urgencyLevel * 5}px currentColor`,
            `0 0 ${urgencyLevel * 2}px currentColor`
          ]
        }}
        transition={{ 
          duration: animationDuration,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {getStatusText()}
      </motion.span>

      <AnimatePresence>
        {(urgencyLevel > 0.5 || status === 'waiting-to-battle') && (
          <motion.span
            className="text-xs sm:text-sm"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
          >
            {status === 'waiting-to-battle' ? '⚠️' : '🔥'}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function CharacterList() {
  const navigate = useNavigate()
  const { data: characters } = useCharacters()
  const { data: battleState } = useBattleState()
  const convertEthToUsd = useConvertEthToUsd()
  
  // Get performance data
  const yesterday = useMemo(() => new Date().getTime() / 1000 - 24 * 60 * 60, [])
  const characterPerformance = useAllCharacterPerformance(
    characters?.map(c => c.id) ?? [], 
    yesterday
  )

  // Calculate matches until next battle
  const matchesTillNextMatchArray = useMemo(() => {
    if (!battleState) return {}
    const characterIds = characters?.map(c => String(c.id)) ?? []
    return getMatchesUntilNextMatchForCharacters(characterIds, battleState.currentMatch)
  }, [characters, battleState])

  // Get character status
  const getCharacterStatus = (characterId: number, matchesLeft: number) => {
    let adjustedMatchesLeft = matchesLeft;
    
    if (battleState?.status === Status.Pending) {
      adjustedMatchesLeft -= 1;
    }

    if (battleState?.p1 === characterId || battleState?.p2 === characterId) {
      if (battleState?.status === Status.Battling) {
        return 'battling';
      } else if (battleState?.status === Status.Pending) {
        return 'waiting-to-battle';
      } else if (battleState?.status === Status.Idle) {
        return 'finished';
      }
    } else if (adjustedMatchesLeft === 1) {
      return 'next';
    } else if (adjustedMatchesLeft <= 0) {
      return 'finished';
    }
    return `${matchesLeft} matches left`;
  }

  if (!characters) return null

  return (
    <Card className="overflow-hidden divide-y divide-border">
      {characters.map((character) => {
        const matchesLeft = matchesTillNextMatchArray[character.id] || 0
        const status = getCharacterStatus(character.id, matchesLeft)
        const performance = (characterPerformance?.find(p => p.characterId === character.id)?.data ?? 0) / 100

        return (
          <Button
            key={character.id}
            variant="ghost"
            className="w-full justify-between px-4 py-3 h-auto rounded-none hover:bg-accent/50 flex items-center gap-2"
            onClick={() => navigate(`/character/${character.id}`)}
          >
            <div className="flex items-center gap-3 flex-1">
              <AIAvatar
                src={character.pfp}
                alt={character.name}
                size="sm"
                className="h-10 w-10"
              />
              <div className="flex-1 text-left">
                <div className="flex items-baseline">
                  <span className="font-medium text-sm">{character.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatNumber(convertEthToUsd(character.value))} MCap
                  </span>
                </div>
                <StatusBadge 
                  status={status}
                  matchesLeft={matchesLeft}
                  totalMatches={character.matchCount}
                  p1={battleState?.p1 ?? 0}
                  p2={battleState?.p2 ?? 0}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-sm font-bold">
                    {formatNumber(convertEthToUsd(character.price))}
                  </div>
                  <div className={cn(
                    "text-xs",
                    performance > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {performance > 0 ? "+" : ""}{formatPercentage(performance)}
                  </div>
                </div>
                <div
                  className="h-8 w-8 rounded-full bg-yellow-400/90 hover:bg-yellow-500/90 animate-flash-pulse flex items-center justify-center cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/character/${character.id}?action=buy`)
                  }}
                >
                  <ArrowUpRight className="h-4 w-4 text-black" />
                </div>
              </div>
            </div>
          </Button>
        )
      })}
    </Card>
  )
}
