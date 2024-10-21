import React, { useState, useRef, useCallback } from 'react';
import { CharacterAttributeState, MatchEndActivity } from '@memeclashtv/types/activity';
import { MatchListItem } from './MatchListItem';
import { useCharacterMatches } from '../hooks/api';
import './MatchList.css';
import { Character } from '@memeclashtv/types';
import { Link } from 'react-router-dom'; // Added import for Link

interface MatchListProps {
  characterId: number;
  characters: Character[];
}

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { ArrowDownIcon, ArrowUpIcon, HeartIcon, ShieldIcon, SwordIcon, ZapIcon } from "lucide-react"
import { formatNumber, formatPercentage } from '../lib/utils';
import { useConvertEthToUsd } from '../EthPriceProvider';


const timeSince = (date: number) => {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const seconds = now - date;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min ago`;
};

const CharacterCard = ({ 
  id, 
  state, 
  price, 
  marketCap ,
  characters,
  convertEthToUsd
}: { 
  id: number, 
  state: CharacterAttributeState, 
  price: number, 
  marketCap: number,
  characters: Character[],
  convertEthToUsd: (price: number) => number
}) => {
  const character = characters.find(c => c.id == id)

  return (
    <div className="flex items-center space-x-4">
      <Avatar className="h-12 w-12 hover:border-2 hover:border-rounded hover:border-yellow-500 hover:scale-110 transition-all duration-300">
        <AvatarImage src={character.pfp} alt={character.name} className="" />
        <AvatarFallback>{character.name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-grow">
        <div className="flex justify-between items-center">
          <p className="font-semibold hover:underline">{character.name}</p>
          <div className="text-right">
            <p className="text-sm font-semibold">{formatNumber(convertEthToUsd(price))}</p>
            <p className="text-xs text-muted-foreground">{formatNumber(convertEthToUsd(marketCap))}</p>
          </div>
        </div>
        <div className="flex space-x-2 text-sm">
          <span className="flex items-center"><HeartIcon className="h-4 w-4 mr-1 text-red-500" />{state.health}</span>
          <span className="flex items-center"><ZapIcon className="h-4 w-4 mr-1 text-yellow-500" />{state.power}</span>
          <span className="flex items-center"><SwordIcon className="h-4 w-4 mr-1 text-blue-500" />{state.attack}</span>
          <span className="flex items-center"><ShieldIcon className="h-4 w-4 mr-1 text-green-500" />{state.defense}</span>
        </div>
      </div>
    </div>
  )
}

export const MatchList: React.FC<MatchListProps> = ({ characterId, characters }) => {
  const { data: activities, isLoading, isError } = useCharacterMatches(characterId);
  const convertEthToUsd = useConvertEthToUsd();
  const [visibleActivities, setVisibleActivities] = useState<MatchEndActivity[]>([]);
  const [page, setPage] = useState(0);
  const observer = useRef<IntersectionObserver | null>(null);

  const loadMoreActivities = useCallback(() => {
    if (activities) {
      const newPage = page + 1;
      const newActivities = activities.slice(0, newPage * 10);
      setVisibleActivities(newActivities);
      setPage(newPage);
    }
  }, [activities, page]);

  const lastActivityRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && activities && visibleActivities.length < activities.length) {
          loadMoreActivities();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, activities, visibleActivities, loadMoreActivities]
  );

  React.useEffect(() => {
    if (activities) {
      setVisibleActivities(activities.slice(0, 10));
    }
  }, [activities]);

  if (isLoading) {
    return <div className="match-list-loading">Loading match history...</div>;
  }

  if (isError) {
    return <div className="match-list-error">Error loading match history. Please try again later.</div>;
  }

  if (!activities || activities.length === 0) {
    return <div className="match-list-empty">No match history available.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Player 1</TableHead>
          <TableHead>Player 2</TableHead>
          <TableHead>Results</TableHead>
          <TableHead>Price Change</TableHead>
          <TableHead>MkCap change</TableHead>
          <TableHead>Timestamp</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visibleActivities.map((match: MatchEndActivity, index: number) => {
          const isPlayer1 = match.p1 === characterId;
          const playerIndex = isPlayer1 ? '1' : '2';
          const opponentIndex = isPlayer1 ? '2' : '1';

          return (
            <TableRow key={match.id} ref={index === visibleActivities.length - 1 ? lastActivityRef : null}>
              <TableCell>
                <Link to={`/character/${match.p1}`}>
                  <CharacterCard 
                    convertEthToUsd={convertEthToUsd}
                    id={match.p1} 
                    state={match.state1} 
                    price={match.tokenState.prevPrice1}
                    marketCap={match.tokenState.prevMarketCap1}
                    characters={characters}
                  />
                </Link>
              </TableCell>
              <TableCell>
                <Link to={`/character/${match.p2}`}>
                  <CharacterCard 
                    convertEthToUsd={convertEthToUsd}
                    id={match.p2} 
                    state={match.state2}
                    price={match.tokenState.prevPrice2}
                    marketCap={match.tokenState.prevMarketCap2}
                    characters={characters}
                  />
                </Link>
              </TableCell>
              <TableCell>
                <span className={`font-semibold ${match.winner == characterId ? 'text-green-500' : 'text-red-500'}`}>
                  {match.winner == characterId ? 'Won' : 'Lost'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  {match.tokenState[`newPrice${playerIndex}`] > match.tokenState[`prevPrice${playerIndex}`] ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={match.tokenState[`newPrice${playerIndex}`] > match.tokenState[`prevPrice${playerIndex}`] ? 'text-green-500' : 'text-red-500'}>
                    {formatNumber(Math.abs(match.tokenState[`newPrice${playerIndex}`]))}
                  </span>
                  <span className="ml-1 text-muted-foreground">
                    ({formatPercentage(Math.abs((match.tokenState[`newPrice${playerIndex}`] - match.tokenState[`prevPrice${playerIndex}`]) / match.tokenState[`prevPrice${playerIndex}`]))})
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  {match.tokenState[`newMarketCap${playerIndex}`] > match.tokenState[`prevMarketCap${playerIndex}`] ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={match.tokenState[`newMarketCap${playerIndex}`] > match.tokenState[`prevMarketCap${playerIndex}`] ? 'text-green-500' : 'text-red-500'}>
                    {formatNumber(Math.abs(match.tokenState[`newMarketCap${playerIndex}`]))}
                  </span>
                  <span className="ml-1 text-muted-foreground">
                    ({formatPercentage(Math.abs((match.tokenState[`newMarketCap${playerIndex}`] - match.tokenState[`prevMarketCap${playerIndex}`]) / match.tokenState[`prevMarketCap${playerIndex}`]))})
                  </span>
                </div>
              </TableCell>
              <TableCell>{timeSince(match.timestamp)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  )
}
