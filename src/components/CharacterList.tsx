import React, { useState, useMemo } from 'react';
import { ChevronDown, Swords, TrendingUp, TrendingDown, ShoppingCart, AlertTriangle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCharacters, useBattleState, useAllCharacterPerformance } from '../hooks/api';
import { useConvertEthToUsd } from '../EthPriceProvider';
import { formatMarketCap, formatNumber, formatPercentage } from '../lib/utils';
import { getMatchesUntilNextMatchForCharacters } from './CharacterPage';
import { Character, CurrentBattleState, Status } from '@memeclashtv/types';
type SortColumn = 'marketCap' | 'price' | 'performance';
type SortDirection = 'asc' | 'desc';

export const StatusIndicator = ({ status, matchesLeft, totalMatches, p1, p2 }: { status: any, matchesLeft: number, totalMatches: number, p1: number, p2: number }) => {
  const isStartup = p1 == 0 && p2 == 0;
  console.log("AAbb status", status);
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

  const urgencyLevel = Math.max(0, Math.min(1, status === 'waiting-to-battle' ? 0.9 : status === 'next' ? 0.7 : 1 - (matchesLeft / 12)));
  const animationDuration = (() => {
    const calcDuration = 2 - (urgencyLevel * 1.5);
    if (typeof calcDuration !== 'number' || isNaN(calcDuration) || calcDuration < 0) {
      console.warn(`Invalid animation duration calculated: ${calcDuration}. Falling back to 0.5.`);
      return 0.5; // Fallback duration
    }
    return Math.max(0.5, calcDuration);
  })();

  console.log("AAbb urgencyLevel", urgencyLevel);
  console.log("AAbb status", status);
  console.log("AAbb getStatusText", getStatusText());
  console.log("AAbb getStatusColor", getStatusColor());
  console.log("AAbb animationDuration", animationDuration);

  return (
    <motion.div className={`flex items-center space-x-1 ${getStatusColor()}`} initial={{ opacity: 1, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <motion.div className="relative w-4 h-4 sm:w-5 sm:h-5" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: animationDuration, repeat: Infinity, ease: "easeInOut" }}>
        {status === 'battling' ? (
          <Swords className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
        ) : status === 'waiting-to-battle' ? (
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
        ) : (
          <>
            <motion.div className="absolute inset-0 rounded-full border-2 border-current" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: animationDuration, repeat: Infinity, ease: "easeInOut" }} />
            <motion.div className="absolute inset-0 rounded-full bg-current" initial={{ scale: 0 }} animate={{ scale: urgencyLevel }} transition={{ duration: animationDuration, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }} />
          </>
        )}
      </motion.div>
      <motion.span className="text-xs sm:text-sm font-bold  whitespace-nowrap" animate={{ scale: [1, 1 + (urgencyLevel * 0.2), 1], textShadow: [`0 0 ${urgencyLevel * 2}px currentColor`, `0 0 ${urgencyLevel * 5}px currentColor`, `0 0 ${urgencyLevel * 2}px currentColor`] }} transition={{ duration: animationDuration, repeat: Infinity, ease: "easeInOut" }}>
        {getStatusText()}
      </motion.span>
      <AnimatePresence>
        {(urgencyLevel > 0.5 || status === 'waiting-to-battle') && (
          <motion.span className="text-xs sm:text-sm" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.3 }}>
            {status === 'waiting-to-battle' ? '⚠️' : '🔥'}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const getMatchStatusText = (character, matchesTillNextMatch, battleState) => {
  let adjustedMatchesTillNextMatch = matchesTillNextMatch;

  if (battleState?.status === Status.Pending) {
    adjustedMatchesTillNextMatch -= 1;
  }
  console.log('battle state', battleState);
  if (battleState?.p1 === character.id || battleState?.p2 === character.id) {
    if (battleState?.status === Status.Battling) {
      return 'battling';
    } else if (battleState?.status === Status.Pending) {
      return 'waiting-to-battle';
    } else if (battleState?.status === Status.Idle) {
      return 'finished';
    }
  } else if (adjustedMatchesTillNextMatch === 1) {
    return 'next';
  } else if (adjustedMatchesTillNextMatch > 0) {
    return `${adjustedMatchesTillNextMatch} ${adjustedMatchesTillNextMatch === 1 ? 'match' : 'matches'} left`;
  } else {
    return 'finished';
  }
};
const CharacterRow = ({ character, performance, matchesLeft, status, battleState }: { character: Character, performance: number, matchesLeft: number, status: string, battleState: CurrentBattleState }) => {
  const [isHovered, setIsHovered] = useState(false);
  const convertEthToUsd = useConvertEthToUsd();
  const navigate = useNavigate();

  const handleRowClick = () => {
    navigate(`/character/${character.id}`);
  };

  return (
    <motion.tr 
      className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors duration-200 relative group cursor-pointer" 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)} 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      onClick={handleRowClick}
    >
      <td className="p-2 sm:p-3 relative">
        <div className="flex items-center my-2">
          <motion.img src={character.pfp} alt={character.name} className="w-8 h-8 mr-2 font-bold rounded-full border border-yellow-500" whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }} />
          <div className=""
            
          >
            <div className="font-bold text-lg sm:text-md md:text-md text-white">
              {character.name}
            </div>
          </div>
        </div>
        <AnimatePresence>
          {isHovered && (
            <motion.button 
              className="absolute top-0 left-0 bg-yellow-500 text-black px-2 py-1 sm:px-3 sm:py-1 rounded-br-lg hover:bg-yellow-400 transition-colors text-xs font-bold shadow-md flex items-center space-x-1 z-10" 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              transition={{ duration: 0.2 }}
            >
              <ShoppingCart className="w-3 h-3" />
              <span
                style={{
                  textShadow: `
                    2px 2px 0 #FFFFFF, 
                    2px 2px 0 #FFFFFF, 
                    2px 2px 0 #FFFFFF, 
                    2px 2px 0 #FFFFFF
                `,
                }}
               className="font-bold text-md hidden sm:inline">BUY NOW</span>
            </motion.button>
          )}
        </AnimatePresence>
      </td>
      <td className="font-bold text-right p-2 sm:p-3 text-xs sm:text-sm md:text-base ">
        <motion.div animate={{ scale: isHovered ? 1.05 : 1 }}>
          {formatNumber(convertEthToUsd(character.price))}
        </motion.div>
      </td>
      <td className={`text-right p-2 sm:p-3 ${performance >= 0 ? 'text-green-400' : 'text-red-400'} text-xs sm:text-sm md:text-base `}>
        <motion.div className="flex items-center justify-end space-x-1" animate={{ scale: isHovered ? 1.05 : 1 }}>
          {performance >= 0 ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />}
          <span>{formatPercentage(performance)}</span>
        </motion.div>
      </td>
      <td className="text-right p-2 sm:p-3 text-xs sm:text-sm md:text-base ">
        <motion.div animate={{ scale: isHovered ? 1.05 : 1 }}>
          {formatMarketCap(convertEthToUsd(character.value))}
        </motion.div>
      </td>
      <div className='absolute bottom-0 left-10 pb-2'>
        <StatusIndicator status={status} matchesLeft={matchesLeft} totalMatches={character.matchCount} p1={battleState?.p1 ?? 0} p2={battleState?.p2 ?? 0} />
      </div>
    </motion.tr>
  );
};

export const CharacterList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('marketCap');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { data: characters, isLoading, isError } = useCharacters();
  const { data: battleState } = useBattleState();
  const convertEthToUsd = useConvertEthToUsd();
  const yesterday = useMemo(() => (new Date().getTime() / 1000) - 86400, []);
  const characterPerformance = useAllCharacterPerformance(characters?.map(c => c.id) ?? [], yesterday);
  const performanceMap = useMemo(() => {
    return characterPerformance?.reduce((acc, curr) => {
      acc[curr.characterId] = curr.data;
      return acc;
    }, {} as Record<number, number>);
  }, [characterPerformance]);
  const matchesTillNextMatchArray = useMemo(() => {
    if (!battleState) {
      return {};
    }
    const characterIds = characters?.map(c => String(c.id)) ?? [];
    return getMatchesUntilNextMatchForCharacters(characterIds, battleState.currentMatch);
  }, [characters, battleState]);

  const filteredCharacters = useMemo(() => {
    return characters?.filter(character => character.name.toLowerCase().includes(searchTerm.toLowerCase())) ?? [];
  }, [characters, searchTerm]);

  const sortedCharacters = useMemo(() => {
    if (!filteredCharacters) return [];
    return [...filteredCharacters].sort((a, b) => {
      let aValue, bValue;
      switch (sortColumn) {
        case 'marketCap':
          aValue = a.value;
          bValue = b.value;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'performance':
          const aPerf = Number(performanceMap[a.id]) || 0;
          const bPerf = Number(performanceMap[b.id]) || 0;
          aValue = aPerf;
          bValue = bPerf;
          break;
      }
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [filteredCharacters, sortColumn, sortDirection, performanceMap]);

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error</div>;
  }

  return (
    <div className="bg-gray-900 text-gray-300 shadow-lg h-full w-full overflow-hidden border flex flex-col">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #4b5563 #1f2937;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;
        }
      `}</style>
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700">
        <div className="flex flex-col items-center py-3 sm:py-4 px-2 sm:px-4 space-y-2 sm:space-y-4">
          <h2 className="text-2xl font-bold text-white">Characters</h2>
          <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
            <input
              type="text"
              placeholder="Search characters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 sm:px-4 py-1 sm:py-2 bg-gray-800 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar pb-6">
        <table className="w-full">
          <thead className="sticky top-0 bg-gray-900">
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left p-2 sm:p-3 text-xs sm:text-sm md:text-base">Character</th>
              <th className="text-right p-2 sm:p-3 text-xs sm:text-sm md:text-base">
                <div
                  className="flex items-center space-x-1 cursor-pointer hover:text-white transition-colors duration-200"
                  onClick={() => handleSort('price')}
                >
                  <span>Price</span>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
              </th>
              <th className="text-right p-2 sm:p-3 text-xs sm:text-sm md:text-base">
                <div
                  className="flex items-center space-x-1 cursor-pointer hover:text-white transition-colors duration-200"
                  onClick={() => handleSort('performance')}
                >
                  <span>24h</span>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
              </th>
              <th className="text-right p-2 sm:p-3 text-xs sm:text-sm md:text-base">
                <div
                  className="flex items-center justify-end space-x-1 cursor-pointer hover:text-white transition-colors duration-200"
                  onClick={() => handleSort('marketCap')}
                >
                  <span>MCap</span>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCharacters.map((character) => {
              const performance = performanceMap[character.id] || 0;
              const matchesLeft = matchesTillNextMatchArray[character.id] || 0;
              const status = getMatchStatusText(character, matchesLeft, battleState);
              return (
                <CharacterRow
                  key={character.id}
                  character={character}
                  performance={performance / 100}
                  matchesLeft={matchesLeft}
                  status={status}
                  battleState={battleState}
                />
              );
            })}
            <motion.tr
              className="border-t border-gray-700 bg-gray-800 hover:bg-gray-700 transition-colors duration-200"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.5 }}
            >
              <td
                colSpan={4}
                className="p-6 text-center text-lg sm:text-xl md:text-2xl font-semibold text-yellow-400"
              >
                More characters coming soon
              </td>
            </motion.tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};