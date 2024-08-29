import { useNavigate } from 'react-router-dom';
import { Image } from 'react-bootstrap';

import React, { useEffect, useState } from 'react';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import useWebSocket from 'react-use-websocket';
import { Attribute, Character } from "@memeclashtv/types"
import { useCharacterPerformance, useCharacters } from "../hooks/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { ArrowDownIcon, ArrowUpIcon, ChevronDown, ChevronUp, Diamond, Flame, Heart, Shield, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

const cutText = (text, maxLength) => {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '..';
    }
    return text;
};

export const formatFloat = (x, f) => {
    return Number.parseFloat(x).toExponential(f);
};

export const convertEthToUsd = (eth) => {
    const rate = 2656.84;
    return eth?.toFixed(10)
}

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


export const CharacterListItem = ({ character }: { character: Character }) => {
    const yesterday = (new Date().getTime()/ 1000) - 86400;
    const { data: performance, isLoading, isError } = useCharacterPerformance(character.id, yesterday);
    const navigate = useNavigate();
    console.log("performance found", performance)

    const handleClick = () => {
        navigate(`/character/${character.id}`);
    };

    return (
        <TableRow 
            onClick={handleClick}
        key={character.id}>
              <TableCell className="p-2">
                <div className="flex items-start space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={character.pfp} alt={character.name} />
                    <AvatarFallback>{character.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">{character.name}</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Object.entries({
                        health: Attribute.health,
                        power: Attribute.power,
                        attack: Attribute.attack,
                        defense: Attribute.defense,
                        speed: Attribute.speed
                      }).map(([key, value]) => (
                        <AttributeIcon key={key} attribute={value as Attribute} value={character[key]} />
                      ))}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="p-2 text-sm">
                ${character.value.toFixed(8)}
              </TableCell>
              <TableCell className="p-2 text-sm">${character.price.toFixed(8)}</TableCell>
              <TableCell className="p-2">
                <div className={`flex items-center text-sm ${performance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {performance >= 0 ? <ArrowUpIcon className="mr-0.5 h-3 w-3" /> : <ArrowDownIcon className="mr-0.5 h-3 w-3" />}
                  {Math.abs(performance).toFixed(1)}%
                </div>
              </TableCell>
            </TableRow>

        // <ListGroup.Item className="character-list-item bg-dark text-white" onClick={handleClick}>
        //     <div className="character-list-item-identity">
        //         <Image
        //             src={character?.pfp}
        //             alt={"Hi"}
        //             height={41}
        //             width={41}
        //             className="character-list-item-avatar"
        //         />
        //         <p className="character-list-item-name">{cutText(character?.name, 8)}</p>
        //     </div>
        //     <p className="character-list-item-price">${convertEthToUsd(character?.value) ?? "0"}</p>
        //     <p className="character-list-item-price">${convertEthToUsd(character?.price) ?? "0"}</p>
        //     <p className={"character-list-item-price " + (performance >= 0 ? "text-success" : "text-danger")}>{
        //         (isLoading && performance == undefined) ? "Loading..." : isError ? "Error" : `%${performance.toFixed(2)}`
        //     }</p>
        // </ListGroup.Item>
    );
}

type SortColumn = 'marketCap' | 'price' | 'performance'
type SortDirection = 'asc' | 'desc'



export const CharacterList = () => {
    const { data: characters, isLoading, isError } = useCharacters();

    const navigate = useNavigate();

    const [sortColumn, setSortColumn] = useState<SortColumn>('marketCap')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

//   const sortedCharacters = [...characters].sort((a, b) => {
//     let aValue, bValue
//     switch (sortColumn) {
//       case 'marketCap':
//         aValue = a.value
//         bValue = b.value
//         break
//       case 'price':
//         aValue = a.price
//         bValue = b.price
//         break
//       case 'performance':
//         aValue = a.price
//         bValue = b.price
//         break
//     }
//     return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
//   })

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
        <ScrollArea className="h-full w-full rounded-md border">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3 min-w-[200px]">Character</TableHead>
                <TableHead className="w-1/4 p-1 min-w-[100px]">
                  <SortButton column="marketCap">
                    <span className="hidden sm:inline">Market Cap</span>
                    <span className="sm:hidden">MC</span>
                  </SortButton>
                </TableHead>
                <TableHead className="w-1/4 p-1 min-w-[80px]">
                  <SortButton column="price">Price</SortButton>
                </TableHead>
                <TableHead className="w-1/6 p-1 min-w-[80px]">
                  <SortButton column="performance">24h</SortButton>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>                    
                {characters
                    .sort((a, b) => b.value - a.value)
                    .map((character: any, index: number) => (
                        <CharacterListItem key={index} character={character} />
                    ))}
            </TableBody>
          </Table>
        </ScrollArea>
    );
};
