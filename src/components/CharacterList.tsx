import { useNavigate } from 'react-router-dom';
import { Image } from 'react-bootstrap';

import React, { useEffect, useMemo, useState } from 'react';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import useWebSocket from 'react-use-websocket';
import { Attribute, Character } from "@memeclashtv/types"
import { useBattleState, useCharacterPerformance, useCharacters } from "../hooks/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { ArrowDownIcon, ArrowUpIcon, ChevronDown, ChevronUp, Diamond, Flame, Heart, Shield, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { useConvertEthToUsd } from '../EthPriceProvider';
import { formatNumber } from '../lib/utils';
import { useAllCharacterPerformance } from '../hooks/api';
import { getMatchesUntilNextMatchForCharacters } from './CharacterPage';

const cutText = (text, maxLength) => {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '..';
    }
    return text;
};

export const formatFloat = (x, f) => {
    return Number.parseFloat(x).toExponential(f);
};

const AttributeIcon = ({ attribute, value }: { attribute: Attribute, value: number }) => {
    const icons: Record<Attribute, React.ReactNode> = {
      [Attribute.health]: <Heart className="w-3 h-3 text-green-500" />,
      [Attribute.power]: <Diamond className="w-3 h-3 text-blue-500" />,
      [Attribute.attack]: <Flame className="w-3 h-3 text-orange-500" />,
      [Attribute.defense]: <Shield className="w-3 h-3 text-gray-500" />,
      [Attribute.speed]: <Zap className="w-3 h-3 text-yellow-500" />
    }
  
    const colors: Record<Attribute, string> = {
      [Attribute.health]: 'text-green-500',
      [Attribute.power]: 'text-blue-500',
      [Attribute.attack]: 'text-orange-500',
      [Attribute.defense]: 'text-gray-500',
      [Attribute.speed]: 'text-yellow-500'
    }
    console.log("value: ", value)
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-0.5">
              {icons[attribute]}
              <span className={`text-xs font-bold ${colors[attribute]}`}>{value}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{attribute}: {value}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }


export const CharacterListItem = ({ character, performance, matchesTillNextMatch }: { character: Character, performance: number, matchesTillNextMatch: number }) => {
  const convertEthToUsd = useConvertEthToUsd();
  const navigate = useNavigate();
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    setCursorPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleClick = () => {
    navigate(`/character/${character.id}`);
  };

  return (
    <TableRow 
      onClick={handleClick}
      
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`cursor-pointer py-20 group ${isHovered ? 'breathing-effect-fast' : ''}`}
      key={character.id}
      style={{
        //transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        //transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        //boxShadow: isHovered ? '0 0 15px rgba(255, 255, 0, 0.7)' : 'none',
      }}
    >
      <TableCell className="px-3 py-3">
        <div className="flex items-start items-center space-x-5">
          <Avatar className="w-8 h-8 border">
            <AvatarImage src={character.pfp} alt={character.name} />
            <AvatarFallback>{character.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold text-[12px]">{character.name}</div>
            <div className="text-xs text-gray-500">{matchesTillNextMatch} {matchesTillNextMatch === 1 ? 'match' : 'matches'} till next match</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="p-2 text-md">{formatNumber(convertEthToUsd(character.price))}</TableCell>
      <TableCell className="p-2">
        <div className={`flex items-center text-md ${performance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {performance >= 0 ? <ArrowUpIcon className="mr-0.5 h-3 w-3" /> : <ArrowDownIcon className="mr-0.5 h-3 w-3" />}
          {Math.abs(performance).toFixed(1)}%
        </div>
      </TableCell>
      <TableCell className="p-2 text-md">
        {formatNumber(convertEthToUsd(character.value))}
      </TableCell>
      {isHovered && (
        <p 
          className="fixed text-yellow-500 text-sm font-light breathing-effect-fast"
          style={{position:'fixed', top: 7, left: '10%' }} // Adjusted position
        >
          Buy Me!
        </p>
      )}
    </TableRow>
  );
}

type SortColumn = 'marketCap' | 'price' | 'performance'
type SortDirection = 'asc' | 'desc'



export const CharacterList = () => {
    const { data: characters, isLoading, isError } = useCharacters();
    const [sortColumn, setSortColumn] = useState<SortColumn>('marketCap')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
    const convertEthToUsd = useConvertEthToUsd()
    const yesterday = useMemo(() => (new Date().getTime() / 1000) - 86400, []);
    const { data: battleState } = useBattleState()
    const characterPerformance = useAllCharacterPerformance(characters?.map(c => c.id) ?? [], yesterday);
    const performanceMap = useMemo(() => {
        return characterPerformance?.reduce((acc, curr) => {
            acc[curr.characterId] = curr.data;
            return acc;
        }, {});
    }, [characterPerformance]);
    const matchesTillNextMatchArray = useMemo(() => {
      if (!battleState) {
        console.log("No battle state")
        return {}
      }
      const characterIds = characters?.map(c => String(c.id)) ?? [];
      return getMatchesUntilNextMatchForCharacters(characterIds, battleState.currentMatch);
    }, [characters, battleState]);
    console.log('matches till next', matchesTillNextMatchArray)
    const navigate = useNavigate();
    const sortedCharacters = useMemo(() => {
        if (!characters) return [];
        return [...characters].sort((a, b) => {
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
                    const aPerf = performanceMap[a.id] || 0;
                    const bPerf = performanceMap[b.id] || 0;
                    aValue = aPerf;
                    bValue = bPerf;
                    break;
            }
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        });
    }, [characters, sortColumn, sortDirection, yesterday]);

    const handleSort = (column: SortColumn) => {
        if (column === sortColumn) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(column)
            setSortDirection('desc')
        }
    }

    const SortButton = ({ column, children }: { column: SortColumn, children: React.ReactNode }) => (
        <Button
            variant="ghost"
            onClick={() => handleSort(column)}
            className="h-8 px-2 text-xs font-bold"
            aria-sort={sortColumn === column ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
            {children}
            {sortColumn === column && (
                sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
            )}
        </Button>
    )

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (isError) {
        return <div>Error</div>;
    }

    const handleCharacterClick = (characterName: string) => {
        navigate(`/character/${characterName}`);
    };

    return (
      <div className='flex flex-col h-full rounded-lg border bg-[#151519]'
      style={{
        overflowX: 'hidden'
      }}>
        <div className="p-4 bg-[#1F1F23] border-rounded m-3 sticky">
            <h2 className="text-lg font-bold text-center">Characters {" "}
              <span className='breathing-effect text-sm font-light text-gray-300 inline-block'> Buy a Character<ArrowDownIcon className='w-4 h-4 inline-block'/></span>
            </h2>
          </div>
        <ScrollArea className="h-full w-full">
          <Table className="w-full overflow-hidden">
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3 min-w-[200px]">Character</TableHead>
                <TableHead className="w-1/4 p-1 min-w-[80px]">
                  <SortButton column="price">Price</SortButton>
                </TableHead>
                <TableHead className="w-1/6 p-1 min-w-[80px]">
                  <SortButton column="performance">24h</SortButton>
                </TableHead>
                
                <TableHead className="w-1/4 p-1 min-w-[100px]">
                  <SortButton column="marketCap">
                    <span className="hidden sm:inline">MCap</span>
                    <span className="sm:hidden">MC</span>
                  </SortButton>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody> 
                {battleState?.currentMatch}    {"  "}               
                {sortedCharacters
                    .map((character: any, index: number) => (
                        <CharacterListItem 
                        key={index} 
                        character={character} 
                        performance={performanceMap[character.id]} 
                        matchesTillNextMatch={matchesTillNextMatchArray[character.id]}
                        />
                    ))}
            </TableBody>
          </Table>
        </ScrollArea>
        </div>
    );
};
