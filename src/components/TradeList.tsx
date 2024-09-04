import React from 'react';
import { TradeActivity } from '@memeclashtv/types/activity';
import { TradeListItem } from './TradeListItem';
import { useCharacterTrades, useUsers } from '../hooks/api';
import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { truncateWallet } from './NavBar';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

interface TradeListProps {
  characterId: number;
  characterImage: string;
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 10 
  }).format(num)
}

const formatPercent = (num: number) => {
  return (num * 100).toFixed(2) + '%'
}

const timeSince = (date: number) => {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const seconds = now - date;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min ago`;
};


const TraderCard = ({ 
  pfp,
  trader,
}: { 
  pfp: string,
  trader: string
}) => {
  const navigate = useNavigate(); // Initialize useNavigate
  const displayName = (trader as any)?.username ?? truncateWallet(trader);
  return (
    <div 
      className="flex items-center space-x-4 cursor-pointer" 
      onClick={() => navigate(`/user/${trader}`)} // Navigate to user's page on click
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={pfp ?? "/placeholder.svg?height=40&width=40"} alt={trader} />
        <AvatarFallback>{trader[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-grow">
        <p className="font-semibold">{trader}</p>
      </div>
    </div>
  )
}

const CharacterAvatar = ({ characterId, image }: { characterId: number, image:string }) => {
  return (
    <Avatar className="h-6 w-6">
      <AvatarImage src={`/placeholder.svg?height=24&width=24&text=${characterId}`} alt={`Character ${characterId}`} />
      <AvatarFallback>{characterId}</AvatarFallback>
    </Avatar>
  )
}

export const TradeList: React.FC<TradeListProps> = ({ characterId, characterImage }) => {
  const { data: trades, isLoading, isError } = useCharacterTrades(characterId);
  const { data: users } = useUsers(); // Fetch users

  if (isLoading) {
    return <div className="trade-list-loading">Loading trades...</div>;
  }

  if (isError) {
    return <div className="trade-list-error">Error loading trades. Please try again.</div>;
  }

  if (!trades || trades.length === 0) {
    return <div className="trade-list-empty">No trades found.</div>;
  }


  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Buy/Sell</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Cost</TableHead>
          <TableHead>Price impact</TableHead>
          <TableHead>Market Cap Change</TableHead>
          <TableHead className="text-right">Timestamp</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.map((trade, index) => {
          const user = users?.find(user => user?.address?.toLowerCase() == trade?.trader?.toLowerCase())
          const pfp = (user as any)?.pfp;
          return (
          <TableRow key={index}>
            <TableCell>
              <TraderCard trader={user?.address} pfp={pfp}/> {/* Pass userId here */}
            </TableCell>
            <TableCell>
              <span className={`font-semibold ${trade.isBuy ? 'text-green-500' : 'text-red-500'}`}>
                {trade.isBuy ? "BUY" : "SELL"}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <CharacterAvatar characterId={trade.character} image={characterImage} />
                <span>{trade.shareAmount.toLocaleString()}</span>
              </div>
            </TableCell>
            <TableCell>{formatNumber(trade.ethAmount)}</TableCell>
            <TableCell>
              <div className="flex items-center">
                {trade.newPrice > trade.prevPrice ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={trade.newPrice > trade.prevPrice ? 'text-green-500' : 'text-red-500'}>
                  {formatNumber(Math.abs(trade.newPrice - trade.prevPrice))}
                </span>
                <span className="ml-1 text-muted-foreground">
                  ({formatPercent(Math.abs((trade.newPrice - trade.prevPrice) / trade.prevPrice))})
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center">
                {trade.newMarketCap > trade.prevMarketCap ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={trade.newMarketCap > trade.prevMarketCap ? 'text-green-500' : 'text-red-500'}>
                  {formatNumber(Math.abs(trade.newMarketCap - trade.prevMarketCap))}
                </span>
                <span className="ml-1 text-muted-foreground">
                  ({formatPercent(Math.abs((trade.newMarketCap - trade.prevMarketCap) / trade.prevMarketCap))})
                </span>
              </div>
            </TableCell>
            <TableCell className="text-right">{timeSince(trade.timestamp)}</TableCell>
          </TableRow>)
        })}
      </TableBody>
    </Table>
  )
}